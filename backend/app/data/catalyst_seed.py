"""
Catalyst Datastore seeder for CrimeGraph AI.

Reads the locally-generated CSV files and bulk-inserts all rows into the
corresponding Catalyst Datastore tables.  Designed to be idempotent: it
checks the row count before inserting and skips tables that already have data
unless `force=True` is passed.

Usage (run once after creating tables in the Catalyst Console):
    python -m app.data.catalyst_seed

Or called automatically by DataStore._load_from_catalyst() on first boot.
"""
from __future__ import annotations

import logging

import pandas as pd

from app.core.config import DATA_DIR
from app import catalyst_services

logger = logging.getLogger(__name__)

# Tables ordered so FK parents are seeded before children.
_TABLE_ORDER = [
    "stations",
    "persons",
    "vehicles",
    "phones",
    "accounts",
    "firs",
    "calls",
    "transfers",
    "associations",
]

# Columns that contain datetime objects — convert to ISO strings before
# inserting into Catalyst Datastore (which expects plain strings for datetime).
_DATETIME_COLUMNS: dict[str, list[str]] = {
    "firs":      ["timestamp"],
    "calls":     ["timestamp"],
    "transfers": ["timestamp"],
}

# Columns that should be coerced to bool — Catalyst Datastore represents
# booleans as 0/1 integers; convert them explicitly.
_BOOL_COLUMNS: dict[str, list[str]] = {
    "firs":    ["is_night", "is_weekend", "is_festival_day"],
    "persons": ["is_person_of_interest"],
}


def _df_to_rows(table: str, df: pd.DataFrame) -> list[dict]:
    """
    Convert a DataFrame to a list of plain dicts suitable for Catalyst
    Datastore insert, handling type normalisation.
    """
    df = df.copy()

    # datetime → ISO string
    for col in _DATETIME_COLUMNS.get(table, []):
        if col in df.columns:
            df[col] = df[col].astype(str)

    # bool → int (Catalyst Datastore stores booleans as integers)
    for col in _BOOL_COLUMNS.get(table, []):
        if col in df.columns:
            df[col] = df[col].astype(int)

    # Replace NaN / None with empty string to avoid null type issues
    df = df.fillna("")

    return df.to_dict(orient="records")


def seed_table(table: str, force: bool = False) -> int:
    """
    Seed a single Catalyst Datastore table from its local CSV file.

    Args:
        table: Table name (e.g. "firs").
        force: If True, insert even if rows already exist.

    Returns number of rows inserted (0 if skipped).
    """
    csv_path = DATA_DIR / f"{table}.csv"
    if not csv_path.exists():
        logger.warning("CSV not found for table '%s': %s", table, csv_path)
        return 0

    if not force:
        count = catalyst_services.get_row_count(table)
        if count > 0:
            logger.info("Skipping '%s' — already has %d rows", table, count)
            return 0

    df = pd.read_csv(csv_path, keep_default_na=False, na_values=[])
    rows = _df_to_rows(table, df)

    inserted = catalyst_services.insert_rows(table, rows)
    logger.info("Seeded %d rows into Datastore table '%s'", inserted, table)
    return inserted


def seed_all(force: bool = False) -> dict[str, int]:
    """
    Seed all tables in dependency order.

    Args:
        force: If True, re-insert even if tables already have data.

    Returns a mapping of {table_name: rows_inserted}.
    """
    results: dict[str, int] = {}
    for table in _TABLE_ORDER:
        results[table] = seed_table(table, force=force)
    total = sum(results.values())
    logger.info("Catalyst Datastore seed complete — %d total rows inserted", total)
    return results


if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.INFO)
    force_flag = "--force" in sys.argv
    result = seed_all(force=force_flag)
    for t, n in result.items():
        print(f"  {t}: {n} rows inserted")
