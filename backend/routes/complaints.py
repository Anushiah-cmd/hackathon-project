"""Complaint intake, analysis, evidence, tracking, and investigation endpoints."""

import json
import hashlib
import mimetypes
import os
import sqlite3
import uuid
from datetime import datetime, timezone

from flask import Blueprint, current_app, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename

from auth import current_user
from database import get_connection
from analysis import classify, detect_missing, find_similar

complaints_bp = Blueprint("complaints", __name__)

VALID_STATUSES = {"New", "Under Review", "Resolved"}
TEXT_LIMITS = {
    "title": 200,
    "description": 10000,
    "location": 500,
    "incident_time": 100,
    "item_details": 1000,
    "escape_direction": 1000,
    "preferred_language": 20,
    "reporter_name": 120,
    "reporter_email": 254,
    "reported_category": 100,
}
ALLOWED_EVIDENCE = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
}
MAX_EVIDENCE_SIZE = 5 * 1024 * 1024


# ── Helpers ───────────────────────────────────────────────────────────────────

def _row_to_dict(row) -> dict:
    d = dict(row)
    for json_field in ("missing_fields", "similar_cases", "briefing"):
        if d.get(json_field):
            try:
                d[json_field] = json.loads(d[json_field])
            except (json.JSONDecodeError, TypeError):
                pass
    return d


def _build_briefing(complaint: dict, missing: list, similar: list) -> dict:
    return {
        "complaint_id":   complaint["complaint_id"],
        "summary":        (complaint.get("description") or "")[:200],
        "category":       complaint.get("category", "Unknown"),
        "priority":       complaint.get("priority", "Unknown"),
        "missing_fields": missing,
        "similar_cases":  similar,
        "status":         complaint.get("status", "New"),
        "human_review_reminder": (
            "Automated suggestions only. All information must be verified by a human officer "
            "before any action is taken."
        ),
    }


def _attach_related_data(conn, complaint):
    result = dict(complaint)
    result["evidence"] = [
        dict(row) for row in conn.execute(
            """SELECT evidence_id, original_name, mime_type, file_size, sha256, created_at
               FROM evidence WHERE complaint_id = ? ORDER BY created_at""",
            (result["complaint_id"],),
        ).fetchall()
    ]
    result["status_history"] = [
        dict(row) for row in conn.execute(
            """SELECT old_status, new_status, note, created_at
               FROM status_history WHERE complaint_id = ? ORDER BY history_id""",
            (result["complaint_id"],),
        ).fetchall()
    ]
    return result


def _can_access(complaint, identity):
    return (
        identity is None
        or identity["role"] in ("officer", "admin")
        or complaint["reporter_user_id"] is None
        or complaint["reporter_user_id"] == identity["user_id"]
    )


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _json_object():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return None, (jsonify({
            "error": "Request body must be a JSON object."
        }), 400)
    return data, None


def _identity_or_error():
    authorization = request.headers.get("Authorization")
    identity = current_user()
    if not authorization or not authorization.startswith("Bearer ") or identity is None:
        return None, (jsonify({"error": "Invalid or expired bearer token."}), 401)
    return identity, None


# ── POST /api/complaints ──────────────────────────────────────────────────────

