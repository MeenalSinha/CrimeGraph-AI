from fastapi import APIRouter, HTTPException

from app.models.schemas import LoginRequest
from app.services.auth_service import authenticate, create_access_token, ROLES

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def login(body: LoginRequest):
    user = authenticate(body.username, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token(user["username"], user["role"])
    return dict(access_token=token, token_type="bearer", user=user)


@router.get("/roles")
def roles():
    return dict(roles=ROLES)
