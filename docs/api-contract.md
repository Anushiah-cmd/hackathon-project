# CRIMVEXA AI — API Contract

> This local application stores records in SQLite and does not submit reports to
> a police authority. Category/priority suggestions and sample-case matches are
> rule-based aids, not official decisions. Call 112 in India in an emergency.

Base URL (local development): `http://127.0.0.1:5000`

---

## Endpoints

### 1. Health Check

```
GET /api/health
```

**Response 200**
```json
{
  "status": "ok",
  "service": "Crimvexa Witness Backend",
  "note": "Hackathon prototype — fictional/demonstration data only"
}
```

---

### 2. Submit Complaint

```
POST /api/complaints
Content-Type: application/json
```

**Request body**

| Field | Required | Description |
|-------|----------|-------------|
| `description` | ✅ Yes | What happened (min 1 character) |
| `location` | Optional | Where it happened |
| `incident_time` | Optional | When it happened |
| `item_details` | Optional | Items involved |
| `escape_direction` | Optional | Suspect description / direction |
| `preferred_language` | Optional | Default: `en` |

**Example request**
```json
{
  "description": "My phone was snatched near the bus stand.",
  "location": "Central Bus Stand, Chennai",
  "incident_time": "2024-01-15 18:30",
  "item_details": "iPhone 13, black, ₹60,000",
  "escape_direction": "Towards Anna Salai"
}
```

**Response 201**
```json
{
  "complaint_id": "CW-A1B2C3D4",
  "description": "My phone was snatched near the bus stand.",
  "location": "Central Bus Stand, Chennai",
  "incident_time": "2024-01-15 18:30",
  "item_details": "iPhone 13, black",
  "escape_direction": "Towards Anna Salai",
  "preferred_language": "en",
  "status": "New",
  "category": "Theft",
  "priority": "Medium",
  "category_reason": "Keywords detected: snatched, phone",
  "priority_reason": "Category suggests medium priority by default.",
  "missing_fields": [],
  "similar_cases": [
    {
      "case_id": "SYN-001",
      "category": "Theft",
      "summary": "[FICTIONAL] Mobile phone snatched near Central Bus Stand...",
      "match_reason": "Shared keywords: phone, snatch, bus stand"
    }
  ],
  "briefing": { "...": "..." },
  "note": "Complaint saved to the CRIMVEXA local case database. It is NOT submitted to any police authority.",
  "disclaimer": "⚠️ Automated suggestion only. Requires human officer review.",
  "created_at": "2026-10-10T12:00:00+00:00",
  "updated_at": "2026-10-10T12:00:00+00:00"
}
```

**Response 400** (missing description)
```json
{ "error": "description is required and cannot be empty." }
```

The request body must be a JSON object. `description` is required and limited
to 10,000 characters. Optional text fields must be strings and are length
limited; invalid JSON shapes, field types, and oversized values return HTTP
400. Requests larger than 64 KiB return HTTP 413.

---

### 3. List All Complaints

```
GET /api/complaints
```

**Response 200**
```json
{
  "total": 2,
  "complaints": [
    {
      "complaint_id": "CW-A1B2C3D4",
      "description": "My phone was snatched...",
      "status": "New",
      "category": "Theft",
      "priority": "Medium",
      "created_at": "2024-01-15T13:00:00"
    }
  ]
}
```

---

### 4. Get Single Complaint

```
GET /api/complaints/{complaint_id}
```

**Response 200** — full complaint object including analysis results

**Response 404**
```json
{ "error": "Complaint 'CW-NOTREAL' not found." }
```

---

### 5. Analyze Complaint

```
POST /api/complaints/{complaint_id}/analyze
```

Runs (or re-runs) missing-field detection, category/priority classification, and similar-case matching. Saves results to the database.

**Response 200**
```json
{
  "complaint_id": "CW-A1B2C3D4",
  "category": "Theft",
  "priority": "Medium",
  "category_reason": "Keywords detected: snatched, phone",
  "priority_reason": "Category suggests medium priority by default.",
  "missing_fields": [
    {
      "field": "item_details",
      "question": "Can you describe the item(s) involved?"
    }
  ],
  "similar_cases": [
    {
      "case_id": "SYN-001",
      "category": "Theft",
      "summary": "[FICTIONAL] ...",
      "match_reason": "Shared keywords: phone, snatch"
    }
  ],
  "similar_cases_note": null,
  "briefing": { "...": "..." },
  "disclaimer": "⚠️ Automated suggestion only. Requires human officer review."
}
```

