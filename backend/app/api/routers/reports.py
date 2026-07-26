from fastapi import APIRouter
from fastapi.responses import StreamingResponse, PlainTextResponse
import io

from app.services import report_service

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/crime-trend.pdf")
def crime_trend_pdf():
    pdf = report_service.crime_trend_report()
    return StreamingResponse(io.BytesIO(pdf), media_type="application/pdf",
                              headers={"Content-Disposition": "attachment; filename=crime_trend_report.pdf"})


@router.get("/patrol.pdf")
def patrol_pdf():
    pdf = report_service.patrol_report()
    return StreamingResponse(io.BytesIO(pdf), media_type="application/pdf",
                              headers={"Content-Disposition": "attachment; filename=patrol_report.pdf"})


@router.get("/network.pdf")
def network_pdf():
    pdf = report_service.network_report()
    return StreamingResponse(io.BytesIO(pdf), media_type="application/pdf",
                              headers={"Content-Disposition": "attachment; filename=network_report.pdf"})


@router.get("/crime-trend.csv")
def crime_trend_csv():
    csv = report_service.crime_trend_csv()
    return PlainTextResponse(csv, media_type="text/csv",
                              headers={"Content-Disposition": "attachment; filename=crime_trend_report.csv"})


@router.get("/patrol.csv")
def patrol_csv():
    csv = report_service.patrol_csv()
    return PlainTextResponse(csv, media_type="text/csv",
                              headers={"Content-Disposition": "attachment; filename=patrol_report.csv"})


@router.get("/network.csv")
def network_csv():
    csv = report_service.network_csv()
    return PlainTextResponse(csv, media_type="text/csv",
                              headers={"Content-Disposition": "attachment; filename=network_report.csv"})
