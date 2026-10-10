# CRIMVEXA WITNESS — API Contract

> **Prototype notice:** This is a 24-hour hackathon demonstration. All data is fictional/synthetic and stored locally in SQLite. No complaints are submitted to any real police authority.

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
  "status": "New",
  "category": "Theft",
  "priority": "Medium",
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
  "note": "✅ Complaint saved as a local demonstration draft. This is NOT submitted to any real police authority.",
  "disclaimer": "⚠️ Automated suggestion only. Requires human officer review."
}
```

**Response 400** (missing description)
```json
{ "error": "description is required and cannot be empty." }
```

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

CORS is enabled for all origins during development. To switch from mock data to the real backend, replace mock function calls with `fetch()` calls to the above endpoints.
