"""
CRIMVEXA WITNESS — Health Check Route
GET /api/health
"""

from flask import Blueprint, jsonify

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "Crimvexa Witness Backend",
        "note": "Local application API; records are not submitted to a police authority."
    }), 200