@complaints_bp.route("/complaints", methods=["POST"])
def submit_complaint():
    identity, auth_error = _identity_or_error()
    if auth_error:
        return auth_error
    if identity["role"] != "citizen":
        return jsonify({"error": "Only citizen accounts can submit complaints."}), 403

    data, error = _json_object()
    if error:
        return error

    description = data.get("description")
    if not isinstance(description, str):
        description = ""
    description = description.strip()
    if not description:
        return jsonify({
            "error": "description is required and cannot be empty."
        }), 400
    if len(description) > TEXT_LIMITS["description"]:
        return jsonify({
            "error": f"description must be at most {TEXT_LIMITS['description']} characters."
        }), 400

    fields = {}
    for field, limit in TEXT_LIMITS.items():
        if field == "description":
            continue
        value = data.get(field)
        if value is not None and not isinstance(value, str):
            return jsonify({"error": f"{field} must be a string."}), 400
        value = value.strip() if isinstance(value, str) else ""
        if len(value) > limit:
            return jsonify({
                "error": f"{field} must be at most {limit} characters."
            }), 400
        fields[field] = value or (
            "en" if field == "preferred_language"
            else ("Crime report" if field == "title" else None)
        )

    complaint_id = "CW-" + uuid.uuid4().hex[:8].upper()
    now = _utc_now()

    complaint = {
        "complaint_id":       complaint_id,
        "title":              fields["title"],
        "description":        description,
        "location":           fields["location"],
        "incident_time":      fields["incident_time"],
        "item_details":       fields["item_details"],
        "escape_direction":   fields["escape_direction"],
        "preferred_language": fields["preferred_language"],
        "reporter_user_id":   identity["user_id"] if identity else None,
        "reporter_name":      fields["reporter_name"],
        "reporter_email":     fields["reporter_email"] or (identity["email"] if identity else None),
        "status":             "New",
        "reported_category": fields["reported_category"],
        "created_at":         now,
        "updated_at":         now,
    }

    # Run analysis immediately on submission
    classification = classify(complaint)
    missing        = detect_missing(complaint)
    similar        = find_similar(complaint)
    briefing       = _build_briefing(
        {**complaint, **classification}, missing, similar
    )

    complaint.update({
        "category":        classification["category"],
        "priority":        classification["priority"],
        "category_reason": classification["category_reason"],
        "priority_reason": classification["priority_reason"],
        "missing_fields":  json.dumps(missing),
        "similar_cases":   json.dumps(similar),
        "briefing":        json.dumps(briefing),
    })

    with get_connection() as conn:
        conn.execute("""
            INSERT INTO complaints (
                complaint_id, title, description, location, incident_time,
                item_details, escape_direction, preferred_language,
                reporter_user_id, reporter_name, reporter_email,
                status, category, reported_category, priority, category_reason, priority_reason,
                missing_fields, similar_cases, briefing,
                created_at, updated_at
            ) VALUES (
                :complaint_id, :title, :description, :location, :incident_time,
                :item_details, :escape_direction, :preferred_language,
                :reporter_user_id, :reporter_name, :reporter_email,
                :status, :category, :reported_category, :priority, :category_reason, :priority_reason,
                :missing_fields, :similar_cases, :briefing,
                :created_at, :updated_at
            )
        """, complaint)
        conn.execute(
            """INSERT INTO status_history
               (complaint_id, old_status, new_status, actor_user_id, note, created_at)
               VALUES (?, NULL, 'New', ?, 'Complaint submitted.', ?)""",
            (complaint_id, complaint["reporter_user_id"], now),
        )

    return jsonify({
        "complaint_id": complaint_id,
        "title": fields["title"],
        "description": description,
        "location": fields["location"],
        "incident_time": fields["incident_time"],
        "item_details": fields["item_details"],
        "escape_direction": fields["escape_direction"],
        "preferred_language": fields["preferred_language"],
        "reporter_name": fields["reporter_name"],
        "reporter_email": complaint["reporter_email"],
        "status": "New",
        "category": classification["category"],
        "reported_category": fields["reported_category"],
        "priority": classification["priority"],
        "category_reason": classification["category_reason"],
        "priority_reason": classification["priority_reason"],
        "missing_fields": missing,
        "similar_cases": similar,
        "briefing": briefing,
        "created_at": now,
        "updated_at": now,
        "note": (
            "Complaint saved to the CRIMVEXA local case database. "
            "It is NOT submitted to any police authority."
        ),
        "disclaimer": classification["disclaimer"],
    }), 201


# ── GET /api/complaints ───────────────────────────────────────────────────────

