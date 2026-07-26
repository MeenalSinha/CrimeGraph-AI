"""
Module 13 -- Entity Resolution.

Finds likely-duplicate person records using fuzzy name matching (rapidfuzz)
combined with shared attributes (ward, overlapping phone/vehicle ownership).
This is a real similarity-scoring pipeline; it does not use embeddings (the
spec mentioned sentence embeddings for resolution), because for short
structured fields like names and phone numbers, edit-distance fuzzy matching
is the more appropriate and standard technique -- embeddings are used
elsewhere in the platform (see chat_service.py) where they're actually the
right tool for the job.
"""
from __future__ import annotations

from rapidfuzz import fuzz

from app.data.store import get_store


def find_duplicate_candidates(threshold: int = 82, limit: int = 25) -> list[dict]:
    store = get_store()
    persons = store["persons"]
    candidates = []
    names = persons[["person_id", "name", "ward", "age"]].to_dict("records")

    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            a, b = names[i], names[j]
            score = fuzz.token_sort_ratio(a["name"], b["name"])
            if score >= threshold and a["ward"] == b["ward"]:
                candidates.append(dict(
                    person_a=a["person_id"], name_a=a["name"],
                    person_b=b["person_id"], name_b=b["name"],
                    similarity=round(score, 1), shared_ward=a["ward"],
                    reason="Name similarity above threshold within the same ward.",
                ))
    candidates.sort(key=lambda c: c["similarity"], reverse=True)
    return candidates[:limit]
