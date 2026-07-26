"""
Module 15 -- Reports.

Generates presentation-ready PDF reports (via reportlab) and CSV exports for
crime trend, patrol, and network summaries.
"""
from __future__ import annotations

import io

import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

from app.data.store import get_store
from app.services import risk_service, patrol_service, graph_service
from app.core.config import settings


# ---------- CSV exports (Module 15 explicitly asks for CSV alongside PDF) ----------

def crime_trend_csv() -> str:
    store = get_store()
    firs = store["firs"]
    return firs[["fir_id", "crime_type", "severity", "ward", "timestamp", "status", "weather", "is_festival_day"]].to_csv(index=False)


def patrol_csv() -> str:
    plan = patrol_service.optimize_patrols()
    rows = pd.DataFrame([
        dict(unit_id=r["unit_id"], station=r["station_name"],
             assigned_wards=" -> ".join(r["assigned_wards"]),
             distance_km=r["distance_km"], eta_minutes=r["eta_minutes"])
        for r in plan["routes"]
    ])
    return rows.to_csv(index=False)


def network_csv() -> str:
    communities = graph_service.detect_communities(min_size=3)
    rows = pd.DataFrame([
        dict(community_id=c["community_id"], size=c["size"],
             person_of_interest_count=c["person_of_interest_count"],
             suspected_gang=c["suspected_gang"] or "", cohesion=c["cohesion"])
        for c in communities
    ])
    return rows.to_csv(index=False)



def _base_doc(buffer, title: str):
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("TitleX", parent=styles["Title"], textColor=colors.HexColor("#0b1c33"))
    story = [Paragraph(f"{settings.PROJECT_NAME} -- {title}", title_style),
             Paragraph(f"Synthetic demo city: {settings.CITY_NAME}", styles["Normal"]),
             Spacer(1, 0.5 * cm)]
    return doc, styles, story


def crime_trend_report() -> bytes:
    store = get_store()
    firs = store["firs"]
    buffer = io.BytesIO()
    doc, styles, story = _base_doc(buffer, "Crime Trend Report")

    by_type = firs["crime_type"].value_counts().reset_index()
    by_type.columns = ["Crime Type", "Count"]
    table_data = [list(by_type.columns)] + by_type.values.tolist()
    t = Table(table_data, colWidths=[8 * cm, 4 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0b1c33")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
    ]))
    story += [Paragraph("Incidents by crime type", styles["Heading2"]), t, Spacer(1, 0.5 * cm)]

    by_ward = firs["ward"].value_counts().reset_index()
    by_ward.columns = ["Ward", "Count"]
    table_data2 = [list(by_ward.columns)] + by_ward.values.tolist()
    t2 = Table(table_data2, colWidths=[8 * cm, 4 * cm])
    t2.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0b1c33")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
    ]))
    story += [Paragraph("Incidents by ward", styles["Heading2"]), t2]

    doc.build(story)
    return buffer.getvalue()


def patrol_report() -> bytes:
    plan = patrol_service.optimize_patrols()
    buffer = io.BytesIO()
    doc, styles, story = _base_doc(buffer, "Patrol Deployment Report")
    story.append(Paragraph(
        f"Units deployed: {plan['total_units']} | Wards covered: {plan['summary']['wards_covered']} | "
        f"Avg ETA: {plan['summary']['avg_eta_minutes']} min", styles["Normal"]))
    story.append(Spacer(1, 0.4 * cm))
    rows = [["Unit", "Station", "Assigned Wards", "Distance (km)", "ETA (min)"]]
    for r in plan["routes"]:
        rows.append([r["unit_id"], r["station_name"], ", ".join(r["assigned_wards"]),
                     str(r["distance_km"]), str(r["eta_minutes"])])
    t = Table(rows, colWidths=[2.2 * cm, 4.3 * cm, 5 * cm, 2.5 * cm, 2.5 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0b1c33")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
    ]))
    story.append(t)
    doc.build(story)
    return buffer.getvalue()


def network_report() -> bytes:
    stats = graph_service.graph_stats()
    communities = graph_service.detect_communities(min_size=3)
    buffer = io.BytesIO()
    doc, styles, story = _base_doc(buffer, "Criminal Network Report")
    story.append(Paragraph(
        f"Nodes: {stats['node_count']} | Edges: {stats['edge_count']} | Density: {stats['density']}",
        styles["Normal"]))
    story.append(Spacer(1, 0.4 * cm))
    rows = [["Cluster", "Size", "POI Count", "Suspected Gang", "Cohesion"]]
    for c in communities[:15]:
        rows.append([c["community_id"], str(c["size"]), str(c["person_of_interest_count"]),
                     c["suspected_gang"] or "-", str(c["cohesion"])])
    t = Table(rows, colWidths=[3 * cm, 2 * cm, 2.5 * cm, 4 * cm, 2.5 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0b1c33")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
    ]))
    story.append(t)
    doc.build(story)
    return buffer.getvalue()
