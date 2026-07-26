"""
Benchmark suite: real latency measurements against a running instance of the
backend. Not a load-testing tool (no concurrent-user ramp, no throughput
ceiling discovery) -- a per-endpoint latency profiler, which is the more
useful measurement for "is this API fast enough for an interactive
dashboard" than a synthetic load test would be for a single-process demo
prototype.

Run against a live server:

    uvicorn app.main:app --port 8000 &
    python scripts/benchmark.py --base-url http://localhost:8000

Honesty note: numbers in AUDIT.md were captured on a single-CPU-core sandbox
VM, which is a worse-case environment than typical deployment hardware.
Re-run this yourself on your target hardware before citing these numbers in
a demo -- see the printed disclaimer in the output.
"""
from __future__ import annotations

import argparse
import json
import statistics
import time
from datetime import datetime

import httpx

ENDPOINTS = [
    ("GET", "/api/health", None),
    ("GET", "/api/dashboard/kpis", None),
    ("GET", "/api/dashboard/heatmap", None),
    ("GET", "/api/dashboard/crime-trend", None),
    ("GET", "/api/dashboard/crime-categories", None),
    ("GET", "/api/alerts/", None),
    ("POST", "/api/prediction/risk", {"ward": "Central Zone", "hour": 21, "weekday": 4}),
    ("GET", "/api/prediction/hotspots", None),
    ("GET", "/api/network/stats", None),
    ("GET", "/api/network/centrality?top_n=10", None),
    ("GET", "/api/network/communities?min_size=3", None),
    ("GET", "/api/network/link-prediction?top_n=10", None),
    ("GET", "/api/patrol/optimize", None),
    ("GET", "/api/investigations/cases?limit=20", None),
    ("GET", "/api/analytics/district-comparison", None),
    ("GET", "/api/analytics/officer-productivity", None),
    ("GET", "/api/analytics/anomalies", None),
    ("GET", "/api/search/?q=theft", None),
    ("POST", "/api/chat/ask", {"query": "why is central zone high risk"}),
]


def percentile(values: list[float], p: float) -> float:
    values = sorted(values)
    k = (len(values) - 1) * (p / 100)
    f, c = int(k), min(int(k) + 1, len(values) - 1)
    if f == c:
        return values[f]
    return values[f] + (values[c] - values[f]) * (k - f)


def benchmark_endpoint(client: httpx.Client, method: str, path: str, body, n_requests: int) -> dict:
    durations = []
    errors = 0
    for _ in range(n_requests):
        t0 = time.perf_counter()
        try:
            if method == "GET":
                r = client.get(path)
            else:
                r = client.post(path, json=body)
            if r.status_code >= 400:
                errors += 1
        except Exception:
            errors += 1
            continue
        durations.append((time.perf_counter() - t0) * 1000)

    if not durations:
        return dict(path=path, method=method, error="all requests failed")

    return dict(
        path=path, method=method, n=len(durations), errors=errors,
        p50_ms=round(percentile(durations, 50), 1),
        p95_ms=round(percentile(durations, 95), 1),
        p99_ms=round(percentile(durations, 99), 1),
        mean_ms=round(statistics.mean(durations), 1),
        max_ms=round(max(durations), 1),
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:8000")
    parser.add_argument("--requests", type=int, default=30, help="requests per endpoint")
    parser.add_argument("--output", default=None, help="optional path to write JSON results")
    args = parser.parse_args()

    print(f"Benchmarking {args.base_url} -- {args.requests} requests per endpoint")
    print("NOTE: numbers depend heavily on the machine running this. The numbers")
    print("checked into AUDIT.md were measured on a single-CPU-core sandbox VM,")
    print("a worse-case environment vs. typical deployment hardware.\n")

    results = []
    with httpx.Client(base_url=args.base_url, timeout=30.0) as client:
        # Warm up (first request after boot pays model-load/graph-build cost).
        client.get("/api/health")
        client.get("/api/dashboard/kpis")

        for method, path, body in ENDPOINTS:
            r = benchmark_endpoint(client, method, path, body, args.requests)
            results.append(r)
            if "error" in r:
                print(f"  {method:4s} {path:45s} FAILED: {r['error']}")
            else:
                print(f"  {method:4s} {path:45s} p50={r['p50_ms']:7.1f}ms  p95={r['p95_ms']:7.1f}ms  p99={r['p99_ms']:7.1f}ms")

    output = dict(
        benchmarked_at=datetime.now().isoformat(),
        base_url=args.base_url,
        requests_per_endpoint=args.requests,
        results=results,
    )
    if args.output:
        with open(args.output, "w") as f:
            json.dump(output, f, indent=2)
        print(f"\nResults written to {args.output}")


if __name__ == "__main__":
    main()
