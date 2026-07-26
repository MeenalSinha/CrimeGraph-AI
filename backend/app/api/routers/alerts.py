from fastapi import APIRouter

from app.services.alerts_service import generate_alerts

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("/")
def alerts():
    return dict(alerts=generate_alerts())
