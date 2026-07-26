from fastapi import APIRouter

from app.services import analytics_service

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/district-comparison")
def district_comparison():
    return dict(districts=analytics_service.district_comparison())


@router.get("/officer-productivity")
def officer_productivity():
    return dict(stations=analytics_service.officer_productivity())


@router.get("/crime-recurrence")
def crime_recurrence():
    return analytics_service.crime_recurrence()


@router.get("/anomalies")
def anomalies():
    return dict(anomalies=analytics_service.anomalies())
