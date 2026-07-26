"""
Module 16 -- Role-Based Access.

Minimal but real JWT auth: password hashing (bcrypt via passlib), token
issuance/verification (python-jose), and a fixed demo roster of roles
(Admin, Commissioner, SP, Inspector, Investigation Officer, Analyst, Viewer).
In-memory audit log records every login and every access to a role-gated
endpoint.

Honesty note: this is a demo auth system with a hardcoded user roster and an
in-memory audit log (see AUDIT.md) -- production deployment would need a real
user directory (LDAP/SSO), persistent audit storage, and MFA.
"""
from __future__ import annotations

from datetime import datetime, timedelta

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ROLES = ["Admin", "Commissioner", "SP", "Inspector", "Investigation Officer", "Analyst", "Viewer"]

# Demo roster -- passwords are intentionally simple demo credentials, printed in README.
_DEMO_USERS = {
    "admin": dict(full_name="Platform Admin", role="Admin", password="demo1234"),
    "commissioner": dict(full_name="R. Sharma", role="Commissioner", password="demo1234"),
    "inspector": dict(full_name="A. Verma", role="Inspector", password="demo1234"),
    "analyst": dict(full_name="N. Iyer", role="Analyst", password="demo1234"),
    "viewer": dict(full_name="Guest Viewer", role="Viewer", password="demo1234"),
}
for u in _DEMO_USERS.values():
    u["password_hash"] = pwd_context.hash(u["password"])

AUDIT_LOG: list[dict] = []


def authenticate(username: str, password: str) -> dict | None:
    user = _DEMO_USERS.get(username)
    if not user or not pwd_context.verify(password, user["password_hash"]):
        return None
    AUDIT_LOG.append(dict(event="login", username=username, role=user["role"],
                           timestamp=datetime.now().isoformat()))
    return dict(username=username, full_name=user["full_name"], role=user["role"])


def create_access_token(username: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = dict(sub=username, role=role, exp=expire)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None


def log_access(username: str, action: str):
    AUDIT_LOG.append(dict(event="access", username=username, action=action,
                           timestamp=datetime.now().isoformat()))
