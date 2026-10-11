# CRIMVEXA AI

CRIMVEXA is a local case-management application for structured incident intake
and investigation support. It stores reports in SQLite, applies transparent
keyword-based category and priority suggestions, attaches evidence files, and
tracks staff status updates. Automated suggestions are not decisions. This
application does not submit reports to a police authority or replace emergency
services; call 112 in India if there is immediate danger.

## Requirements

- Python 3.10 or later
- Packages in `backend/requirements.txt`
- A modern browser; browser speech input depends on browser support

The repository already uses Flask, SQLite, and static HTML/CSS/JavaScript. It
continues to use those installed technologies rather than adding frameworks or
external services. The database is initialized and migrated on API startup.

## Start the application

From the repository root, install the backend packages and start the API:

```powershell
python -m pip install -r backend/requirements.txt
Set-Location backend
python app.py
```

In another terminal, serve the browser application:

```powershell
Set-Location frontend/crimvexa-demo
python -m http.server 8000
```

Open <http://127.0.0.1:8000/index.html>. API health is available at
<http://127.0.0.1:5000/api/health>.

## Main workflow

1. Register a citizen account and sign in.
   Case, evidence, dashboard, and notification API requests require the
   returned bearer token. Citizen accounts can access only their own cases.
2. Submit an incident with its date/time, location, category, and narrative.
3. Review the stored suggested category, priority, missing details, and sample
   keyword matches.
4. Upload supported evidence (JPG, PNG, PDF, TXT, MP3, WAV, MP4, or WebM; up to
   5 MB per file) and view it from the complaint details page.
5. Edit complaint details while the case is still `New`, and track status
   history and notifications from the citizen dashboard.
6. Investigation staff can review cases, assign a case to themselves, add
   internal notes, and update status.

New accounts are citizens. To grant a registered account staff access, stop
the API and run this from the `backend` directory:

```powershell
python manage_user.py staff@example.com officer
```

The account must already exist. Use `admin` instead of `officer` to grant
administrator role; administrator accounts have investigation permissions.
Do not expose this local development API or its uploaded evidence on a public
network.

## Data and configuration

- SQLite database: `backend/crimvexa.db` (override with `CRIMVEXA_DB_PATH`).
- Evidence files: `backend/uploads/` (not served as a public static directory).
- Set `CRIMVEXA_AUTH_SECRET` to a long random value to keep bearer tokens valid
  across API restarts. Without it, the local server generates a temporary key
  at startup.
- Use synthetic information only. This local implementation is not connected
  to a police, emergency, identity-verification, OCR, or external AI service.

## Tests

From the `backend` directory:

```powershell
python test_backend.py
```

Tests use a temporary SQLite database and temporary evidence storage.