**Response 404** — complaint not found

---

### 6. Update Complaint Status

```
PATCH /api/complaints/{complaint_id}/status
Content-Type: application/json
```

**Request body**
```json
{ "status": "Under Review" }
```

Valid status values: `New` · `Under Review` · `Resolved`
Authorized officer/admin tokens are required to update a status. Status changes
are added to the case history and notify the reporter.

**Response 200** — updated full complaint object + note

**Response 400**
```json
{ "error": "Invalid status. Allowed values: ['New', 'Resolved', 'Under Review']" }
```

**Response 404** — complaint not found

---

## Standard Field Names

| Field | Type | Description |
|-------|------|-------------|
| `complaint_id` | string | Unique ID, e.g. `CW-A1B2C3D4` |
| `description` | string | Complaint narrative |
| `location` | string | Incident location |
| `incident_time` | string | When it happened |
| `item_details` | string | Items involved |
| `escape_direction` | string | Suspect info / direction |
| `preferred_language` | string | User's language preference |
| `status` | string | `New` / `Under Review` / `Resolved` |
| `category` | string | Suggested crime category |
| `priority` | string | `High` / `Medium` / `Low` |
| `category_reason` | string | Why this category was suggested |
| `priority_reason` | string | Why this priority was suggested |
| `missing_fields` | array | List of `{field, question}` objects |
| `similar_cases` | array | Synthetic similar cases |
| `briefing` | object | Officer briefing summary |
| `created_at` | string | ISO 8601 timestamp |
| `updated_at` | string | ISO 8601 timestamp |

---

## Frontend Integration

The frontend should call:

```
http://127.0.0.1:5000/api/...
```

CORS is enabled for local development. The browser application in
`frontend/crimvexa-demo` calls this API directly.

---

## Account and investigation endpoints

### Register and sign in

- `POST /api/auth/register` accepts `full_name`, `email`, `phone`, and
  `password` (8–256 characters). Public registration creates citizen accounts
  only and returns a signed bearer token.
- `POST /api/auth/login` accepts `email` and `password`; returns a bearer token
  and public user profile.
- `GET /api/auth/me` returns the authenticated user profile.
- Send authenticated requests with `Authorization: Bearer <token>`. Tokens
  expire after 24 hours. Staff roles are granted by an administrator using
  `backend/manage_user.py`.

All case, evidence, dashboard, and notification requests require a bearer
token. Citizen complaint lists and detail/evidence access are scoped to that
citizen's own cases. Invalid, absent, or expired tokens return 401. Deploy
behind suitable access controls before exposing the service to a network.

### Search, pagination, and statistics

`GET /api/complaints?q=<text>&status=<status>&category=<category>&limit=50&offset=0`
searches and filters complaints. `limit` is clamped to 1–100. The response
contains `total`, `limit`, `offset`, and `complaints`.

`GET /api/dashboard/stats` returns database-backed `total`, `by_status`, and
`by_category` counts. Citizen tokens receive statistics for their own cases;
staff tokens receive system-wide counts.

### Evidence

- `POST /api/complaints/{id}/evidence` accepts multipart `files` fields (up to
  10 files, each up to 5 MiB). Accepted extensions: JPG, JPEG, PNG, PDF, TXT,
  MP3, WAV, MP4, WebM. The API checks file type, validates common PDF/image
  signatures, generates storage names, and records size and SHA-256 metadata.
- `GET /api/complaints/{id}/evidence` lists metadata.
- `GET /api/evidence/{evidence_id}/file` downloads a stored file.

Evidence is stored under `backend/uploads`, outside the frontend's public
directory. Uploads are not malware-scanned or OCR-processed.

### Case updates, assignments, notes, and notifications

- `GET /api/complaints/{id}` includes evidence metadata and status history.
- `PATCH /api/complaints/{id}` lets the owning citizen update report details
  while status is `New`; the analysis suggestions are recalculated.
- `PUT /api/complaints/{id}/assignment` assigns to the current officer by
  default or accepts an authorized staff `officer_id`.
- `GET|POST /api/complaints/{id}/notes` lists or adds internal staff notes.
- `GET /api/notifications` lists notifications for the authenticated user.
- `PATCH /api/notifications/{notification_id}/read` marks that user's
  notification as read.

Assignment and internal-note endpoints require an officer/admin token. Status
history is created at submission and on each status change. Internal notes
remain staff-only.
