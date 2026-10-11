"""Registration, login, and current-user endpoints."""

import re
import sqlite3

from flask import Blueprint, jsonify, request

from auth import current_user, hash_password, issue_token, verify_password
from database import get_connection

auth_bp = Blueprint("auth", __name__)
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _public_user(row):
    return {
        "user_id": row["user_id"],
        "full_name": row["full_name"],
        "email": row["email"],
        "phone": row["phone"],
        "role": row["role"],
        "created_at": row["created_at"],
    }


@auth_bp.post("/auth/register")
def register():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be a JSON object."}), 400

    name = data.get("full_name")
    email = data.get("email")
    password = data.get("password")
    phone = data.get("phone", "")
    if not isinstance(name, str) or not name.strip() or len(name.strip()) > 120:
        return jsonify({"error": "full_name is required and must be at most 120 characters."}), 400
    if not isinstance(email, str) or not EMAIL_PATTERN.fullmatch(email.strip()):
        return jsonify({"error": "A valid email address is required."}), 400
    if not isinstance(password, str) or len(password) < 8 or len(password) > 256:
        return jsonify({"error": "password must be between 8 and 256 characters."}), 400
    if not isinstance(phone, str) or len(phone.strip()) > 40:
        return jsonify({"error": "phone must be a string of at most 40 characters."}), 400
    if data.get("role", "citizen") != "citizen":
        return jsonify({"error": "Public registration is available for citizen accounts only."}), 403

    try:
        with get_connection() as conn:
            cursor = conn.execute(
                """INSERT INTO users (full_name, email, phone, password_hash, role)
                   VALUES (?, ?, ?, ?, 'citizen')""",
                (name.strip(), email.strip().lower(), phone.strip(), hash_password(password)),
            )
            user = conn.execute(
                "SELECT * FROM users WHERE user_id = ?", (cursor.lastrowid,)
            ).fetchone()
    except sqlite3.IntegrityError:
        return jsonify({"error": "An account with this email already exists."}), 409

    public_user = _public_user(user)
    return jsonify({"user": public_user, "token": issue_token(public_user)}), 201


@auth_bp.post("/auth/login")
def login():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be a JSON object."}), 400
    email = data.get("email")
    password = data.get("password")
    if not isinstance(email, str) or not isinstance(password, str):
        return jsonify({"error": "email and password are required."}), 400

    with get_connection() as conn:
        user = conn.execute(
            "SELECT * FROM users WHERE email = ?", (email.strip().lower(),)
        ).fetchone()
    if not user or not verify_password(password, user["password_hash"]):
        return jsonify({"error": "Invalid email or password."}), 401

    public_user = _public_user(user)
    return jsonify({"user": public_user, "token": issue_token(public_user)}), 200


@auth_bp.get("/auth/me")
def me():
    identity = current_user()
    if not identity:
        return jsonify({"error": "A valid bearer token is required."}), 401
    with get_connection() as conn:
        user = conn.execute(
            "SELECT * FROM users WHERE user_id = ?", (identity["user_id"],)
        ).fetchone()
    if not user:
        return jsonify({"error": "Account no longer exists."}), 401
    return jsonify({"user": _public_user(user)}), 200
