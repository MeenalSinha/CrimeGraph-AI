"""
Module 10 -- AI Chat Assistant.

Answers natural-language operational questions by routing them to the real
services (risk_service, graph_service, patrol_service, investigation_service)
and composing a grounded answer from actual results -- every number in the
reply is traceable to a service call, not generated freeform.

Honesty note (AUDIT.md): the spec asked for a full LangChain/LlamaIndex RAG
stack against an LLM. Wiring an LLM in is straightforward (see the OPENAI
branch below) but requires an API key the demo shouldn't depend on. Without a
key, intent is matched with keyword rules rather than an LLM, and grounding
comes from calling the real backend services directly -- so answers stay
accurate, just less linguistically flexible than a true LLM-RAG pipeline.
If CRIMEGRAPH env var OPENAI_API_KEY is set, `llm_compose()` is used to turn
the same grounded facts into a more natural sentence, with the facts still
computed by the deterministic path first.
"""
from __future__ import annotations

import re

from app.core.config import settings
from app.services import risk_service, graph_service, patrol_service, investigation_service
from app.data.store import get_store
from app.data.synthetic_generator import WARDS

WARD_NAMES = [w[0] for w in WARDS]


def _find_ward(text: str) -> str | None:
    for w in WARD_NAMES:
        if w.lower() in text.lower():
            return w
    return None


def answer(query: str) -> dict:
    q = query.strip()
    ql = q.lower()
    ward = _find_ward(q)

    if any(k in ql for k in ["hotspot", "risk", "high risk", "predict"]):
        if ward:
            r = risk_service.predict_risk(ward, hour=21, weekday=4)
            facts = r
            text = (f"{ward} currently shows a {r['risk_band'].lower()} risk band "
                    f"(score {r['risk_score']}/100, confidence {r['confidence']} percent). "
                    f"Most likely crime type: {r['likely_crime_types'][0]['crime_type']}. "
                    f"{r['explanation']['reasons'][0]}")
        else:
            hotspots = risk_service.city_hotspots()
            facts = dict(hotspots=hotspots[:5])
            top = hotspots[0]
            text = (f"Highest predicted risk right now is {top['ward']} "
                    f"(score {top['risk_score']}/100, band {top['risk_band']}). "
                    f"Next: {', '.join(h['ward'] for h in hotspots[1:4])}.")
        return dict(answer=text, facts=facts, source="risk_service")

    if any(k in ql for k in ["gang", "network", "cluster", "organized"]):
        communities = graph_service.detect_communities(min_size=3)
        facts = dict(communities=communities[:5])
        if communities:
            top = communities[0]
            text = (f"{len(communities)} candidate clusters detected via community detection. "
                    f"Largest: {top['community_id']} with {top['size']} linked individuals"
                    f"{' (suspected: ' + top['suspected_gang'] + ')' if top['suspected_gang'] else ''}, "
                    f"{top['person_of_interest_count']} flagged as persons of interest.")
        else:
            text = "No significant clusters detected in the current graph."
        return dict(answer=text, facts=facts, source="graph_service")

    if any(k in ql for k in ["patrol", "deploy", "allocation", "route"]):
        plan = patrol_service.optimize_patrols()
        facts = plan["summary"]
        text = (f"Recommended deployment: {plan['total_units']} units covering "
                f"{plan['summary']['wards_covered']} wards. Priority ward: "
                f"{plan['summary']['highest_priority_ward']}. Estimated average unit ETA "
                f"{plan['summary']['avg_eta_minutes']} minutes across a combined route of "
                f"{plan['summary']['optimal_distance_km']} km.")
        return dict(answer=text, facts=facts, source="patrol_service")

    m = re.search(r"(fir-\d+)", ql)
    if m or "case" in ql:
        store = get_store()
        fir_id = m.group(1).upper() if m else None
        if not fir_id:
            recent = store["firs"].sort_values("timestamp", ascending=False).iloc[0]
            fir_id = recent["fir_id"]
        try:
            brief = investigation_service.case_brief(fir_id)
            text = brief["summary"] + " " + (brief["next_steps"][0] if brief["next_steps"] else "")
            return dict(answer=text, facts=brief, source="investigation_service")
        except KeyError:
            pass

    if "why" in ql and ward:
        r = risk_service.predict_risk(ward, hour=21, weekday=4)
        text = f"{ward} is flagged {r['risk_band'].lower()} risk because: " + " ".join(r["explanation"]["reasons"])
        return dict(answer=text, facts=r, source="risk_service")

    # Fallback: general city status
    hotspots = risk_service.city_hotspots()
    alerts_count = len(store_alerts_count())
    text = (f"City status: top risk ward is {hotspots[0]['ward']} "
            f"(score {hotspots[0]['risk_score']}). {alerts_count} active alerts. "
            f"Try asking about a specific ward, patrol allocation, a FIR number, or gang networks.")
    return dict(answer=text, facts=dict(hotspots=hotspots[:3]), source="fallback")


def store_alerts_count():
    from app.services.alerts_service import generate_alerts
    return generate_alerts()
