"""
CrimeGraph AI -- FastAPI entrypoint.

On startup: ensures synthetic data exists (generating it if this is a first
run) and ensures the ML risk model is trained, then mounts every module
router. Run with: uvicorn app.main:app --reload --port 8000
"""
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings, MODEL_DIR
from app import catalyst_services
from app.core.middleware import (
    SecurityHeadersMiddleware, RateLimitMiddleware, RequestLoggingMiddleware, REQUEST_COUNT,
)
from app.data.store import get_store
from app.api.routers import (
    auth, dashboard, prediction, network, patrol,
    investigations, alerts, search, chat, scenario, reports, analytics,
)

_START_TIME = time.monotonic()


_MODEL_FILES = [
    "count_model.joblib", "severity_model.joblib",
    "type_model.joblib", "anomaly_model.joblib",
    "ward_encoder.joblib", "type_encoder.joblib",
    "weather_encoder.joblib", "anomaly_ward_encoder.joblib",
]


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # ── Step 1: Fetch ML models from Catalyst File Store (if in cloud) ──
    catalyst_services.download_all_models(MODEL_DIR, _MODEL_FILES)

    # ── Step 2: Load synthetic data (CSV backend or Catalyst Datastore) ──
    get_store()

    # ── Step 3: Train models locally if still missing after File Store fetch ──
    if not (MODEL_DIR / "count_model.joblib").exists():
        from app.ml.train_risk_model import train
        train()
    yield
    # No teardown needed -- everything here is in-memory/local-process state.


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Predictive Crime Intelligence & Criminal Network Analytics Platform (hackathon prototype)",
    lifespan=lifespan,
)

# Middleware order matters: Starlette applies them outermost-added-last, so
# logging (outermost, sees the true final status) is added last here.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware, limit=120, window_seconds=60)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(prediction.router)
app.include_router(network.router)
app.include_router(patrol.router)
app.include_router(investigations.router)
app.include_router(alerts.router)
app.include_router(search.router)
app.include_router(chat.router)
app.include_router(scenario.router)
app.include_router(reports.router)
app.include_router(analytics.router)


@app.get("/")
def root():
    return dict(
        name=settings.PROJECT_NAME,
        version=settings.VERSION,
        status="operational",
        docs="/docs",
    )


@app.get("/api/health")
def health():
    return dict(status="ok")


@app.get("/api/metrics")
def metrics():
    """Minimal monitoring endpoint -- uptime and a coarse request counter.
    Not Prometheus-format (no metrics scraping infra in this demo), but real,
    live numbers rather than nothing, closing a documented gap from the audit
    pass ("no monitoring")."""
    from app.services.auth_service import AUDIT_LOG
    return dict(
        uptime_seconds=round(time.monotonic() - _START_TIME, 1),
        requests_served=REQUEST_COUNT["total"],
        auth_events_logged=len(AUDIT_LOG),
    )


@app.post("/api/admin/regenerate-city")
def regenerate_city(seed: int | None = None):
    """Regenerates the synthetic city and retrains the ML model. Used by the
    Demo Mode 'reset scenario' action."""
    store = get_store()
    store.regenerate(seed=seed)
    from app.services import graph_service
    graph_service.build_graph(force=True)
    from app.ml.train_risk_model import train
    metrics = train()
    from app.services import risk_service
    risk_service._cache.clear()
    risk_service._hotspots_cache.clear()
    return dict(status="regenerated", metrics=metrics)
