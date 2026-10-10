"""
CRIMVEXA WITNESS — Database Setup (SQLite)
Creates tables automatically on first startup.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "crimvexa.db")


def get_connection():
    """Return a SQLite connection with row_factory for dict-like rows."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")   # safe for concurrent reads
    return conn


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
    print("[DB] Tables ready ->", DB_PATH)
