"""
CRIMVEXA WITNESS — Complaint Routes
All /api/complaints endpoints.
PROTOTYPE: Stores fictional/demonstration data only in local SQLite.
"""

import json
import uuid
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from database import get_connection
from analysis import classify, detect_missing, find_similar

complaints_bp = Blueprint("complaints", __name__)

VALID_STATUSES = {"New", "Under Review", "Resolved"}
TEXT_LIMITS = {
    "description": 10000,
    "location": 500,
    "incident_time": 100,
    "item_details": 1000,
    "escape_direction": 1000,
    "preferred_language": 20,
}


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
            "⚠️ This briefing is generated automatically for demonstration "
            "purposes only. All information must be verified by a human officer "
            "before any action is taken."
        ),
    }


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _json_object():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return None, (jsonify({
            "error": "Request body must be a JSON object."
        }), 400)
    return data, None


# ── POST /api/complaints ──────────────────────────────────────────────────────

@complaints_bp.route("/complaints", methods=["POST"])
def submit_complaint():
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
        fields[field] = value or ("en" if field == "preferred_language" else None)

    complaint_id = "CW-" + uuid.uuid4().hex[:8].upper()
    now = _utc_now()

    complaint = {
        "complaint_id":       complaint_id,
        "description":        description,
        "location":           fields["location"],
        "incident_time":      fields["incident_time"],
        "item_details":       fields["item_details"],
        "escape_direction":   fields["escape_direction"],
        "preferred_language": fields["preferred_language"],
        "status":             "New",
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
                complaint_id, description, location, incident_time,
                item_details, escape_direction, preferred_language,
                status, category, priority, category_reason, priority_reason,
                missing_fields, similar_cases, briefing,
                created_at, updated_at
            ) VALUES (
                :complaint_id, :description, :location, :incident_time,
                :item_details, :escape_direction, :preferred_language,
                :status, :category, :priority, :category_reason, :priority_reason,
                :missing_fields, :similar_cases, :briefing,
                :created_at, :updated_at
            )
        """, complaint)

    return jsonify({
        "complaint_id": complaint_id,
        "description": description,
        "location": fields["location"],
        "incident_time": fields["incident_time"],
        "item_details": fields["item_details"],
        "escape_direction": fields["escape_direction"],
        "preferred_language": fields["preferred_language"],
        "status": "New",
        "category": classification["category"],
        "priority": classification["priority"],
        "category_reason": classification["category_reason"],
        "priority_reason": classification["priority_reason"],
        "missing_fields": missing,
        "similar_cases": similar,
        "briefing": briefing,
        "created_at": now,
        "updated_at": now,
        "note": (
            "✅ Complaint saved as a local demonstration draft. "
            "This is NOT submitted to any real police authority."
        ),
        "disclaimer": classification["disclaimer"],
    }), 201


# ── GET /api/complaints ───────────────────────────────────────────────────────

@complaints_bp.route("/complaints", methods=["GET"])
def list_complaints():
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM complaints ORDER BY created_at DESC"
        ).fetchall()

    return jsonify({
        "total": len(rows),
        "complaints": [_row_to_dict(r) for r in rows]
    }), 200


# ── GET /api/complaints/<id> ──────────────────────────────────────────────────

@complaints_bp.route("/complaints/<complaint_id>", methods=["GET"])
def get_complaint(complaint_id):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM complaints WHERE complaint_id = ?",
            (complaint_id,)
        ).fetchone()

    if not row:
        return jsonify({"error": f"Complaint '{complaint_id}' not found."}), 404

    return jsonify(_row_to_dict(row)), 200


# ── POST /api/complaints/<id>/analyze ────────────────────────────────────────

@complaints_bp.route("/complaints/<complaint_id>/analyze", methods=["POST"])
def analyze_complaint(complaint_id):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM complaints WHERE complaint_id = ?",
            (complaint_id,)
        ).fetchone()

    if not row:
        return jsonify({"error": f"Complaint '{complaint_id}' not found."}), 404

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

    if new_status not in VALID_STATUSES:
        return jsonify({
            "error": f"Invalid status. Allowed values: {sorted(VALID_STATUSES)}"
        }), 400

    with get_connection() as conn:
        row = conn.execute(
            "SELECT complaint_id FROM complaints WHERE complaint_id = ?",
            (complaint_id,)
        ).fetchone()

        if not row:
            return jsonify({"error": f"Complaint '{complaint_id}' not found."}), 404

        now = _utc_now()
        conn.execute(
            "UPDATE complaints SET status = ?, updated_at = ? WHERE complaint_id = ?",
            (new_status, now, complaint_id)
        )

    # Return the full updated complaint
    with get_connection() as conn:
        updated = conn.execute(
            "SELECT * FROM complaints WHERE complaint_id = ?",
            (complaint_id,)
        ).fetchone()

    return jsonify({
        **_row_to_dict(updated),
        "note": "Demonstration status updated. Not an official police record.",
    }), 200
