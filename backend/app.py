"""
CRIMVEXA WITNESS — Main Flask Application Entry Point
Hackathon Prototype | Fictional/Demonstration Use Only
"""

from flask import Flask
from flask_cors import CORS
from database import DEFAULT_DB_PATH, init_db
from routes.complaints import complaints_bp
from routes.health import health_bp


def create_app(config=None):
    app = Flask(__name__)
    app.config.from_mapping(
        DATABASE=DEFAULT_DB_PATH,
        MAX_CONTENT_LENGTH=64 * 1024,
    )
    if config:
        app.config.update(config)

    # Allow frontend (running on a different port) to call this backend
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialise SQLite database and create tables on startup
    with app.app_context():
        init_db()

    # Register route blueprints
    app.register_blueprint(health_bp,     url_prefix="/api")
    app.register_blueprint(complaints_bp, url_prefix="/api")

    return app


if __name__ == "__main__":
    app = create_app()
    print("=" * 55)
    print("  CRIMVEXA WITNESS — Backend running")
    print("  Health check -> http://127.0.0.1:5000/api/health")
    print("  PROTOTYPE: fictional/demonstration data only")
    print("=" * 55)
    app.run(debug=True, host="127.0.0.1", port=5000)
