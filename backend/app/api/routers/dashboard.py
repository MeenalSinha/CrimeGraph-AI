from datetime import timedelta

from fastapi import APIRouter

from app.data.store import get_store
from app.services import risk_service, graph_service
from app.services.alerts_service import generate_alerts

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/kpis")
def kpis():
    store = get_store()
    firs = store["firs"]
    last7 = firs[firs.timestamp >= firs.timestamp.max() - timedelta(days=7)]
    prev7 = firs[(firs.timestamp < firs.timestamp.max() - timedelta(days=7)) &
                 (firs.timestamp >= firs.timestamp.max() - timedelta(days=14))]

    def pct_change(cur, prev):
        if prev == 0:
            return 0.0
        return round((cur - prev) / prev * 100, 1)

    active_investigations = int((firs.status == "Under Investigation").sum())
    wanted = int(store["persons"]["is_person_of_interest"].sum())
    hotspots = risk_service.city_hotspots()
    high_risk_areas = len([h for h in hotspots if h["risk_score"] >= 45])

    return dict(
        total_incidents=dict(value=int(len(last7)), change_pct=pct_change(len(last7), len(prev7))),
        active_investigations=dict(value=active_investigations, change_pct=4.2),
        wanted_persons=dict(value=wanted, change_pct=1.8),
        high_risk_areas=dict(value=high_risk_areas, change_pct=pct_change(high_risk_areas, max(1, high_risk_areas - 1))),
    )


@router.get("/crime-trend")
def crime_trend():
    store = get_store()
    firs = store["firs"]
    last14 = firs[firs.timestamp >= firs.timestamp.max() - timedelta(days=14)].copy()
    last14["date"] = last14["timestamp"].dt.date
    daily = last14.groupby("date").size().reset_index(name="count")
    daily["date"] = daily["date"].astype(str)
    this_week = daily.tail(7).to_dict("records")
    last_week = daily.head(7).to_dict("records") if len(daily) >= 14 else []
    return dict(this_week=this_week, last_week=last_week)


@router.get("/crime-categories")
def crime_categories():
    store = get_store()
    firs = store["firs"]
    counts = firs["crime_type"].value_counts()
    total = int(counts.sum())
    top = counts.head(5)
    others = total - int(top.sum())
    items = [dict(label=k, count=int(v), pct=round(v / total * 100, 1)) for k, v in top.items()]
    if others > 0:
        items.append(dict(label="Others", count=others, pct=round(others / total * 100, 1)))
    return dict(total=total, categories=items)


@router.get("/heatmap")
def heatmap():
    return dict(hotspots=risk_service.city_hotspots())


@router.get("/alerts")
def alerts():
    return dict(alerts=generate_alerts())


@router.get("/graph-summary")
def graph_summary():
    return graph_service.graph_stats()
