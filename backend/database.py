"""
CRIMVEXA WITNESS — Database Setup (SQLite)
Creates tables automatically on first startup.
"""

import os
import sqlite3
from contextlib import contextmanager

from flask import current_app, has_app_context

DEFAULT_DB_PATH = os.environ.get(
    "CRIMVEXA_DB_PATH",
    os.path.join(os.path.dirname(__file__), "crimvexa.db"),
)


def _database_path():
    if has_app_context():
        return current_app.config["DATABASE"]
    return DEFAULT_DB_PATH


@contextmanager
def get_connection():
    """Yield a transaction-scoped connection and always close it."""
    db_path = _database_path()
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    conn = sqlite3.connect(db_path, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    try:
        with conn:
            yield conn
    finally:
        conn.close()


def init_db():
    """Create all required tables if they do not already exist."""
    with get_connection() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS complaints (
                complaint_id    TEXT PRIMARY KEY,
                description     TEXT,
                location        TEXT,
                incident_time   TEXT,
                item_details    TEXT,
                escape_direction TEXT,
                preferred_language TEXT DEFAULT 'en',
                status          TEXT DEFAULT 'New',
                category        TEXT,
                priority        TEXT,
                category_reason TEXT,
                priority_reason TEXT,
                missing_fields  TEXT,   -- JSON array stored as text
                similar_cases   TEXT,   -- JSON array stored as text
                briefing        TEXT,   -- JSON object stored as text
                created_at      TEXT DEFAULT (datetime('now')),
                updated_at      TEXT DEFAULT (datetime('now'))
            );
        """)
    print("[DB] Tables ready ->", _database_path())
