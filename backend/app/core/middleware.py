"""
Security and observability middleware.

Three real, self-contained pieces (no extra infra required, deliberately --
see AUDIT.md for why this build doesn't stand up Redis for a demo):

1. SecurityHeadersMiddleware -- adds standard defensive HTTP headers to every
   response (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, a
   conservative Permissions-Policy, and HSTS when served over HTTPS).
2. RateLimitMiddleware -- an in-memory sliding-window limiter per client IP.
   Not distributed (a multi-process/multi-instance deployment would need
   Redis or similar to share state) -- documented as a known limit, not
   hidden. Real enough to actually reject a request flood in this single
   process, which is what matters for a hackathon demo instance.
3. RequestLoggingMiddleware -- structured (JSON-line) request logs with
   method, path, status, duration, and client IP, replacing "no app-level
   logging beyond uvicorn's access log" (a gap flagged in the audit pass).
"""
from __future__ import annotations

import json
import logging
import time
from collections import defaultdict, deque

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

logger = logging.getLogger("crimegraph")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=(self)"
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Sliding-window limiter: max `limit` requests per `window_seconds` per
    client IP, tracked in-process. Exempts /docs, /openapi.json, and /redoc
    so the interactive API docs stay usable while testing.
    """

    def __init__(self, app, limit: int = 120, window_seconds: int = 60):
        super().__init__(app)
        self.limit = limit
        self.window = window_seconds
        self._hits: dict[str, deque] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if path in ("/docs", "/openapi.json", "/redoc") or path.startswith("/docs"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.monotonic()
        hits = self._hits[client_ip]

        while hits and now - hits[0] > self.window:
            hits.popleft()

        if len(hits) >= self.limit:
            return JSONResponse(
                status_code=429,
                content={"detail": f"Rate limit exceeded: max {self.limit} requests per {self.window}s."},
                headers={"Retry-After": str(self.window)},
            )

        hits.append(now)
        return await call_next(request)


REQUEST_COUNT = {"total": 0}


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.monotonic()
        response = await call_next(request)
        duration_ms = round((time.monotonic() - start) * 1000, 2)
        REQUEST_COUNT["total"] += 1
        logger.info(json.dumps({
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "duration_ms": duration_ms,
            "client_ip": request.client.host if request.client else "unknown",
        }))
        return response