@complaints_bp.route("/complaints", methods=["GET"])
def list_complaints():
    identity, auth_error = _identity_or_error()
    if auth_error:
        return auth_error
    search = request.args.get("q", "").strip()
    status = request.args.get("status", "").strip()
    category = request.args.get("category", "").strip()
    try:
        limit = min(100, max(1, int(request.args.get("limit", 100))))
        offset = max(0, int(request.args.get("offset", 0)))
    except ValueError:
        return jsonify({"error": "limit and offset must be integers."}), 400

    clauses, params = [], []
    if identity and identity["role"] == "citizen":
        clauses.append("reporter_user_id = ?")
        params.append(identity["user_id"])
    if status:
        clauses.append("status = ?")
        params.append(status)
    if category:
        clauses.append("category = ?")
        params.append(category)
    if search:
        clauses.append("(complaint_id LIKE ? OR title LIKE ? OR description LIKE ? OR location LIKE ?)")
        params.extend([f"%{search}%"] * 4)
    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""

    with get_connection() as conn:
        total = conn.execute(
            f"SELECT COUNT(*) FROM complaints {where}", params
        ).fetchone()[0]
        rows = conn.execute(
            f"SELECT * FROM complaints {where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
            [*params, limit, offset],
        ).fetchall()

    return jsonify({
        "total": total,
        "limit": limit,
        "offset": offset,
        "complaints": [_row_to_dict(r) for r in rows]
    }), 200


# ── GET /api/complaints/<id> ──────────────────────────────────────────────────

@complaints_bp.route("/complaints/<complaint_id>", methods=["GET"])
def get_complaint(complaint_id):
    identity, auth_error = _identity_or_error()
    if auth_error:
        return auth_error
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM complaints WHERE complaint_id = ?",
            (complaint_id,)
        ).fetchone()
        if row and not _can_access(row, identity):
            return jsonify({"error": "Complaint not found."}), 404
        if row:
            result = _attach_related_data(conn, _row_to_dict(row))

    if not row:
        return jsonify({"error": f"Complaint '{complaint_id}' not found."}), 404

    return jsonify(result), 200


@complaints_bp.patch("/complaints/<complaint_id>")
def edit_complaint(complaint_id):
    identity, auth_error = _identity_or_error()
    if auth_error:
        return auth_error
    if not identity:
        return jsonify({"error": "A valid bearer token is required to edit a complaint."}), 401
    if identity["role"] != "citizen":
        return jsonify({"error": "Only the reporting citizen can edit complaint details."}), 403

    data, error = _json_object()
    if error:
        return error
    allowed = {
        "title": 200,
        "description": 10000,
        "location": 500,
        "incident_time": 100,
        "item_details": 1000,
        "escape_direction": 1000,
        "preferred_language": 20,
        "reported_category": 100,
    }
    if not data or set(data) - set(allowed):
        return jsonify({"error": "Provide one or more supported complaint fields only."}), 400
    updates = {}
    for field, value in data.items():
        if not isinstance(value, str) or len(value.strip()) > allowed[field]:
            return jsonify({
                "error": f"{field} must be a string of at most {allowed[field]} characters."
            }), 400
        updates[field] = value.strip()
    if "description" in updates and not updates["description"]:
        return jsonify({"error": "description cannot be empty."}), 400

    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM complaints WHERE complaint_id = ?", (complaint_id,)
        ).fetchone()
        if not row or row["reporter_user_id"] != identity["user_id"]:
            return jsonify({"error": "Complaint not found."}), 404
        if row["status"] != "New":
            return jsonify({"error": "Complaint details can only be edited while status is New."}), 409
        complaint = {**dict(row), **updates}
        classification = classify(complaint)
        missing = detect_missing(complaint)
        similar = find_similar(complaint)
        now = _utc_now()
        briefing = _build_briefing(
            {**complaint, **classification}, missing, similar
        )
        updates.update({
            "category": classification["category"],
            "priority": classification["priority"],
            "category_reason": classification["category_reason"],
            "priority_reason": classification["priority_reason"],
            "missing_fields": json.dumps(missing),
            "similar_cases": json.dumps(similar),
            "briefing": json.dumps(briefing),
            "updated_at": now,
        })
        assignments = ", ".join(f"{field} = :{field}" for field in updates)
        conn.execute(
            f"UPDATE complaints SET {assignments} WHERE complaint_id = :complaint_id",
            {**updates, "complaint_id": complaint_id},
        )
        updated = conn.execute(
            "SELECT * FROM complaints WHERE complaint_id = ?", (complaint_id,)
        ).fetchone()
        result = _attach_related_data(conn, _row_to_dict(updated))
    return jsonify(result), 200


