"""
Smoke tests covering the core services. Run with: pytest backend/tests -v

These are intentionally focused on "does the real pipeline actually work end to
end" rather than exhaustive unit coverage -- see AUDIT.md for the honest gap
(no full CI-grade test suite in this pass).
"""
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient

from app.main import app
from app.data.store import get_store
from app.services import (
    risk_service, graph_service, patrol_service,
    investigation_service, alerts_service, scenario_service, analytics_service, report_service,
)
from app.services.entity_resolution import find_duplicate_candidates
from app.services.search_service import global_search


def test_store_loads():
    store = get_store()
    assert len(store["firs"]) > 0
    assert len(store["persons"]) > 0
    assert store["firs"]["weapon"].isnull().sum() == 0  # regression test for the NaN bug


def test_risk_prediction():
    r = risk_service.predict_risk("Central Zone", hour=21, weekday=4)
    assert 0 <= r["risk_score"] <= 100
    assert r["risk_band"] in ("Critical", "High", "Moderate", "Low")
    assert len(r["explanation"]["reasons"]) > 0


def test_count_model_meets_minimum_quality_bar():
    """Regression guard: the count/risk model's cross-validated R2 should stay
    meaningfully above the ~0.17-0.33 range measured before this pass's
    hyperparameter tuning + larger default dataset (see AUDIT.md for the
    measured before/after comparison). If this starts failing, something
    regressed the model quality, not just "the number changed."""
    import json
    from app.core.config import MODEL_DIR
    with open(MODEL_DIR / "metrics.json") as f:
        metrics = json.load(f)
    assert metrics["count_model"]["cross_validation"]["r2_mean"] > 0.35


def test_hotspots_sorted_desc():
    hotspots = risk_service.city_hotspots()
    scores = [h["risk_score"] for h in hotspots]
    assert scores == sorted(scores, reverse=True)


def test_graph_builds_and_has_nodes():
    G = graph_service.build_graph()
    assert G.number_of_nodes() > 1000
    stats = graph_service.graph_stats()
    assert stats["node_count"] == G.number_of_nodes()


def test_community_detection_runs():
    communities = graph_service.detect_communities(min_size=3)
    assert isinstance(communities, list)


def test_patrol_optimizer_returns_routes():
    plan = patrol_service.optimize_patrols()
    assert plan["total_units"] > 0
    assert len(plan["routes"]) == plan["total_units"]


def test_ortools_patrol_optimizer_solves_and_covers_all_wards():
    """Real OR-Tools VRP solve -- verifies the solver actually returns a
    feasible solution covering all wards for the default demo city size
    (8 wards, ~24 vehicles is comfortably enough capacity)."""
    plan = patrol_service.optimize_patrols_ortools()
    assert plan["solved"] is True
    assert plan["summary"]["wards_covered"] == plan["summary"]["wards_total"]
    assert len(plan["unvisited_wards"]) == 0
    assert plan["summary"]["optimal_distance_km"] > 0


def test_ortools_vs_heuristic_both_produce_valid_routes():
    """Not asserting one is 'better' (that depends on the objective you care
    about -- OR-Tools optimizes total fleet distance directly; the heuristic
    optimizes per-unit nearest-neighbor greedily) -- just that both are real,
    independently-computed, valid solutions to the same problem instance."""
    heuristic = patrol_service.optimize_patrols()
    solver = patrol_service.optimize_patrols_ortools()
    assert heuristic["summary"]["optimal_distance_km"] > 0
    assert solver["summary"]["optimal_distance_km"] > 0
    assert len(heuristic["routes"]) > 0
    assert len(solver["routes"]) > 0


def test_investigation_brief_on_real_case():
    store = get_store()
    fir_id = store["firs"].iloc[0]["fir_id"]
    brief = investigation_service.case_brief(fir_id)
    assert brief["fir_id"] == fir_id
    assert "summary" in brief


def test_alerts_generate_without_error():
    alerts = alerts_service.generate_alerts()
    assert isinstance(alerts, list)


def test_alerts_endpoint_is_fast_when_warm():
    """Regression guard for a real bug found during benchmarking: /api/alerts/
    was taking 800-1200ms per request because detect_communities() recomputed
    greedy_modularity_communities from scratch on every call, and city_hotspots()
    made 24 uncached XGBoost predict() calls. Fixed with caching (see
    graph_service.py and risk_service.py); this test guards against it
    silently regressing. First call pays the one-time cache-fill cost, so
    only the warm calls are asserted against a tight bound."""
    client.get("/api/alerts/")  # warm the caches
    import time
    durations = []
    for _ in range(5):
        t0 = time.perf_counter()
        r = client.get("/api/alerts/")
        durations.append((time.perf_counter() - t0) * 1000)
        assert r.status_code == 200
    assert max(durations) < 200  # was 800-1200ms before the fix


def test_scenario_simulation():
    r = scenario_service.simulate("Old City", "festival")
    assert r["adjusted_risk_score"] >= 0


def test_entity_resolution_runs():
    candidates = find_duplicate_candidates(threshold=80)
    assert isinstance(candidates, list)


def test_search_returns_results_for_known_term():
    results = global_search("theft")
    assert isinstance(results, list)


def test_risk_prediction_with_weather_and_festival():
    baseline = risk_service.predict_risk("Old City", hour=21, weekday=4)
    festival = risk_service.predict_risk("Old City", hour=21, weekday=4, weather="Clear", is_festival_day=True)
    assert festival["is_festival_day"] == 1
    assert baseline["is_festival_day"] == 0
    # Festival day should be reflected in the explanation reasons.
    assert any("estival" in r for r in festival["explanation"]["reasons"])


