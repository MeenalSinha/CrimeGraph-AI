from fastapi import APIRouter, HTTPException

from app.services import investigation_service

router = APIRouter(prefix="/api/investigations", tags=["investigations"])


@router.get("/cases")
def cases(status: str | None = None, ward: str | None = None, limit: int = 50):
    return dict(cases=investigation_service.list_cases(status, ward, limit))


@router.get("/cases/{fir_id}")
def case_detail(fir_id: str):
    try:
        return investigation_service.case_brief(fir_id.upper())
    except KeyError:
        raise HTTPException(status_code=404, detail="Case not found")
