"""
Module 4 -- Investigation Copilot.

Given a FIR (case), pulls the graph neighbourhood, related cases (same ward /
crime type / linked suspect), and produces a structured case brief: timeline,
connected suspects, possible accomplices (graph neighbours of the suspect who
are also POIs), and suggested next steps. Generation is deterministic /
template-grounded in the actual graph and data -- not a hallucinated LLM
narrative -- unless OPENAI_API_KEY is set (see chat_service.py for the same
pattern). This keeps the "investigation suggestions" auditable, which matters
more for a policing tool than a flashier chat writeup would.
"""
from __future__ import annotations

from app.data.store import get_store
from app.services import graph_service


def case_brief(fir_id: str) -> dict:
    store = get_store()
    firs = store["firs"]
    row = firs[firs.fir_id == fir_id]
    if row.empty:
        raise KeyError(fir_id)
    fir = row.iloc[0]

    related = firs[
        (firs.fir_id != fir_id)
        & ((firs.ward == fir.ward) & (firs.crime_type == fir.crime_type))
    ].sort_values("timestamp", ascending=False).head(5)

    suspect_block = None
    accomplices = []
    G = graph_service.build_graph()
    if fir.suspect_id and fir.suspect_id in G:
        try:
            neighborhood = graph_service.expand_node(fir.suspect_id, depth=1, limit=25)
        except KeyError:
            neighborhood = dict(nodes=[], edges=[])
        persons_nearby = [n for n in neighborhood["nodes"] if n.get("type") == "person" and n["id"] != fir.suspect_id]
        accomplices = [
            dict(person_id=p["id"], label=p.get("label"), is_poi=p.get("is_poi", False), gang=p.get("gang", ""))
            for p in persons_nearby if p.get("is_poi")
        ][:6]
        suspect_row = store["persons"][store["persons"].person_id == fir.suspect_id]
        if not suspect_row.empty:
            s = suspect_row.iloc[0]
            suspect_block = dict(
                person_id=s["person_id"], name=s["name"], risk_score=float(s["risk_score"]),
                gang_affiliation=s["gang_affiliation"], prior_case_count=int(
                    len(firs[firs.suspect_id == s["person_id"]])
                ),
            )

    missing_evidence = []
    if fir.weapon == "None" and fir.crime_type in ("Assault", "Robbery", "Extortion"):
        missing_evidence.append("Weapon not logged for a crime type that typically involves one -- verify with responding officer.")
    if not fir.suspect_id:
        missing_evidence.append("No suspect currently linked to this FIR -- cross-check phone/vehicle records near the incident location and time.")
    if len(related) >= 2:
        missing_evidence.append(f"{len(related)} similar {fir.crime_type} cases in {fir.ward} are unlinked -- consider a modus-operandi comparison.")

    next_steps = [
        "Cross-reference call records within +/- 2 hours of the incident timestamp for numbers active near the location.",
    ]
    if accomplices:
        next_steps.append(f"Question known associates flagged as persons of interest: {', '.join(a['label'] for a in accomplices[:3])}.")
    if fir.status == "Under Investigation":
        next_steps.append("Case is open -- prioritize by severity and days elapsed since filing.")
    if len(related) >= 3:
        next_steps.append(f"Pattern detected: {len(related)} similar cases in {fir.ward} -- consider escalating to a dedicated task force.")

    risk_score = int(fir.severity) * 15 + (10 if fir.suspect_id else 0) + len(related) * 4
    risk_score = min(100, risk_score)

    return dict(
        fir_id=fir_id,
        crime_type=fir.crime_type,
        ward=fir.ward,
        severity=int(fir.severity),
        status=fir.status,
        timestamp=str(fir.timestamp),
        weapon=fir.weapon,
        summary=(
            f"{fir.crime_type} reported in {fir.ward} on {fir.timestamp.strftime('%d %b %Y, %H:%M')} "
            f"(severity {fir.severity}/5, status: {fir.status})."
            + (f" A suspect is linked to this FIR." if fir.suspect_id else " No suspect currently linked.")
        ),
        suspect=suspect_block,
        possible_accomplices=accomplices,
        related_cases=[
            dict(fir_id=r.fir_id, timestamp=str(r.timestamp), severity=int(r.severity), status=r.status)
            for r in related.itertuples()
        ],
        missing_evidence=missing_evidence,
        next_steps=next_steps,
        case_risk_score=risk_score,
    )


def list_cases(status: str | None = None, ward: str | None = None, limit: int = 50) -> list[dict]:
    store = get_store()
    df = store["firs"].sort_values("timestamp", ascending=False)
    if status:
        df = df[df.status == status]
    if ward:
        df = df[df.ward == ward]
    df = df.head(limit)
    return [
        dict(fir_id=r.fir_id, crime_type=r.crime_type, ward=r.ward, severity=int(r.severity),
             status=r.status, timestamp=str(r.timestamp), has_suspect=bool(r.suspect_id))
        for r in df.itertuples()
    ]