def test_anomaly_detection_runs_and_returns_real_scores():
    anomalies = risk_service.anomaly_check()
    assert isinstance(anomalies, list)
    for a in anomalies:
        assert "ward" in a and "anomaly_score" in a


def test_link_prediction_runs():
    predictions = graph_service.predict_hidden_links(top_n=5)
    assert isinstance(predictions, list)
    if predictions:
        assert predictions[0]["score"] >= predictions[-1]["score"]


def test_temporal_evolution_shows_real_growth_not_static_data():
    store = get_store()
    firs = store["firs"]
    start, end = firs["timestamp"].min(), firs["timestamp"].max()
    snapshots = graph_service.temporal_evolution(start, end, n_points=4)
    assert len(snapshots) == 4
    node_counts = [s["node_count"] for s in snapshots]
    edge_counts = [s["edge_count"] for s in snapshots]
    # A real temporal reconstruction must show monotonic growth as more
    # timestamped events accumulate -- this is the actual proof it isn't
    # cosmetic/faked data.
    assert node_counts == sorted(node_counts)
    assert edge_counts == sorted(edge_counts)
    assert edge_counts[-1] > edge_counts[0]


def test_district_comparison_covers_all_wards():
    store = get_store()
    n_wards = store["firs"]["ward"].nunique()
    districts = analytics_service.district_comparison()
    assert len(districts) == n_wards


def test_officer_productivity_runs():
    stations = analytics_service.officer_productivity()
    assert isinstance(stations, list)
    assert len(stations) > 0


def test_crime_recurrence_runs():
    result = analytics_service.crime_recurrence()
    assert "repeat_offenders" in result


def test_csv_exports_are_nonempty_valid_csv():
    csv_text = report_service.crime_trend_csv()
    assert "fir_id" in csv_text.splitlines()[0]
    assert len(csv_text.splitlines()) > 1

    patrol_text = report_service.patrol_csv()
    assert "unit_id" in patrol_text.splitlines()[0]

    network_text = report_service.network_csv()
    assert "community_id" in network_text.splitlines()[0]


# ---------- API-level tests (security headers, rate limiting, validation, concurrency) ----------

client = TestClient(app)


def test_security_headers_present_on_every_response():
    r = client.get("/api/health")
    assert r.headers.get("x-content-type-options") == "nosniff"
    assert r.headers.get("x-frame-options") == "DENY"
    assert "referrer-policy" in r.headers


def test_invalid_hour_rejected_with_422_not_a_crash():
    r = client.post("/api/prediction/risk", json={"ward": "Old City", "hour": 47, "weekday": 4})
    assert r.status_code == 422  # pydantic bounds validation, not a 500


def test_blank_ward_rejected():
    r = client.post("/api/prediction/risk", json={"ward": "   ", "hour": 10, "weekday": 2})
    assert r.status_code == 422


def test_unknown_ward_returns_400_not_500():
    r = client.post("/api/prediction/risk", json={"ward": "Nonexistent Ward XYZ", "hour": 10, "weekday": 2})
    assert r.status_code == 400


def test_shortest_path_rejects_empty_ids():
    r = client.post("/api/network/shortest-path", json={"source": "", "target": "P-00001"})
    assert r.status_code == 422


def test_metrics_endpoint_reports_real_counters():
    r1 = client.get("/api/metrics")
    count1 = r1.json()["requests_served"]
    client.get("/api/health")
    r2 = client.get("/api/metrics")
    count2 = r2.json()["requests_served"]
    assert count2 > count1  # the counter actually moved, not a static number


def test_concurrent_predictions_do_not_crash_or_corrupt_state():
    """Real concurrency test: hammer the risk model from many threads at once
    and confirm every response is well-formed. This exercises the module-level
    model cache (risk_service._cache) and graph cache under concurrent read
    access, which is exactly where a naive shared-mutable-cache bug would show up."""
    wards = ["Central Zone", "Old City", "North District", "Riverside"]

    def call(i):
        ward = wards[i % len(wards)]
        r = client.post("/api/prediction/risk", json={"ward": ward, "hour": i % 24, "weekday": i % 7})
        return r.status_code, r.json()

    with ThreadPoolExecutor(max_workers=16) as pool:
        results = list(pool.map(call, range(40)))

    for status, body in results:
        assert status == 200
        assert 0 <= body["risk_score"] <= 100


def test_zzz_rate_limit_actually_triggers():
    # Named to run last alphabetically within this block: it deliberately
    # exhausts the shared in-memory rate limiter (state persists for the rest
    # of this process's life), so no test after this one can assume a 200.
    # Default limit is 120/min; fire well past that against a cheap endpoint
    # and confirm at least one request gets a real 429, not just 200s forever.
    statuses = [client.get("/api/health").status_code for _ in range(150)]
    assert 429 in statuses


# ---------- Optional PostgreSQL integration test ----------
# Skipped automatically when CRIMEGRAPH_DATABASE_URL isn't set (e.g. plain CI
# without a Postgres service container), so the rest of the suite stays
# runnable with zero external services. When it IS set, this actually proves
# the production database backend works, not just the CSV path.

import pytest


@pytest.mark.skipif(
    not __import__("os").getenv("CRIMEGRAPH_DATABASE_URL"),
    reason="CRIMEGRAPH_DATABASE_URL not set -- skipping real Postgres integration test",
)
def test_postgres_backend_end_to_end():
    import os
    from app.data.db_seed import seed
    from app.data.store import DataStore

    url = os.environ["CRIMEGRAPH_DATABASE_URL"]
    counts = seed(url)
    assert counts["firs"] > 0

    DataStore._instance = None
    store = DataStore.instance()
    assert store.backend == "postgresql"
    assert len(store["firs"]) == counts["firs"]

    r = risk_service.predict_risk("Central Zone", hour=21, weekday=4)
    assert 0 <= r["risk_score"] <= 100
