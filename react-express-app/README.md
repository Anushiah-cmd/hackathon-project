# CRIMVEXA AI (Crimvexa Witness)
**Smart Crime Reporting with AI and Digital Evidence Analysis**
*Voice-First, Multi-Agent Crime Reporting System with On-Device AI, Digital Forensics, and Automatic Case Filing*

---

## 1. Project Overview & Deliverables
CRIMVEXA AI bridges the gap between distressed citizens and law enforcement agencies. Built for the Techashy 2.0 Security Track, it turns natural-language voice/text statements into structured incident reports, calculates cryptographic **FIPS 180-4 SHA-256** checksums on digital evidence, runs multi-agent investigative triage, discovers related cases via the **Model Context Protocol (MCP)**, and demonstrates automated e-filing into a local mock police portal.

### Supported User Personas
- **Citizen**: Voice/text incident reporting, follow-up interview assistance, evidence upload, real-time tracking timeline, and mock police portal filing.
- **Police Officer**: Case triage workbench, priority queue, investigative note logging, officer assignment, and automated officer briefings.
- **Cyber Crime Officer**: Specialized cyber fraud module (UPI scams, phishing URLs, malicious APKs, 1930 Golden Hour financial freeze notices).
- **Forensic Expert**: Digital evidence laboratory, live cryptographic SHA-256 recalculation, chain of custody logs, and OCR inspection.
- **Administrator**: System audit ledger, observability, multi-agent metrics, and synthetic seed database control.

---

## 2. Repository Structure
```
├── server.ts                       # Full-Stack Express Server (API, Multi-Agent Engine, MCP Tools)
├── index.html                      # HTML5 Entry Point with Dark Cyber UI and Meta Sync
├── metadata.json                   # Applet Metadata & Permissions
├── package.json                    # Dependencies & Run Scripts
├── tsconfig.json                   # TypeScript Compiler Configuration
├── vite.config.ts                  # Vite + Tailwind v4 Configuration
├── tests/
│   └── test_suite.ts               # 12 Automated Integration & Algorithm Tests
├── src/
│   ├── main.tsx                    # React Root Entry Point
│   ├── App.tsx                     # Main App Shell & Tab Navigation
│   ├── index.css                   # Tailwind CSS v4 Global Styling, Scanlines & Audio Waves
│   ├── types.ts                    # TypeScript Domain Interfaces & Agent Contracts
│   ├── services/
│   │   └── api.ts                  # Shared REST API Client & Helper Functions
│   └── components/
│       ├── Navbar.tsx              # Top Navigation Bar & Persona Switcher
│       ├── CitizenPortal.tsx       # Voice/Text Intake, Interviewer Agent, Evidence Uploader
│       ├── CaseTracking.tsx        # Real-Time Case Progress Timeline & Receipt
│       ├── OfficerDashboard.tsx    # Police Triage Workbench, Status Updates, Notes, Briefing
│       ├── CyberCrimeModule.tsx    # UPI Scam Triage, Domain Watchlist, 1930 Lien Action
│       ├── ForensicLab.tsx         # Evidence Vault, Live SHA-256 Recalculation & Tamper Check
│       ├── AgentStudio.tsx         # Multi-Agent Observability & Interactive MCP Tool Runner
│       └── AuditView.tsx           # SCRB Immutable Audit History & Demo DB Reset
```

---

