"""CRIMVEXA local case-management API application."""

import math
import os
import secrets

from flask import Flask, jsonify
from flask_cors import CORS
from database import DEFAULT_DB_PATH, init_db
from routes.auth import auth_bp
from routes.complaints import complaints_bp
from routes.health import health_bp
from werkzeug.exceptions import RequestEntityTooLarge


def create_app(config=None):
    app = Flask(__name__)
    app.config.from_mapping(
        DATABASE=DEFAULT_DB_PATH,
        MAX_CONTENT_LENGTH=52 * 1024 * 1024,
        UPLOAD_FOLDER=os.path.join(os.path.dirname(__file__), "uploads"),
        AUTH_SECRET=os.environ.get("CRIMVEXA_AUTH_SECRET") or secrets.token_bytes(32),
        POTENTIAL_DUPLICATE_THRESHOLD=os.environ.get(
            "CRIMVEXA_SIMILARITY_THRESHOLD", "0.35"
        ),
    )
    if config:
        app.config.update(config)
    try:
        similarity_threshold = float(app.config["POTENTIAL_DUPLICATE_THRESHOLD"])
    except (TypeError, ValueError) as error:
        raise ValueError(
            "POTENTIAL_DUPLICATE_THRESHOLD must be a number from 0 to 1."
        ) from error
    if not math.isfinite(similarity_threshold) or not 0 <= similarity_threshold <= 1:
        raise ValueError("POTENTIAL_DUPLICATE_THRESHOLD must be a number from 0 to 1.")
    app.config["POTENTIAL_DUPLICATE_THRESHOLD"] = similarity_threshold
    if isinstance(app.config["AUTH_SECRET"], str):
        app.config["AUTH_SECRET"] = app.config["AUTH_SECRET"].encode("utf-8")

    # Allow frontend (running on a different port) to call this backend
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialise SQLite database and create tables on startup
    with app.app_context():
        init_db()

    # Register route blueprints
    app.register_blueprint(health_bp,     url_prefix="/api")
    app.register_blueprint(auth_bp,       url_prefix="/api")
    app.register_blueprint(complaints_bp, url_prefix="/api")

    @app.errorhandler(RequestEntityTooLarge)
    def request_too_large(_error):
        return jsonify({"error": "Request exceeds the 52 MB upload limit."}), 413

    return app


if __name__ == "__main__":
    app = create_app()
    print("=" * 55)
    print("  CRIMVEXA AI — Backend running")
    print("  Health check -> http://127.0.0.1:5000/api/health")
    print("  Local case-management service; not an official police authority")
    print("=" * 55)
    app.run(debug=False, host="127.0.0.1", port=5000)