# ── POST /api/complaints/<id>/analyze ────────────────────────────────────────

@complaints_bp.route("/complaints/<complaint_id>/analyze", methods=["POST"])
def analyze_complaint(complaint_id):
    identity, auth_error = _identity_or_error()
    if auth_error:
        return auth_error
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM complaints WHERE complaint_id = ?",
            (complaint_id,)
        ).fetchone()

    if not row:
        return jsonify({"error": f"Complaint '{complaint_id}' not found."}), 404
    if not _can_access(row, identity):
        return jsonify({"error": "Complaint not found."}), 404

    complaint    = _row_to_dict(row)
    classification = classify(complaint)
    missing        = detect_missing(complaint)
    similar        = find_similar(complaint)
    briefing       = _build_briefing(
        {**complaint, **classification}, missing, similar
    )

    now = _utc_now()
    with get_connection() as conn:
        conn.execute("""
            UPDATE complaints
            SET category        = ?,
                priority        = ?,
                category_reason = ?,
                priority_reason = ?,
                missing_fields  = ?,
                similar_cases   = ?,
                briefing        = ?,
                updated_at      = ?
            WHERE complaint_id = ?
        """, (
            classification["category"],
            classification["priority"],
            classification["category_reason"],
            classification["priority_reason"],
            json.dumps(missing),
            json.dumps(similar),
            json.dumps(briefing),
            now,
            complaint_id,
        ))

    return jsonify({
        "complaint_id":   complaint_id,
        "category":       classification["category"],
        "priority":       classification["priority"],
        "category_reason": classification["category_reason"],
        "priority_reason": classification["priority_reason"],
        "missing_fields": missing,
        "similar_cases":  similar if similar else [],
        "similar_cases_note": (
            None if similar
            else "No similar synthetic examples found for this complaint."
        ),
        "briefing":       briefing,
        "disclaimer":     classification["disclaimer"],
    }), 200


# ── PATCH /api/complaints/<id>/status ────────────────────────────────────────