## 3. Backend REST API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check, active agents list, database cases count |
| `GET` | `/api/auth/me` | Fetch active authenticated user profile |
| `POST` | `/api/auth/login` | Switch user persona or authenticate |
| `POST` | `/api/auth/register` | Register new user or officer |
| `GET` | `/api/complaints` | Filterable complaint list (status, priority, category, search) |
| `POST` | `/api/complaints` | Create validated complaint with server-generated ID & AI analysis |
| `GET` | `/api/complaints/:id` | Fetch full case details, evidence list, and audit history |
| `PATCH` | `/api/complaints/:id/status` | Update case status lifecycle (`SUBMITTED` → `UNDER_REVIEW` → `RESOLVED`) |
| `POST` | `/api/complaints/:id/notes` | Append officer investigation notes (internal or citizen-visible) |
| `POST` | `/api/complaints/:id/assign` | Assign officer and department to case |
| `POST` | `/api/complaints/:id/evidence` | Attach digital evidence with cryptographic SHA-256 hash |
| `POST` | `/api/evidence/verify-hash` | Recalculate and verify SHA-256 checksum integrity |
| `POST` | `/api/audio/transcriptions` | Transcribe a short-lived in-memory audio upload with OpenAI Audio Transcriptions |
| `POST` | `/api/complaints/:id/analyze` | Trigger full multi-agent triage pipeline |
| `GET` | `/api/complaints/:id/briefing` | Generate structured officer executive briefing |
| `POST` | `/api/mock-portal/submit` | Automated browser/mock police FIR portal filing |
| `POST` | `/api/mcp/search-cases` | **MCP Tool**: TF-IDF cosine case similarity query |
| `POST` | `/api/mcp/find-cameras` | **MCP Tool**: Proximity CCTV camera registry lookup |
| `GET` | `/api/officer/dashboard` | Real-time counts (total, new, review, cyber, resolved) |
| `GET` | `/api/system/audit-logs` | Immutable audit event history |
| `POST` | `/api/system/reset-demo` | Reset database to clean canonical synthetic records |

---

## 4. AI/ML Algorithms Implemented
1. **System 1 Fast Category Classifier (`classifier`)**:
   - High-speed token feature extraction analyzing crime lexicons (UPI, Phishing, Burglary, Extortion, Assault).
   - Produces category label, confidence percentage (62%–96%), and transparent explanation.
   - Verified execution latency: ~8–9ms.
2. **Transparent Priority Urgency Scorer (`priority_scorer`)**:
   - Transparent rule-based heuristic evaluating physical harm threats (+45), monetary loss (+25), and Golden Hour urgency (+20).
   - Returns levels: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
   - Clear safety disclosure: *"Deterministic rule-based triage; human officer confirmation required."*
3. **Follow-Up Interviewer Agent (`interviewer`)**:
   - Identifies missing critical parameters (time window, specific physical/digital location, loss valuation, suspect handles, witnesses).
   - Generates clickable clarifying prompt pills to augment the citizen's incident draft.
4. **Case Linking & Duplicate Detection Agent (`case_linking` / MCP Tool)**:
   - Term Frequency - Inverse Document Frequency (TF-IDF) representation and vector cosine similarity.
   - Detects recurring suspect UPI accounts, identical MOs, or cross-jurisdiction patterns.
   - Returns candidate case IDs, similarity percentages, and matched keyword tokens.
5. **Digital Evidence Integrity Agent (`evidence_analyzer`)**:
   - Native FIPS 180-4 SHA-256 cryptographic hashing on all uploaded evidence files.
   - Interactive re-verification tool to detect post-upload tampering.
6. **Officer Briefing Agent (`briefing`)**:
   - Synthesizes structured officer summaries:
     - 1. Verified Citizen Facts
     - 2. Unknowns & Critical Missing Details
     - 3. AI Automated Suggestions (Human Review Required)
     - 4. Immediate Recommended Investigative Steps
7. **Mock Police Portal Automated Filing Agent (`filing`)**:
   - Emulates browser automation to file reviewed complaints into the local mock police portal after explicit citizen consent, generating verifiable FIR receipts (`MOCK-FIR-2026-XXXX`).

---

## 5. Model Context Protocol (MCP) Integration
CRIMVEXA exposes an actual MCP-compatible tool schema:
- `search_similar_cases(query: string, category?: string, limit?: number)`: Computes TF-IDF similarity across synthetic case records.
- `find_nearby_cameras(locationQuery: string)`: Matches incident locations against municipal CCTV coverage registries.

---

