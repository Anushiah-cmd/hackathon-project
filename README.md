# CRIMVEXA Witness

CRIMVEXA Witness is a local hackathon prototype for drafting fictional incident
reports, suggesting missing details and categories, and displaying a human
review workflow. It is not an official police reporting service.

## Run the backend

From the repository root, install the Python dependencies and start the Flask
API:

```powershell
python -m pip install -r backend/requirements.txt
Set-Location backend
python app.py
```

The API listens only on `127.0.0.1:5000`. Check it at
<http://127.0.0.1:5000/api/health>.

## Run the API-connected frontend

In a second terminal, serve the repository's `frontend` folder:

```powershell
Set-Location frontend
python -m http.server 8001
```

Open <http://127.0.0.1:8001/index.html>. The connected frontend calls the Flask
API, and complaint drafts persist in `backend/crimvexa.db`.

The separate `frontend/crimvexa-demo` folder is a self-contained UI preview
that uses browser storage; it does not use the backend API.

## Test

From the backend folder:

```powershell
python test_backend.py
```

Tests use a temporary SQLite database and do not add test reports to the
development database.

Use synthetic data only. Do not enter real personal information or evidence.
For emergencies in India, call 112.