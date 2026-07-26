"""
Standalone verification script for the PostgreSQL backend. Run against a real
database to prove the full round trip works: schema creation, seeding,
reading back through the DataStore abstraction, and referential integrity.

    CRIMEGRAPH_DATABASE_URL=postgresql://user:pass@host/db \
    python scripts/verify_database.py

This is the script referenced in AUDIT.md as how the Postgres integration
claims were actually checked during development (against a real, running
PostgreSQL 16 instance) -- not just written against the SQLAlchemy API and
assumed to work.
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from sqlalchemy import text


def main():
    url = os.getenv("CRIMEGRAPH_DATABASE_URL")
    if not url:
        print("Set CRIMEGRAPH_DATABASE_URL first, e.g.:")
        print("  export CRIMEGRAPH_DATABASE_URL=postgresql://crimegraph:pass@localhost/crimegraph_ai")
        sys.exit(1)

    from app.data.db_models import init_schema

    print("[1/5] Creating schema (idempotent)...")
    engine = init_schema(url)
    print("      OK")

    print("[2/5] Seeding from synthetic data generator...")
    from app.data.db_seed import seed
    counts = seed(url)
    for table, n in counts.items():
        assert n > 0, f"Table {table} is empty after seeding"
    print(f"      OK -- {sum(counts.values())} total rows across {len(counts)} tables")

    print("[3/5] Reading back through the DataStore abstraction...")
    os.environ["CRIMEGRAPH_DATABASE_URL"] = url
    from app.data.store import DataStore
    DataStore._instance = None  # force a fresh load for this check
    store = DataStore.instance()
    assert store.backend == "postgresql"
    assert len(store["firs"]) == counts["firs"]
    assert len(store["persons"]) == counts["persons"]
    print(f"      OK -- backend={store.backend}, firs={len(store['firs'])}, persons={len(store['persons'])}")

    print("[4/5] Verifying referential integrity with a real join query...")
    with engine.connect() as conn:
        orphans = conn.execute(text(
            "SELECT COUNT(*) FROM firs WHERE suspect_id IS NOT NULL "
            "AND suspect_id NOT IN (SELECT person_id FROM persons)"
        )).scalar()
        assert orphans == 0, f"Found {orphans} FIRs with a suspect_id not present in persons"
        joined = conn.execute(text(
            "SELECT COUNT(*) FROM firs f JOIN persons p ON f.suspect_id = p.person_id"
        )).scalar()
    print(f"      OK -- 0 orphaned foreign keys, {joined} FIRs successfully join to a suspect")

    print("[5/5] Verifying every service can run against this backend...")
    from app.services import risk_service, graph_service, patrol_service, analytics_service
    r = risk_service.predict_risk("Central Zone", hour=21, weekday=4)
    assert 0 <= r["risk_score"] <= 100
    g = graph_service.graph_stats()
    assert g["node_count"] > 1000
    p = patrol_service.optimize_patrols()
    assert p["total_units"] > 0
    a = analytics_service.district_comparison()
    assert len(a) > 0
    print("      OK -- risk_service, graph_service, patrol_service, analytics_service all functional")

    print("\nAll checks passed against a real PostgreSQL database.")


if __name__ == "__main__":
    main()
