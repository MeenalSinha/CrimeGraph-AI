from fastapi import APIRouter, HTTPException

from app.models.schemas import ScenarioRequest
from app.services import scenario_service

router = APIRouter(prefix="/api/scenario", tags=["scenario"])


@router.get("/list")
def list_scenarios():
    return dict(scenarios=scenario_service.list_scenarios())


@router.post("/simulate")
def simulate(body: ScenarioRequest):
    try:
        return scenario_service.simulate(body.ward, body.scenario_key, body.hour, body.weekday)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
