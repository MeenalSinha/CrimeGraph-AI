"""
Module 14 -- Global Search.

Searches across persons, vehicles, phones, FIRs, and police stations by
substring / fuzzy match, returning a unified, typed result list for instant
navigation from the UI's global search bar.
"""
from __future__ import annotations

from app.data.store import get_store


def global_search(query: str, limit: int = 20) -> list[dict]:
    q = query.strip().lower()
    if not q:
        return []
    store = get_store()
    results = []

    persons = store["persons"]
    hits = persons[persons["name"].str.lower().str.contains(q) | persons["person_id"].str.lower().str.contains(q)]
    for r in hits.head(limit).itertuples():
        results.append(dict(type="person", id=r.person_id, label=r.name,
                             subtitle=f"{r.ward} -- risk {r.risk_score}"))

    vehicles = store["vehicles"]
    hits = vehicles[vehicles["plate"].str.lower().str.contains(q) | vehicles["vehicle_id"].str.lower().str.contains(q)]
    for r in hits.head(limit).itertuples():
        results.append(dict(type="vehicle", id=r.vehicle_id, label=r.plate, subtitle=r.type))

    phones = store["phones"]
    hits = phones[phones["number"].str.lower().str.contains(q)]
    for r in hits.head(limit).itertuples():
        results.append(dict(type="phone", id=r.phone_id, label=r.number, subtitle=f"owner {r.owner_id}"))

    firs = store["firs"]
    hits = firs[firs["fir_id"].str.lower().str.contains(q) | firs["crime_type"].str.lower().str.contains(q)]
    for r in hits.head(limit).itertuples():
        results.append(dict(type="case", id=r.fir_id, label=f"{r.fir_id} -- {r.crime_type}",
                             subtitle=f"{r.ward} -- {r.status}"))

    stations = store["stations"]
    hits = stations[stations["name"].str.lower().str.contains(q)]
    for r in hits.head(limit).itertuples():
        results.append(dict(type="station", id=r.station_id, label=r.name, subtitle=r.ward))

    return results[:limit]
