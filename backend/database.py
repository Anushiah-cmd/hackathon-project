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
    conn.execute("PRAGMA foreign_keys = ON")
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
            PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS users (
                user_id         INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name       TEXT NOT NULL,
                email           TEXT NOT NULL COLLATE NOCASE UNIQUE,
                phone           TEXT,
                password_hash   TEXT NOT NULL,
                role            TEXT NOT NULL DEFAULT 'citizen'
                                CHECK (role IN ('citizen', 'officer', 'admin')),
                created_at      TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS complaints (
                complaint_id    TEXT PRIMARY KEY,
                title           TEXT NOT NULL DEFAULT 'Crime report',
                description     TEXT,
                location        TEXT,
                incident_time   TEXT,
                item_details    TEXT,
                escape_direction TEXT,
                preferred_language TEXT DEFAULT 'en',
                status          TEXT DEFAULT 'New',
                category        TEXT,
                reported_category TEXT,
                priority        TEXT,
                category_reason TEXT,
                priority_reason TEXT,
                missing_fields  TEXT,   -- JSON array stored as text
                similar_cases   TEXT,   -- JSON array stored as text
                potential_duplicates TEXT DEFAULT '[]',
                briefing        TEXT,   -- JSON object stored as text
                reporter_user_id INTEGER REFERENCES users(user_id),
                assigned_officer_id INTEGER REFERENCES users(user_id),
                reporter_name   TEXT,
                reporter_email  TEXT,
                created_at      TEXT DEFAULT (datetime('now')),
                updated_at      TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS evidence (
                evidence_id     TEXT PRIMARY KEY,
                complaint_id    TEXT NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
                original_name   TEXT NOT NULL,
                stored_name     TEXT NOT NULL UNIQUE,
                mime_type       TEXT NOT NULL,
                file_size       INTEGER NOT NULL CHECK (file_size > 0),
                sha256          TEXT NOT NULL,
                uploaded_by     INTEGER REFERENCES users(user_id),
                created_at      TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS status_history (
                history_id      INTEGER PRIMARY KEY AUTOINCREMENT,
                complaint_id    TEXT NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
                old_status      TEXT,
                new_status      TEXT NOT NULL,
                actor_user_id   INTEGER REFERENCES users(user_id),
                note            TEXT,
                created_at      TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS investigation_notes (
                note_id         INTEGER PRIMARY KEY AUTOINCREMENT,
                complaint_id    TEXT NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
                officer_id      INTEGER NOT NULL REFERENCES users(user_id),
                note            TEXT NOT NULL,
                created_at      TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS notifications (
                notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id         INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                complaint_id    TEXT NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
                message         TEXT NOT NULL,
                created_at      TEXT NOT NULL,
                read_at         TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_complaints_created_at
                ON complaints(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_complaints_status
                ON complaints(status);
            CREATE INDEX IF NOT EXISTS idx_evidence_complaint
                ON evidence(complaint_id);
        """)

        columns = {
            row["name"] for row in conn.execute("PRAGMA table_info(complaints)")
        }
        migrations = {
            "title": "ALTER TABLE complaints ADD COLUMN title TEXT NOT NULL DEFAULT 'Crime report'",
            "reported_category": "ALTER TABLE complaints ADD COLUMN reported_category TEXT",
            "reporter_user_id": "ALTER TABLE complaints ADD COLUMN reporter_user_id INTEGER REFERENCES users(user_id)",
            "reporter_name": "ALTER TABLE complaints ADD COLUMN reporter_name TEXT",
            "reporter_email": "ALTER TABLE complaints ADD COLUMN reporter_email TEXT",
            "assigned_officer_id": "ALTER TABLE complaints ADD COLUMN assigned_officer_id INTEGER REFERENCES users(user_id)",
            "potential_duplicates": "ALTER TABLE complaints ADD COLUMN potential_duplicates TEXT DEFAULT '[]'",
        }
        for column, statement in migrations.items():
            if column not in columns:
                conn.execute(statement)
        conn.execute(
            """CREATE INDEX IF NOT EXISTS idx_complaints_category_priority
               ON complaints(category, priority)"""
        )
        conn.execute(
            """CREATE INDEX IF NOT EXISTS idx_complaints_assigned_officer
               ON complaints(assigned_officer_id)"""
        )

    print("[DB] Tables ready ->", _database_path())
