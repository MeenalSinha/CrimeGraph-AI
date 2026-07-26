"""
Seeds a PostgreSQL database from the synthetic city data. Run standalone:

    CRIMEGRAPH_DATABASE_URL=postgresql://user:pass@host/db \
    python -m app.data.db_seed

Idempotent-ish: truncates and reloads every table each run (this is a demo
seed script, not a production migration tool -- a real deployment would use
Alembic migrations for schema changes and a separate ETL/ingestion pipeline
for data, not a one-shot truncate-and-reload).
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import pandas as pd
from sqlalchemy import text

from app.core.config import DATA_DIR
from app.data.db_models import (
    Base, Station, Person, Vehicle, Phone, Account, FIR, Call, Transfer, Association,
    init_schema, get_session_factory,
)
from app.data.synthetic_generator import generate_and_save

_TABLES = ["stations", "persons", "vehicles", "phones", "accounts",
           "firs", "calls", "transfers", "associations"]


def _load_csv_tables() -> dict[str, pd.DataFrame]:
    """Reads the generated CSVs directly (not via app.data.store.get_store(),
    which would create a circular dependency: store -> seed -> store when the
    Postgres backend seeds itself on first boot against an empty database)."""
    if not (DATA_DIR / "firs.csv").exists():
        generate_and_save()
    tables = {}
    for t in _TABLES:
        tables[t] = pd.read_csv(DATA_DIR / f"{t}.csv", keep_default_na=False, na_values=[])
    tables["firs"]["timestamp"] = pd.to_datetime(tables["firs"]["timestamp"])
    tables["calls"]["timestamp"] = pd.to_datetime(tables["calls"]["timestamp"])
    tables["transfers"]["timestamp"] = pd.to_datetime(tables["transfers"]["timestamp"])
    return tables


def seed(database_url: str):
    engine = init_schema(database_url)
    Session = get_session_factory(database_url)
    session = Session()

    store = _load_csv_tables()

    try:
        # Clear existing data (demo reseed, not a production migration path).
        for table in reversed(Base.metadata.sorted_tables):
            session.execute(table.delete())
        session.commit()

        stations_df = store["stations"]
        session.bulk_insert_mappings(Station, stations_df.to_dict("records"))
        session.commit()

        persons_df = store["persons"]
        session.bulk_insert_mappings(Person, persons_df.to_dict("records"))
        session.commit()

        vehicles_df = store["vehicles"]
        session.bulk_insert_mappings(Vehicle, vehicles_df.to_dict("records"))
        session.commit()

        phones_df = store["phones"]
        session.bulk_insert_mappings(Phone, phones_df.to_dict("records"))
        session.commit()

        accounts_df = store["accounts"]
        session.bulk_insert_mappings(Account, accounts_df.to_dict("records"))
        session.commit()

        firs_df = store["firs"].copy()
        fir_records = firs_df.to_dict("records")
        for rec in fir_records:
            if rec.get("suspect_id") == "" or (isinstance(rec.get("suspect_id"), float) and pd.isna(rec["suspect_id"])):
                rec["suspect_id"] = None
        session.bulk_insert_mappings(FIR, fir_records)
        session.commit()

        calls_df = store["calls"]
        session.bulk_insert_mappings(Call, calls_df.to_dict("records"))
        session.commit()

        transfers_df = store["transfers"]
        session.bulk_insert_mappings(Transfer, transfers_df.to_dict("records"))
        session.commit()

        assoc_df = store["associations"].copy()
        assoc_df = assoc_df.drop(columns=["id"], errors="ignore")
        session.bulk_insert_mappings(Association, assoc_df.to_dict("records"))
        session.commit()

        counts = {}
        for table in Base.metadata.sorted_tables:
            n = session.execute(text(f"SELECT COUNT(*) FROM {table.name}")).scalar()
            counts[table.name] = n
        return counts
    finally:
        session.close()


if __name__ == "__main__":
    url = os.getenv("CRIMEGRAPH_DATABASE_URL")
    if not url:
        print("Set CRIMEGRAPH_DATABASE_URL to a PostgreSQL connection string first.")
        sys.exit(1)
    counts = seed(url)
    print("Seeded PostgreSQL database:")
    for table, n in counts.items():
        print(f"  {table:15s} {n:6d} rows")
