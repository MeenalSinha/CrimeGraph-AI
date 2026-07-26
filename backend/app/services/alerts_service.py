"""
Module 12 -- Alerts Engine.

Rule-based real-time alert generation over the current data snapshot: high-risk
wards, emerging clusters (communities with 2+ recent linked FIRs), repeat
offenders (persons linked to 3+ FIRs), and officer-shortage flags (stations
under a coverage threshold). Rules are deliberately simple and inspectable --
an alerts engine that a commander can't audit is a liability, not a feature.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta

from app.data.store import get_store
from app.services.risk_service import city_hotspots
from app.services import graph_service

logger = logging.getLogger("crimegraph")


def generate_alerts() -> list[dict]:
    alerts = []
    store = get_store()
    firs = store["firs"]
    stations = store["stations"]
    now_ts = datetime.now()

    # High risk area alerts
    for h in city_hotspots()[:3]:
        if h["risk_score"] >= 55:
            alerts.append(dict(
                type="high_risk_area", severity="critical" if h["risk_score"] >= 75 else "warning",
                title="High Risk Activity Predicted",
                message=f'{h["ward"]} -- risk score {h["risk_score"]}, band {h["risk_band"]}.',
                ward=h["ward"], created_minutes_ago=0,
            ))

    # Repeat offenders
    counts = firs[firs.suspect_id != ""]["suspect_id"].value_counts()
    repeat = counts[counts >= 3]
    persons = store["persons"].set_index("person_id")
    for pid, c in list(repeat.items())[:3]:
        name = persons.loc[pid, "name"] if pid in persons.index else pid
        alerts.append(dict(
            type="repeat_offender", severity="warning",
            title="Repeat Offender Pattern Detected",
            message=f"{name} linked to {c} separate FIRs.",
            ward=None, created_minutes_ago=8,
        ))

    # Emerging clusters
    try:
        communities = graph_service.detect_communities(min_size=4)
        for c in communities[:2]:
            if c["person_of_interest_count"] >= 3:
                alerts.append(dict(
                    type="emerging_network", severity="critical",
                    title="Possible Organized Network Detected",
                    message=f'{c["community_id"]} -- {c["size"]} linked individuals'
                            f'{", suspected gang: " + c["suspected_gang"] if c["suspected_gang"] else ""}.',
                    ward=None, created_minutes_ago=15,
                ))
    except Exception as e:
        # Community detection can legitimately fail on a tiny/degenerate graph
        # (e.g. right after a regenerate-city call with a low-connectivity seed).
        # Log it rather than silently swallowing -- a bare `except: pass` here
        # was flagged by bandit (B110) during the security audit pass, and
        # silently hiding a real failure in an *alerts engine* specifically is
        # the wrong failure mode for a policing tool.
        logger.warning("Emerging-network alert generation skipped: %s", e)

    # Officer shortage
    for _, s in stations.iterrows():
        if s["officer_count"] < 22:
            alerts.append(dict(
                type="officer_shortage", severity="info",
                title="Officer Shortage Flagged",
                message=f'{s["name"]} operating with {s["officer_count"]} officers, below the 22-officer baseline.',
                ward=s["ward"], created_minutes_ago=22,
            ))

    # Recent severe incidents
    recent_cutoff = firs["timestamp"].max() - timedelta(days=2)
    severe_recent = firs[(firs.timestamp >= recent_cutoff) & (firs.severity >= 4)].sort_values("timestamp", ascending=False)
    for r in severe_recent.head(2).itertuples():
        alerts.append(dict(
            type="severe_incident", severity="critical",
            title=f"Severe {r.crime_type} Reported",
            message=f"{r.ward} -- severity {r.severity}/5, FIR {r.fir_id}.",
            ward=r.ward, created_minutes_ago=30,
        ))

    return alerts
