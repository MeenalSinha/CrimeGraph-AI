from fastapi import Header, HTTPException

from app.services.auth_service import decode_token


def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    """Optional-auth dependency: most demo endpoints stay readable without a
    token so judges can hit the API directly, but if a bearer token IS
    provided, it must be valid. Endpoints that should be strictly gated call
    `require_user` instead."""
    if not authorization:
        return dict(username="anonymous", role="Viewer")
    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return dict(username=payload["sub"], role=payload["role"])


def require_user(authorization: str | None = Header(default=None)) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required")
    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return dict(username=payload["sub"], role=payload["role"])
