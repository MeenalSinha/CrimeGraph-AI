"""
One-time Catalyst Datastore table creation script.

Run this locally (with your Catalyst credentials configured) BEFORE the
first cloud deployment to ensure all 9 tables exist in the Catalyst Console.

Usage:
    python backend/scripts/create_catalyst_tables.py

The script creates tables via the Catalyst SDK. If a table already exists it
prints a warning and continues (idempotent).

Tables created:
  stations, persons, vehicles, phones, accounts,
  firs, calls, transfers, associations

After running this script:
  1. Go to Catalyst Console → File Store
  2. Create a folder named: ml_models
  3. Set environment variables in AppSail settings:
       CATALYST_PROJECT_ID = <your project id>
       CATALYST_ENV = Development
"""
from __future__ import annotations

import sys
import os

# Allow running from project root: python backend/scripts/create_catalyst_tables.py
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../.."))

TABLE_SCHEMAS = {
    "stations": [
        {"column_name": "station_id",    "data_type": "TEXT",    "is_mandatory": True},
        {"column_name": "name",          "data_type": "TEXT",    "is_mandatory": True},
        {"column_name": "ward",          "data_type": "TEXT",    "is_mandatory": True},
        {"column_name": "lat",           "data_type": "DOUBLE",  "is_mandatory": True},
        {"column_name": "lng",           "data_type": "DOUBLE",  "is_mandatory": True},
        {"column_name": "officer_count", "data_type": "INTEGER", "is_mandatory": True},
        {"column_name": "vehicle_count", "data_type": "INTEGER", "is_mandatory": True},
    ],
    "persons": [
        {"column_name": "person_id",            "data_type": "TEXT",    "is_mandatory": True},
        {"column_name": "name",                 "data_type": "TEXT",    "is_mandatory": True},
        {"column_name": "age",                  "data_type": "INTEGER", "is_mandatory": True},
        {"column_name": "gender",               "data_type": "TEXT",    "is_mandatory": True},
        {"column_name": "ward",                 "data_type": "TEXT",    "is_mandatory": True},
        {"column_name": "aliases",              "data_type": "TEXT",    "is_mandatory": False},
        {"column_name": "is_person_of_interest","data_type": "INTEGER", "is_mandatory": True},
        {"column_name": "risk_score",           "data_type": "DOUBLE",  "is_mandatory": True},
        {"column_name": "gang_affiliation",     "data_type": "TEXT",    "is_mandatory": False},
    ],
    "vehicles": [
        {"column_name": "vehicle_id", "data_type": "TEXT", "is_mandatory": True},
        {"column_name": "plate",      "data_type": "TEXT", "is_mandatory": True},
        {"column_name": "type",       "data_type": "TEXT", "is_mandatory": True},
        {"column_name": "owner_id",   "data_type": "TEXT", "is_mandatory": True},
    ],
    "phones": [
        {"column_name": "phone_id", "data_type": "TEXT", "is_mandatory": True},
        {"column_name": "number",   "data_type": "TEXT", "is_mandatory": True},
        {"column_name": "owner_id", "data_type": "TEXT", "is_mandatory": True},
    ],
    "accounts": [
        {"column_name": "account_id", "data_type": "TEXT", "is_mandatory": True},
        {"column_name": "bank",       "data_type": "TEXT", "is_mandatory": True},
        {"column_name": "owner_id",   "data_type": "TEXT", "is_mandatory": True},
    ],
    "firs": [
        {"column_name": "fir_id",             "data_type": "TEXT",    "is_mandatory": True},
        {"column_name": "crime_type",         "data_type": "TEXT",    "is_mandatory": True},
        {"column_name": "severity",           "data_type": "INTEGER", "is_mandatory": True},
        {"column_name": "ward",              "data_type": "TEXT",    "is_mandatory": True},
        {"column_name": "lat",               "data_type": "DOUBLE",  "is_mandatory": True},
        {"column_name": "lng",               "data_type": "DOUBLE",  "is_mandatory": True},
        {"column_name": "timestamp",         "data_type": "TEXT",    "is_mandatory": True},
        {"column_name": "hour",              "data_type": "INTEGER", "is_mandatory": True},
        {"column_name": "weekday",           "data_type": "INTEGER", "is_mandatory": True},
        {"column_name": "is_night",          "data_type": "INTEGER", "is_mandatory": True},
        {"column_name": "is_weekend",        "data_type": "INTEGER", "is_mandatory": True},
        {"column_name": "is_festival_day",   "data_type": "INTEGER", "is_mandatory": True},
        {"column_name": "weather",           "data_type": "TEXT",    "is_mandatory": True},
        {"column_name": "population_density","data_type": "DOUBLE",  "is_mandatory": True},
        {"column_name": "weapon",            "data_type": "TEXT",    "is_mandatory": False},
        {"column_name": "suspect_id",        "data_type": "TEXT",    "is_mandatory": False},
        {"column_name": "station_id",        "data_type": "TEXT",    "is_mandatory": True},
        {"column_name": "status",            "data_type": "TEXT",    "is_mandatory": True},
    ],
    "calls": [
        {"column_name": "call_id",      "data_type": "TEXT",    "is_mandatory": True},
        {"column_name": "caller_id",    "data_type": "TEXT",    "is_mandatory": True},
        {"column_name": "callee_id",    "data_type": "TEXT",    "is_mandatory": True},
        {"column_name": "timestamp",    "data_type": "TEXT",    "is_mandatory": True},
        {"column_name": "duration_sec", "data_type": "INTEGER", "is_mandatory": True},
    ],
    "transfers": [
        {"column_name": "transfer_id",   "data_type": "TEXT",   "is_mandatory": True},
        {"column_name": "from_account",  "data_type": "TEXT",   "is_mandatory": True},
        {"column_name": "to_account",    "data_type": "TEXT",   "is_mandatory": True},
        {"column_name": "amount",        "data_type": "DOUBLE", "is_mandatory": True},
        {"column_name": "timestamp",     "data_type": "TEXT",   "is_mandatory": True},
    ],
    "associations": [
        {"column_name": "person_a", "data_type": "TEXT", "is_mandatory": True},
        {"column_name": "person_b", "data_type": "TEXT", "is_mandatory": True},
        {"column_name": "relation", "data_type": "TEXT", "is_mandatory": True},
        {"column_name": "context",  "data_type": "TEXT", "is_mandatory": False},
    ],
}


def create_tables():
    try:
        import zcatalyst_sdk as zc
    except ImportError:
        print("ERROR: zcatalyst-sdk not installed. Run: pip install zcatalyst-sdk")
        sys.exit(1)

    app = zc.initialize()
    ds = app.data_store()

    for table_name, columns in TABLE_SCHEMAS.items():
        try:
            ds.create_table(table_name, columns)
            print(f"  ✓ Created table: {table_name}")
        except Exception as exc:
            msg = str(exc)
            if "already exists" in msg.lower() or "duplicate" in msg.lower():
                print(f"  ~ Skipped (already exists): {table_name}")
            else:
                print(f"  ✗ Failed to create {table_name}: {exc}")

    print("\nAll tables processed.")
    print("Next steps:")
    print("  1. Go to Catalyst Console → File Store")
    print("  2. Create a folder named: ml_models")
    print("  3. Deploy the app: catalyst deploy")


if __name__ == "__main__":
    create_tables()