## 6. Commands to Run & Test
```bash
# 1. Install dependencies
npm install

# 2. Configure server-only API keys
# Copy .env.example to .env and set OPENAI_API_KEY (and GEMINI_API_KEY if using Gemini features).
# OPENAI_TRANSCRIPTION_MODEL defaults to gpt-transcribe and can be changed if needed.
# Never put API keys in frontend variables or commit the .env file.

# 3. Run the development server (runs full-stack Express + Vite on port 3000)
npm run dev

# 4. Run the automated integration test suite (requires the dev server)
npm test

# 5. Run the audio upload-to-transcript integration test with a local OpenAI-compatible test stub
npm run test:transcription

# 6. Build for production
npm run build
```

The complaint form's **Record & Transcribe** button requests microphone access, records in a browser-supported format, and uploads the recording to the backend. The server enforces a 20 MB limit, sends it to the OpenAI Audio Transcriptions API with the selected language, and discards the in-memory audio after the request. The transcript is inserted into the editable complaint statement; citizens should review it before submitting. Transcription does not translate the statement.

---

## 7. 3-Minute Hackathon Demo Script
- **0:00–0:25 (Introduction)**: Open landing page. Point out the dark-navy cyber aesthetic, live 14ms latency indicator, and prominent "Synthetic Data Only / Hackathon Demo" banner.
- **0:25–1:00 (Citizen Voice Intake)**: Click "Quick Demo: WhatsApp UPI QR Code Fraud". Show the live audio recording visualizer, the automatic completeness check by the Interviewer Agent, and the uploaded digital evidence with its real cryptographic SHA-256 checksum.
- **1:00–1:30 (Submission & AI Triage)**: Click "Submit Complaint". Show the server-generated Case ID (`CVX-2026-XXXX`), the instant classification as *UPI / Financial Fraud* (96% conf.), the *HIGH* priority score with transparent reasons, and the matched duplicate case.
- **1:30–2:00 (Mock Police Portal Filing)**: Check the citizen consent box and click "Submit to Local Mock Police Portal". Show the generated electronic FIR receipt (`MOCK-FIR-2026-XXXX`).
- **2:00–2:30 (Police Officer Triage & Briefing)**: Switch persona to *Police Officer*. Show the case appears immediately in the live triage queue. Click "Investigate", update status to `UNDER_REVIEW`, log an investigation note, and click "Generate Briefing" to display the 4-part executive officer summary.
- **2:30–3:00 (MCP Tools & Forensic Lab)**: Switch to *Evidence Lab* to demonstrate live SHA-256 hash recalculation, and *Agents & MCP* tab to show real-time MCP tool invocation of `search_similar_cases` and `find_nearby_cameras`.

---

## 8. Implementation Status Checklist
- [x] **Citizen Voice & Text Incident Reporting**: Fully Implemented (Web Speech API + fallback audio wave simulation + text input).
- [x] **AI Interviewer Follow-Up Agent**: Fully Implemented (detects missing fields, generates prompts).
- [x] **Cryptographic SHA-256 Evidence Hashing**: Fully Implemented (Web Crypto API + Node.js crypto, verification badge).
- [x] **Fast System 1 Category Classifier**: Fully Implemented (7 crime categories, confidence score, rationale).
- [x] **Transparent Urgency Priority Scorer**: Fully Implemented (0–100 score, explicit reasons, safety disclosure).
- [x] **TF-IDF & Cosine Similarity Duplicate Detection**: Fully Implemented (vector similarity, matching keywords).
- [x] **Local Mock Police Portal Automated Filing**: Fully Implemented (consent validation, mock FIR receipt generation).
- [x] **Police Officer Triage Dashboard**: Fully Implemented (live counts, status transitions, notes, assignments).
- [x] **Executive Officer Briefing Generator**: Fully Implemented (structured 4-part summary).
- [x] **Cyber Crime 1930 Protocol Module**: Fully Implemented (UPI extraction, phishing domains, Golden Hour lien action).
- [x] **Digital Forensics Lab**: Fully Implemented (tamper detection, live SHA-256 recalculation).
- [x] **Model Context Protocol (MCP) Server**: Fully Implemented (MCP endpoints for case and camera search).
- [x] **Automated Test Suite**: Fully Implemented (`npm test` runs 12 comprehensive checks).
