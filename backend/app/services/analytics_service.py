"""
Module 9 -- Advanced Analytics.

District comparison, officer productivity, crime recurrence / repeat-offender
stats, and the anomaly-detection wrapper. Crime trend forecasting and emerging
gang detection already live in risk_service.forecast_7day and
graph_service.detect_communities respectively -- this module covers the
remaining Module 9 items that didn't have a home yet: district comparison and
officer productivity.
"""
from __future__ import annotations

from app.data.store import get_store
from app.services import risk_service


def district_comparison() -> list[dict]:
    """Per-ward incident counts, severity, and clearance rate side by side --
    the 'district comparison' item from Module 9's Advanced Analytics list."""
    store = get_store()
    firs = store["firs"]
    out = []
    for ward, grp in firs.groupby("ward"):
        total = len(grp)
        closed = int((grp.status.isin(["Closed", "Chargesheet Filed"])).sum())
        out.append(dict(
            ward=ward,
            total_incidents=total,
            avg_severity=round(float(grp.severity.mean()), 2),
            clearance_rate=round(closed / total * 100, 1) if total else 0.0,
            repeat_offender_linked_cases=int((grp.suspect_id != "").sum()),
        ))
    out.sort(key=lambda d: d["total_incidents"], reverse=True)
    return out


def officer_productivity() -> list[dict]:
    """Cases resolved per officer, by station -- the 'officer productivity'
    item from Module 9's Advanced Analytics list. Uses each station's actual
    officer headcount and actual closed-case count, not a placeholder ratio."""
    store = get_store()
    firs = store["firs"]
    stations = store["stations"]
    out = []
    for _, s in stations.iterrows():
        station_firs = firs[firs.station_id == s["station_id"]]
        closed = int((station_firs.status.isin(["Closed", "Chargesheet Filed"])).sum())
        total = len(station_firs)
        officers = int(s["officer_count"])
        out.append(dict(
            station_id=s["station_id"],
            station_name=s["name"],
            ward=s["ward"],
            officer_count=officers,
            total_cases=total,
            closed_cases=closed,
            cases_per_officer=round(total / officers, 2) if officers else 0.0,
            clearance_rate=round(closed / total * 100, 1) if total else 0.0,
        ))
    out.sort(key=lambda d: d["cases_per_officer"], reverse=True)
    return out


def crime_recurrence() -> dict:
    """Repeat-offender and recurring-location stats -- 'crime recurrence' /
    'repeat offenders' from Module 9's Advanced Analytics list."""
    store = get_store()
    firs = store["firs"]

    suspect_counts = firs[firs.suspect_id != ""]["suspect_id"].value_counts()
    repeat_offenders = int((suspect_counts >= 2).sum())

    ward_type_counts = firs.groupby(["ward", "crime_type"]).size()
    recurring_hotspots = ward_type_counts[ward_type_counts >= 5].reset_index(name="count") \
        if hasattr(ward_type_counts, "reset_index") else None

    top_recurring = []
    if recurring_hotspots is not None:
        for r in recurring_hotspots.sort_values("count", ascending=False).head(10).itertuples():
            top_recurring.append(dict(ward=r.ward, crime_type=r.crime_type, count=int(r.count)))

    return dict(
        total_suspects_with_cases=int((suspect_counts >= 1).sum()),
        repeat_offenders=repeat_offenders,
        max_cases_single_suspect=int(suspect_counts.max()) if len(suspect_counts) else 0,
        recurring_ward_crime_pairs=top_recurring,
    )


def anomalies() -> list[dict]:
    return risk_service.anomaly_check()
