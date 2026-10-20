"""Private account for this personal installation; preserves existing user 1 data."""
import hashlib
import hmac
import os
import secrets
import time
from fastapi import APIRouter, Request, HTTPException
from sqlalchemy import Column, String, Text
from sqlalchemy.exc import IntegrityError
from database import Base, SessionLocal
import json


class AppState(Base):
    __tablename__ = "daily_signals_state"
    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=False)


def read_state(key, default=None):
    with SessionLocal() as db:
        row = db.get(AppState, key)
        return json.loads(row.value) if row else default


def write_state(key, value):
    with SessionLocal() as db:
        row = db.get(AppState, key)
        if row:
            row.value = json.dumps(value)
        else:
            db.add(AppState(key=key, value=json.dumps(value)))
        db.commit()


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def password_hash(value, salt=None):
    salt = salt or secrets.token_hex(16)
    return salt + ":" + hashlib.scrypt(value.encode(), salt=salt.encode(), n=16384, r=8, p=1).hex()


sessions = {}
attempts = {}
router = APIRouter(prefix="/auth", tags=["Account"])


def session_key(request):
    return digest(request.headers.get("authorization", "").removeprefix("Bearer "))


def authenticated(request):
    return sessions.get(session_key(request), 0) > time.time()


@router.get("/status")
def status(request: Request):
    account = read_state("account")
    return {"configured": bool(account), "authenticated": authenticated(request),
            "must_change_password": bool(account and account.get("must_change_password")) if authenticated(request) else False,
            "role": "owner" if authenticated(request) else None,
            "email": account["email"] if account and authenticated(request) else None}


@router.post("/{action}")
def account_action(action: str, payload: dict, request: Request):
    if action == "logout":
        sessions.pop(session_key(request), None)
        return {"ok": True}
    if action == "change-password":
        if not authenticated(request):
            raise HTTPException(401, "Please sign in.")
        account = read_state("account")
        current, password = payload.get("current_password"), payload.get("password")
        if not isinstance(current, str) or len(current) > 256 or not isinstance(password, str) or not 12 <= len(password) <= 256:
            raise HTTPException(400, "Enter your current password and a new password of at least 12 characters.")
        if not hmac.compare_digest(password_hash(current, account["password"].split(":")[0]), account["password"]):
            raise HTTPException(400, "Your current password is incorrect.")
        if current == password:
            raise HTTPException(400, "Choose a different password.")
        account.update(password=password_hash(password), must_change_password=False)
        write_state("account", account)
        sessions.clear()
        token = secrets.token_hex(32)
        sessions[digest(token)] = time.time() + 7 * 86400
        return {"token": token}
    if action not in ("register", "login", "recover"):
        raise HTTPException(404, "Unknown account action")
    now = time.time()
    for key in list(attempts):
        if attempts[key][1] < now:
            del attempts[key]
    ip = request.client.host
    count, expiry = attempts.get(ip, (0, now + 900))
    attempts[ip] = (count + 1, expiry)
    if count >= 10:
        raise HTTPException(429, "Too many attempts. Try again in 15 minutes.")
    email, password = payload.get("email"), payload.get("password")
    if not isinstance(email, str) or "@" not in email or not isinstance(password, str) or len(password) > 256:
        raise HTTPException(400, "Enter a valid email and password.")
    email = email.strip().lower()
    if action != "login" and len(password) < 12:
        raise HTTPException(400, "Use at least 12 characters for your password.")
    account = read_state("account")
    recovery = None
    if action == "register":
        if account:
            raise HTTPException(409, "This personal app already has an account. Please sign in.")
        setup = os.getenv("ACCOUNT_SETUP_KEY")
        # Hosted installations must explicitly authorize the first claim of existing data.
        if (not setup and os.getenv("ALLOW_LOCAL_ACCOUNT_SETUP") != "1") or (setup and not hmac.compare_digest(str(payload.get("setup_key", "")), setup)):
            raise HTTPException(403, "Ask your app administrator for the account setup key.")
        recovery = secrets.token_hex(24)
        account = {"email": email, "password": password_hash(password), "recovery": digest(recovery)}
        # A unique insert prevents two concurrent setup requests claiming the app.
        with SessionLocal() as db:
            db.add(AppState(key="account", value=json.dumps(account)))
            try:
                db.commit()
            except IntegrityError:
                db.rollback()
                raise HTTPException(409, "This personal app already has an account. Please sign in.")
    else:
        stored = account["password"] if account else password_hash("invalid-password")
        valid = hmac.compare_digest(password_hash(password, stored.split(":")[0]), stored) if action == "login" else hmac.compare_digest(digest(str(payload.get("recovery_code", "")).strip()), account["recovery"] if account else "")
        if not account or account["email"] != email or not valid:
            raise HTTPException(400, "Email or credentials are incorrect.")
        if action == "recover":
            recovery = secrets.token_hex(24)
            account.update(password=password_hash(password), recovery=digest(recovery), must_change_password=False)
            write_state("account", account)
            sessions.clear()
    attempts.pop(ip, None)
    for key in list(sessions):
        if sessions[key] < now:
            del sessions[key]
    token = secrets.token_hex(32)
    sessions[digest(token)] = now + 7 * 86400
    return {"token": token, "recovery_code": recovery}
