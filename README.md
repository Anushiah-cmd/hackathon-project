# CRIMVEXA AI

**A multilingual crime-reporting and case-management project for the Techashy 2.0 Security Track.**

CRIMVEXA helps citizens prepare structured incident reports and helps staff review, triage, and track cases. The repository contains two runnable implementations; they are separate applications with separate APIs and data stores. Choose one below to run.

> **Safety and scope:** This is a hackathon/local demonstration, not an emergency service or official police filing system. Automated category, priority, and similarity results are review aids and require human judgment. Do not enter real personal or case information. Call 112 in India if anyone is in immediate danger.

## Project at a glance

| Implementation | Frontend | Backend and data | Best for |
| --- | --- | --- | --- |
| **Flask case-management app** | Static HTML, CSS, and JavaScript in `frontend/crimvexa-demo/` | Flask REST API and SQLite in `backend/` | The repository's SQLite-backed case workflow |
| **React/Express demo** | React, TypeScript, Vite, and Tailwind in `frontend/react-express-app/` | Express server and in-memory synthetic demo data | The richer multilingual voice, triage, forensic, and agent UI |

The two implementations are **not wired to one another**. Start the matching frontend and backend described in each section; do not start one frontend expecting it to use the other implementation's API.

## Repository map

```text
.
├── README.md                         # Judge-facing entry point and run instructions
├── PROJECT_OVERVIEW.txt              # Plain-text project summary
├── backend/                          # Flask API, SQLite persistence, and tests
│   ├── routes/                       # Health, authentication, and complaint routes
│   ├── analysis.py                   # Explainable analysis helpers
│   ├── database.py                   # SQLite schema and persistence
│   ├── app.py                        # Flask application entry point
│   └── test_backend.py               # Backend tests
├── docs/
│   └── api-contract.md               # Flask API request/response contract
└── frontend/
    ├── index.html                    # Redirect to the Flask-backed web demo
    ├── crimvexa-demo/                # Static frontend for the Flask API
    └── react-express-app/            # Standalone React + Express implementation
        ├── src/                      # React interface, services, and types
        ├── tests/                    # Integration and transcription tests
        ├── server.ts                 # Express API and Vite development host
        └── package.json              # Install, run, build, and test scripts
```

## Option A: Run the Flask + SQLite app

Requirements: Python 3.10 or later.

In PowerShell, from the repository root, start the API:

```powershell
python -m pip install -r backend/requirements.txt
Set-Location backend
python app.py
```

In a second PowerShell window, serve the static browser app:

```powershell
Set-Location frontend/crimvexa-demo
python -m http.server 8000
```

Open <http://127.0.0.1:8000/>. The API health endpoint is <http://127.0.0.1:5000/api/health>.

This implementation stores cases in SQLite, supports citizen and staff workflows, and uses transparent keyword-based triage. Its tests use temporary database and evidence locations:

```powershell
Set-Location backend
python test_backend.py
```

## Option B: Run the React + Express app

Requirements: Node.js and npm. Open PowerShell in the app directory:

```powershell
Set-Location frontend/react-express-app
npm install
Copy-Item .env.example .env
```

If using microphone transcription, add your OpenAI API key to `.env` as `OPENAI_API_KEY`. This key is read by the server only; never add it to frontend code or commit `.env`. `OPENAI_TRANSCRIPTION_MODEL` defaults to `gpt-transcribe`. Without a key, citizens can still type a complaint, but server-based audio transcription is unavailable.

Start the app:

```powershell
npm run dev
```

Open <http://localhost:3000>. Run the checks from the same directory:

```powershell
npm test
npm run lint
npm run build
```

The React/Express demo uses synthetic in-memory case data and is separate from the Flask/SQLite database. Audio sent for transcription is held in memory for the request, limited to 20 MB, and is not persisted by this app. Transcripts are returned in the selected language without automatic translation.

## Suggested judge walkthrough

1. Start **one** implementation using its run instructions above.
2. Register or use the demo citizen workflow and submit a synthetic incident.
3. Review the generated case details and transparent triage suggestions.
4. If using the React/Express demo, explore officer review, the forensic view, and agent/MCP demonstrations. For microphone transcription, configure the server-side OpenAI key first.
5. Explain which features are local demonstrations and which use external services; do not present a mock portal or automated suggestion as an official police action.

## Data, configuration, and limitations

- Flask database: `backend/crimvexa.db` by default; configure `CRIMVEXA_DB_PATH` to use another path.
- Flask evidence uploads: `backend/uploads/`; uploaded files are not served as public static files.
- Flask authentication: configure `CRIMVEXA_AUTH_SECRET` with a strong random value for stable local tokens.
- Flask duplicate-review threshold: `CRIMVEXA_SIMILARITY_THRESHOLD`, from `0` to `1` (default `0.35`).
- React/Express OpenAI configuration belongs in `frontend/react-express-app/.env` and must remain private.
- The Flask implementation does not call external AI services. Its classifications and priorities are explainable keyword baselines, not validated predictive models.
- The React/Express implementation is a separate demonstration; its mock police-portal workflow does not submit to a real police authority.
- Use synthetic information only and do not expose either development server or uploaded evidence to a public network.

See [`PROJECT_OVERVIEW.txt`](PROJECT_OVERVIEW.txt) for a compact plain-text summary and [`docs/api-contract.md`](docs/api-contract.md) for the Flask API contract.
