from fastapi import APIRouter, HTTPException

from app.models.schemas import PredictionRequest
from app.services import risk_service
from app.data.synthetic_generator import WARDS

router = APIRouter(prefix="/api/prediction", tags=["prediction"])


@router.get("/wards")
def wards():
    return dict(wards=[w[0] for w in WARDS])


@router.get("/weather-options")
def weather_options():
    return dict(options=risk_service.weather_options())


@router.post("/risk")
def predict(body: PredictionRequest):
    try:
        return risk_service.predict_risk(body.ward, body.hour, body.weekday, body.weather, body.is_festival_day)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/hotspots")
def hotspots(hour: int | None = None, weekday: int | None = None):
    return dict(hotspots=risk_service.city_hotspots(hour, weekday))


@router.get("/forecast/{ward}")
def forecast(ward: str):
    try:
        return dict(ward=ward, forecast=risk_service.forecast_7day(ward))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