@complaints_bp.route("/complaints/<complaint_id>/status", methods=["PATCH"])
def update_status(complaint_id):
    data, error = _json_object()
    if error:
        return error
    new_status = data.get("status")
    if not isinstance(new_status, str):
        new_status = ""
    new_status = new_status.strip()
    note = data.get("note", "Status updated by authorized personnel.")
    if not isinstance(note, str) or len(note) > 1000:
        return jsonify({"error": "note must be a string of at most 1000 characters."}), 400

    if new_status not in VALID_STATUSES:
        return jsonify({
            "error": f"Invalid status. Allowed values: {sorted(VALID_STATUSES)}"
        }), 400

    identity, auth_error = _identity_or_error()
    if auth_error:
        return auth_error
    if identity and identity["role"] == "citizen":
        return jsonify({"error": "Only authorized investigation personnel can change complaint status."}), 403

    with get_connection() as conn:
        row = conn.execute(
            "SELECT complaint_id, status, reporter_user_id FROM complaints WHERE complaint_id = ?",
            (complaint_id,)
        ).fetchone()

        if not row:
            return jsonify({"error": f"Complaint '{complaint_id}' not found."}), 404
        if not _can_access(row, identity):
            return jsonify({"error": "Complaint not found."}), 404

        now = _utc_now()
        conn.execute(
            "UPDATE complaints SET status = ?, updated_at = ? WHERE complaint_id = ?",
            (new_status, now, complaint_id)
        )
        if row["status"] != new_status:
            conn.execute(
                """INSERT INTO status_history
                   (complaint_id, old_status, new_status, actor_user_id, note, created_at)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (complaint_id, row["status"], new_status,
                 identity["user_id"] if identity else None,
                 note, now),
            )
            if row["reporter_user_id"] is not None:
                conn.execute(
                    """INSERT INTO notifications (user_id, complaint_id, message, created_at)
                       VALUES (?, ?, ?, ?)""",
                    (row["reporter_user_id"], complaint_id,
                     f"Case {complaint_id} status changed to {new_status}.", now),
                )

    # Return the full updated complaint
    with get_connection() as conn:
        updated = conn.execute(
            "SELECT * FROM complaints WHERE complaint_id = ?",
            (complaint_id,)
        ).fetchone()
        result = _attach_related_data(conn, _row_to_dict(updated))

    return jsonify({
        **result,
        "note": "Complaint status updated.",
    }), 200


@complaints_bp.get("/dashboard/stats")
def dashboard_stats():
    identity, auth_error = _identity_or_error()
    if auth_error:
        return auth_error
    where = ""
    params = []
    if identity and identity["role"] == "citizen":
        where = "WHERE reporter_user_id = ?"
        params.append(identity["user_id"])
    with get_connection() as conn:
        total = conn.execute(
            f"SELECT COUNT(*) FROM complaints {where}", params
        ).fetchone()[0]
        statuses = conn.execute(
            f"SELECT status, COUNT(*) AS count FROM complaints {where} GROUP BY status",
            params,
        ).fetchall()
        categories = conn.execute(
            f"""SELECT COALESCE(category, 'Unclassified') AS category, COUNT(*) AS count
                FROM complaints {where} GROUP BY category ORDER BY count DESC""",
            params,
        ).fetchall()
    return jsonify({
        "total": total,
        "by_status": {row["status"]: row["count"] for row in statuses},
        "by_category": [dict(row) for row in categories],
    }), 200


@complaints_bp.route("/complaints/<complaint_id>/evidence", methods=["GET", "POST"])
def complaint_evidence(complaint_id):
    identity, auth_error = _identity_or_error()
    if auth_error:
        return auth_error
    with get_connection() as conn:
        complaint = conn.execute(
            "SELECT * FROM complaints WHERE complaint_id = ?", (complaint_id,)
        ).fetchone()
    if not complaint:
        return jsonify({"error": f"Complaint '{complaint_id}' not found."}), 404
    if not _can_access(complaint, identity):
        return jsonify({"error": "Complaint not found."}), 404

    if request.method == "GET":
        with get_connection() as conn:
            records = conn.execute(
                """SELECT evidence_id, complaint_id, original_name, mime_type,
                          file_size, sha256, created_at
                   FROM evidence WHERE complaint_id = ? ORDER BY created_at""",
                (complaint_id,),
            ).fetchall()
        return jsonify({"evidence": [dict(row) for row in records]}), 200

    files = request.files.getlist("files")
    if not files or any(not file.filename for file in files):
        return jsonify({"error": "Select at least one file using the files field."}), 400
    if len(files) > 10:
        return jsonify({"error": "At most 10 files can be uploaded at once."}), 400

    prepared = []
    for uploaded in files:
        safe_name = secure_filename(uploaded.filename)
        extension = os.path.splitext(safe_name)[1].lower()
        expected_type = ALLOWED_EVIDENCE.get(extension)
        content = uploaded.read(MAX_EVIDENCE_SIZE + 1)
        if not expected_type:
            return jsonify({"error": f"File type is not allowed: {safe_name or 'unnamed file'}."}), 400
        if not content or len(content) > MAX_EVIDENCE_SIZE:
            return jsonify({"error": f"Each file must be between 1 byte and 5 MB: {safe_name}."}), 400
        if uploaded.mimetype and uploaded.mimetype != "application/octet-stream" and uploaded.mimetype != expected_type:
            return jsonify({"error": f"File content type does not match its extension: {safe_name}."}), 400
        if extension == ".pdf" and not content.startswith(b"%PDF-"):
            return jsonify({"error": f"File is not a valid PDF: {safe_name}."}), 400
        if extension == ".png" and not content.startswith(b"\x89PNG\r\n\x1a\n"):
            return jsonify({"error": f"File is not a valid PNG: {safe_name}."}), 400
        if extension in (".jpg", ".jpeg") and not content.startswith(b"\xff\xd8\xff"):
            return jsonify({"error": f"File is not a valid JPEG: {safe_name}."}), 400
        stored_name = f"{uuid.uuid4().hex}{extension}"
        prepared.append({
            "evidence_id": "EV-" + uuid.uuid4().hex[:12].upper(),
            "original_name": safe_name,
            "stored_name": stored_name,
            "mime_type": expected_type or mimetypes.guess_type(safe_name)[0] or "application/octet-stream",
            "file_size": len(content),
            "sha256": hashlib.sha256(content).hexdigest(),
            "content": content,
        })

    upload_dir = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_dir, exist_ok=True)
    saved_paths = []
    try:
        now = _utc_now()
        with get_connection() as conn:
            for item in prepared:
                path = os.path.join(upload_dir, item["stored_name"])
                with open(path, "xb") as stream:
                    stream.write(item["content"])
                saved_paths.append(path)
                conn.execute(
                    """INSERT INTO evidence
                       (evidence_id, complaint_id, original_name, stored_name,
                        mime_type, file_size, sha256, uploaded_by, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (item["evidence_id"], complaint_id, item["original_name"],
                     item["stored_name"], item["mime_type"], item["file_size"],
                     item["sha256"], identity["user_id"] if identity else None, now),
                )
    except (OSError, sqlite3.Error):
        for path in saved_paths:
            if os.path.exists(path):
                os.remove(path)
        current_app.logger.exception("Evidence file could not be stored")
        return jsonify({"error": "Evidence could not be stored. Please retry."}), 500
    except Exception:
        for path in saved_paths:
            if os.path.exists(path):
                os.remove(path)
        raise

    for item in prepared:
        item.pop("content")
        item.pop("stored_name")
    return jsonify({"evidence": prepared}), 201


@complaints_bp.get("/evidence/<evidence_id>/file")
def download_evidence(evidence_id):
    identity, auth_error = _identity_or_error()
    if auth_error:
        return auth_error
    with get_connection() as conn:
        row = conn.execute(
            """SELECT e.*, c.reporter_user_id
               FROM evidence e JOIN complaints c USING (complaint_id)
               WHERE e.evidence_id = ?""",
            (evidence_id,),
        ).fetchone()
    if not row or not _can_access(row, identity):
        return jsonify({"error": "Evidence not found."}), 404
    return send_from_directory(
        current_app.config["UPLOAD_FOLDER"],
        row["stored_name"],
        mimetype=row["mime_type"],
        as_attachment=True,
        download_name=row["original_name"],
    )


@complaints_bp.route("/complaints/<complaint_id>/assignment", methods=["GET", "PUT"])
def complaint_assignment(complaint_id):
    identity, auth_error = _identity_or_error()
    if auth_error:
        return auth_error
    if not identity or identity["role"] not in ("officer", "admin"):
        return jsonify({"error": "Authorized investigation personnel are required."}), 403
    with get_connection() as conn:
        complaint = conn.execute(
            "SELECT complaint_id, assigned_officer_id, reporter_user_id FROM complaints WHERE complaint_id = ?",
            (complaint_id,),
        ).fetchone()
        if not complaint:
            return jsonify({"error": f"Complaint '{complaint_id}' not found."}), 404
        if request.method == "GET":
            officer = conn.execute(
                "SELECT user_id, full_name, email FROM users WHERE user_id = ?",
                (complaint["assigned_officer_id"],),
            ).fetchone() if complaint["assigned_officer_id"] else None
            return jsonify({"assigned_officer": dict(officer) if officer else None}), 200

        data, error = _json_object()
        if error:
            return error
        officer_id = data.get("officer_id", identity["user_id"])
        if not isinstance(officer_id, int) or isinstance(officer_id, bool):
            return jsonify({"error": "officer_id must be an integer."}), 400
        officer = conn.execute(
            "SELECT user_id FROM users WHERE user_id = ? AND role IN ('officer', 'admin')",
            (officer_id,),
        ).fetchone()
        if not officer:
            return jsonify({"error": "The selected user is not authorized investigation personnel."}), 400
        if identity["role"] == "officer" and officer_id != identity["user_id"]:
            return jsonify({"error": "Officers can assign cases to themselves only."}), 403
        now = _utc_now()
        conn.execute(
            "UPDATE complaints SET assigned_officer_id = ?, updated_at = ? WHERE complaint_id = ?",
            (officer_id, now, complaint_id),
        )
        if (
            complaint["reporter_user_id"] is not None
            and complaint["assigned_officer_id"] != officer_id
        ):
            conn.execute(
                """INSERT INTO notifications (user_id, complaint_id, message, created_at)
                   VALUES (?, ?, ?, ?)""",
                (complaint["reporter_user_id"], complaint_id,
                 "An investigation officer has been assigned to your case.", now),
            )
    return jsonify({"complaint_id": complaint_id, "assigned_officer_id": officer_id}), 200


@complaints_bp.route("/complaints/<complaint_id>/notes", methods=["GET", "POST"])
def complaint_notes(complaint_id):
    identity, auth_error = _identity_or_error()
    if auth_error:
        return auth_error
    if not identity or identity["role"] not in ("officer", "admin"):
        return jsonify({"error": "Authorized investigation personnel are required."}), 403
    with get_connection() as conn:
        exists = conn.execute(
            "SELECT 1 FROM complaints WHERE complaint_id = ?", (complaint_id,)
        ).fetchone()
        if not exists:
            return jsonify({"error": f"Complaint '{complaint_id}' not found."}), 404
        if request.method == "GET":
            notes = conn.execute(
                """SELECT n.note_id, n.note, n.created_at, u.full_name AS officer_name
                   FROM investigation_notes n JOIN users u ON u.user_id = n.officer_id
                   WHERE n.complaint_id = ? ORDER BY n.created_at DESC""",
                (complaint_id,),
            ).fetchall()
            return jsonify({"notes": [dict(row) for row in notes]}), 200

        data, error = _json_object()
        if error:
            return error
        note = data.get("note")
        if not isinstance(note, str) or not note.strip() or len(note.strip()) > 4000:
            return jsonify({"error": "note is required and must be at most 4000 characters."}), 400
        cursor = conn.execute(
            """INSERT INTO investigation_notes (complaint_id, officer_id, note, created_at)
               VALUES (?, ?, ?, ?)""",
            (complaint_id, identity["user_id"], note.strip(), _utc_now()),
        )
        created = conn.execute(
            """SELECT note_id, note, created_at FROM investigation_notes
               WHERE note_id = ?""",
            (cursor.lastrowid,),
        ).fetchone()
    return jsonify({"note": dict(created)}), 201


@complaints_bp.get("/notifications")
def list_notifications():
    identity, auth_error = _identity_or_error()
    if auth_error:
        return auth_error
    if not identity:
        return jsonify({"error": "A valid bearer token is required."}), 401
    with get_connection() as conn:
        rows = conn.execute(
            """SELECT notification_id, complaint_id, message, created_at, read_at
               FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100""",
            (identity["user_id"],),
        ).fetchall()
    return jsonify({"notifications": [dict(row) for row in rows]}), 200


@complaints_bp.patch("/notifications/<int:notification_id>/read")
def mark_notification_read(notification_id):
    identity, auth_error = _identity_or_error()
    if auth_error:
        return auth_error
    if not identity:
        return jsonify({"error": "A valid bearer token is required."}), 401
    with get_connection() as conn:
        result = conn.execute(
            """UPDATE notifications SET read_at = ?
               WHERE notification_id = ? AND user_id = ?""",
            (_utc_now(), notification_id, identity["user_id"]),
        )
        if result.rowcount == 0:
            return jsonify({"error": "Notification not found."}), 404
    return jsonify({"notification_id": notification_id, "read": True}), 200
