"""
Catalyst managed-service helpers for CrimeGraph AI.

Provides graceful wrappers around:
  - Catalyst File Store  → ML model artifact storage / retrieval
  - Catalyst Datastore   → cloud SQL table access

Both helpers detect whether they are running inside a real Catalyst
environment (via CATALYST_PROJECT_ID env-var) and silently fall back
to local file I/O / local CSV when running locally or in tests.
"""
from __future__ import annotations

import io
import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

# Folder name inside Catalyst File Store that holds ML model artifacts.
_FS_FOLDER = "ml_models"

# Is this process running inside a real Catalyst container?
_IN_CATALYST = bool(os.environ.get("CATALYST_PROJECT_ID"))


# ──────────────────────────────────────────────────────────────────────────────
# Catalyst SDK — lazy import so local devs don't need the SDK installed
# ──────────────────────────────────────────────────────────────────────────────

def _get_sdk():
    """Return an initialised zcatalyst_sdk app instance or None."""
    if not _IN_CATALYST:
        return None
    try:
        import zcatalyst_sdk as zc
        return zc.initialize()
    except Exception as exc:  # noqa: BLE001
        logger.warning("Catalyst SDK init failed: %s", exc)
        return None


# ──────────────────────────────────────────────────────────────────────────────
# File Store helpers
# ──────────────────────────────────────────────────────────────────────────────

def upload_model(local_path: Path, filename: str | None = None) -> bool:
    """
    Upload a local .joblib file to Catalyst File Store (ml_models folder).

    Args:
        local_path: Absolute path to the local .joblib file.
        filename:   Override file name in File Store (default: local file name).

    Returns True on success, False if not in Catalyst or on error.
    """
    app = _get_sdk()
    if app is None:
        logger.debug("upload_model: not in Catalyst, skipping upload of %s", local_path)
        return False

    filename = filename or local_path.name
    try:
        fs = app.file_store()
        folder = fs.folder(_FS_FOLDER)
        with open(local_path, "rb") as f:
            folder.upload_file(filename, f.read())
        logger.info("Uploaded model artifact to File Store: %s", filename)
        return True
    except Exception as exc:  # noqa: BLE001
        logger.error("Failed to upload model %s: %s", filename, exc)
        return False


def download_model(filename: str, dest_path: Path) -> bool:
    """
    Download a single model artifact from Catalyst File Store.

    Args:
        filename:  Name of the file in the ml_models File Store folder.
        dest_path: Where to write it locally (e.g. /tmp/artifacts/model.joblib).

    Returns True on success, False if not in Catalyst or on error.
    """
    app = _get_sdk()
    if app is None:
        logger.debug("download_model: not in Catalyst, skipping download of %s", filename)
        return False

    try:
        fs = app.file_store()
        folder = fs.folder(_FS_FOLDER)
        data = folder.download_file(filename)
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        dest_path.write_bytes(data)
        logger.info("Downloaded model artifact from File Store: %s → %s", filename, dest_path)
        return True
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not download %s from File Store: %s", filename, exc)
        return False


def download_all_models(model_dir: Path, model_names: list[str]) -> bool:
    """
    Download all model artifacts from Catalyst File Store if they are not
    already present locally.

    Args:
        model_dir:   Directory where model files should be stored locally.
        model_names: List of filenames to download (e.g. ["count_model.joblib"]).

    Returns True if ALL models are available (either already on disk or
    successfully downloaded), False if any are missing after attempting download.
    """
    all_ok = True
    for name in model_names:
        dest = model_dir / name
        if dest.exists():
            logger.debug("Model already local: %s", name)
            continue
        ok = download_model(name, dest)
        if not ok:
            logger.warning("Model not available locally or in File Store: %s", name)
            all_ok = False
    return all_ok


# ──────────────────────────────────────────────────────────────────────────────
# Datastore helpers
# ──────────────────────────────────────────────────────────────────────────────

def query_table(table_name: str, max_rows: int = 200_000) -> list[dict]:
    """
    Read all rows from a Catalyst Datastore table.

    Args:
        table_name: The exact table name as created in the Catalyst console.
        max_rows:   Safety cap on how many rows to fetch.

    Returns a list of row dicts, or an empty list on error / not in Catalyst.
    """
    app = _get_sdk()
    if app is None:
        return []

    try:
        ds = app.data_store()
        table = ds.table(table_name)
        rows = table.query_rows(max_rows=max_rows)
        return rows or []
    except Exception as exc:  # noqa: BLE001
        logger.error("Datastore query failed for table %s: %s", table_name, exc)
        return []


def insert_rows(table_name: str, rows: list[dict]) -> int:
    """
    Bulk-insert rows into a Catalyst Datastore table.

    Args:
        table_name: The exact table name as created in the Catalyst console.
        rows:       List of row dicts matching the table column names.

    Returns number of rows successfully inserted.
    """
    app = _get_sdk()
    if app is None:
        return 0

    if not rows:
        return 0

    inserted = 0
    try:
        ds = app.data_store()
        table = ds.table(table_name)
        # Catalyst SDK insert_rows accepts batches of up to 200 rows.
        batch_size = 200
        for i in range(0, len(rows), batch_size):
            batch = rows[i: i + batch_size]
            table.insert_rows(batch)
            inserted += len(batch)
        logger.info("Inserted %d rows into Datastore table '%s'", inserted, table_name)
    except Exception as exc:  # noqa: BLE001
        logger.error("Datastore insert failed for table %s: %s", table_name, exc)

    return inserted


def get_row_count(table_name: str) -> int:
    """Return the number of rows in a Datastore table, or -1 on error."""
    app = _get_sdk()
    if app is None:
        return -1
    try:
        ds = app.data_store()
        table = ds.table(table_name)
        result = table.query_rows(max_rows=1, select_columns=["ROWID"])
        # Catalyst returns a count object; fall back to len if it's a list
        if hasattr(result, "count"):
            return result.count
        return -1
    except Exception as exc:  # noqa: BLE001
        logger.warning("Could not get row count for %s: %s", table_name, exc)
        return -1
