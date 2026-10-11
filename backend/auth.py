"""Small, dependency-free password and bearer-token helpers."""

import base64
import binascii
import hashlib
import hmac
import json
import secrets
import time

from flask import current_app, request

PBKDF2_ITERATIONS = 310_000
TOKEN_LIFETIME_SECONDS = 60 * 60 * 24


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    derived = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS
    )
    return f"{PBKDF2_ITERATIONS}${_encode(salt)}${_encode(derived)}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        iterations, salt, expected = encoded.split("$", 2)
        actual = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), _decode(salt), int(iterations)
        )
        return hmac.compare_digest(actual, _decode(expected))
    except (ValueError, TypeError):
        return False


def issue_token(user: dict) -> str:
    payload = {
        "user_id": user["user_id"],
        "email": user["email"],
        "role": user["role"],
        "exp": int(time.time()) + TOKEN_LIFETIME_SECONDS,
    }
    encoded = _encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(
        current_app.config["AUTH_SECRET"], encoded.encode("ascii"), hashlib.sha256
    ).digest()
    return f"{encoded}.{_encode(signature)}"


def current_user():
    authorization = request.headers.get("Authorization", "")
    if not authorization.startswith("Bearer "):
        return None
    try:
        encoded, signature = authorization[7:].split(".", 1)
        expected = hmac.new(
            current_app.config["AUTH_SECRET"], encoded.encode("ascii"), hashlib.sha256
        ).digest()
        if not hmac.compare_digest(expected, _decode(signature)):
            return None
        payload = json.loads(_decode(encoded))
        if payload["exp"] < int(time.time()):
            return None
        from database import get_connection

        with get_connection() as conn:
            user = conn.execute(
                "SELECT user_id, email, role FROM users WHERE user_id = ?",
                (int(payload["user_id"]),),
            ).fetchone()
        if not user:
            return None
        return {
            "user_id": user["user_id"],
            "email": user["email"],
            "role": user["role"],
        }
    except (
        ValueError, KeyError, TypeError, json.JSONDecodeError,
        binascii.Error, UnicodeDecodeError,
    ):
        return None


def _encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))
