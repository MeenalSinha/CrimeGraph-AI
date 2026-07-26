"""
Catalyst Cloud Scale — daily ML model retraining function.

Triggered nightly via a Catalyst cron schedule. Retrains all four ML models
(count, severity, type, anomaly) using the latest data from Catalyst Datastore
and uploads the fresh .joblib artifacts to Catalyst File Store.

The AppSail backend picks up the updated models on its next cold start, or
immediately via the /api/admin/regenerate-city endpoint.
"""
from __future__ import annotations

import json
import logging
import os
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)


def handler(context, basic_io):
    """
    Catalyst Advanced I/O Function handler.

    Args:
        context:  Catalyst execution context (project info, credentials).
        basic_io: Input/output interface for the function.

    Returns a JSON-serialisable dict with execution results.
    """
    start_ts = datetime.now(timezone.utc).isoformat()
    logger.info("[retrain_job] Starting nightly model retraining — %s", start_ts)

    # ── Step 1: Add the backend app to the Python path ──────────────────────
    # The function is deployed under functions/retrain_job/; the shared backend
    # app code lives at ../../backend/app relative to this file.
    _function_dir = Path(__file__).resolve().parent
    _backend_dir = _function_dir.parent.parent / "backend"
    if str(_backend_dir) not in sys.path:
        sys.path.insert(0, str(_backend_dir))

    # Add vendor directory for bundled dependencies
    _vendor_dir = _backend_dir / "vendor"
    if _vendor_dir.exists() and str(_vendor_dir) not in sys.path:
        sys.path.insert(0, str(_vendor_dir))

    result = {
        "status": "error",
        "started_at": start_ts,
        "finished_at": None,
        "metrics": None,
        "error": None,
    }

    try:
        # ── Step 2: Run model training ───────────────────────────────────────
        # Import is deferred so that sys.path is set up first.
        from app.ml.train_risk_model import train  # noqa: PLC0415

        logger.info("[retrain_job] Training models...")
        metrics = train()
        logger.info("[retrain_job] Training complete. Metrics: %s", json.dumps(metrics))

        # ── Step 3: Record metrics to Catalyst Datastore ─────────────────────
        try:
            from app import catalyst_services  # noqa: PLC0415
            catalyst_services.insert_rows("model_metrics", [{
                "run_timestamp":    start_ts,
                "count_model_mae":  metrics.get("count_model", {}).get("mae"),
                "count_model_r2":   metrics.get("count_model", {}).get("r2"),
                "type_model_f1":    metrics.get("type_model", {}).get("f1_macro"),
                "severity_model_mae": metrics.get("severity_model", {}).get("mae"),
                "trained_on_rows":  metrics.get("trained_on_rows"),
            }])
        except Exception as ds_exc:  # noqa: BLE001
            logger.warning("[retrain_job] Could not write metrics to Datastore: %s", ds_exc)

        result["status"] = "success"
        result["metrics"] = metrics

    except Exception as exc:  # noqa: BLE001
        logger.error("[retrain_job] Retraining failed: %s", exc, exc_info=True)
        result["error"] = str(exc)

    result["finished_at"] = datetime.now(timezone.utc).isoformat()
    logger.info("[retrain_job] Finished — status: %s", result["status"])

    # Write result to function output
    basic_io.write(json.dumps(result))
    return result
