import {
  Complaint,
  ComplaintStatus,
  EvidenceItem,
  User,
  UserRole,
  AuditLog,
  AIAnalysisResult,
  OfficialFIRReceipt,
  LanguageCode
} from '../types';

const API_BASE = '/api';

export async function transcribeAudio(audio: Blob, language: LanguageCode): Promise<{ text: string }> {
  const formData = new FormData();
  formData.append('audio', audio, 'recording');
  formData.append('language', language);

  const res = await fetch(`${API_BASE}/audio/transcriptions`, {
    method: 'POST',
    body: formData
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (result.error?.code === 'TRANSCRIPTION_NOT_CONFIGURED') {
      throw new Error('Voice transcription is temporarily unavailable. You can type your statement instead; please contact the site administrator to enable voice transcription.');
    }
    throw new Error(result.error?.message || 'Audio transcription failed. Please try again.');
  }
  if (typeof result.text !== 'string' || !result.text.trim()) {
    throw new Error('The transcription service returned an empty transcript. Please try again.');
  }
  return { text: result.text.trim() };
}

export async function getHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function getCurrentUser(): Promise<{ user: User }> {
  const res = await fetch(`${API_BASE}/auth/me`);
  return res.json();
}

export async function switchRole(role: UserRole): Promise<{ user: User }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role })
  });
  if (!res.ok) throw new Error('Failed to switch role');
  return res.json();
}

export async function loginWithEmail(email: string): Promise<{ user: User }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Login failed');
  }
  return res.json();
}

export async function registerUser(userData: Partial<User>): Promise<{ user: User }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Registration failed');
  }
  return res.json();
}

export async function getComplaints(params: {
  status?: string;
  category?: string;
  priority?: string;
  search?: string;
} = {}): Promise<{ items: Complaint[]; total: number }> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.category) query.set('category', params.category);
  if (params.priority) query.set('priority', params.priority);
  if (params.search) query.set('search', params.search);

  const res = await fetch(`${API_BASE}/complaints?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch complaints');
  return res.json();
}

export async function getComplaint(id: string): Promise<Complaint> {
  const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Case ${id} not found`);
  return res.json();
}

export async function createComplaint(payload: {
  title: string;
  description: string;
  originalLanguage?: LanguageCode;
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string;
  city?: string;
  lossAmount?: string;
  suspectDetails?: string;
  witnessDetails?: string;
  cameraAvailable?: boolean;
  evidenceItems?: any[];
}): Promise<{ id: string; complaint: Complaint; analysis: AIAnalysisResult }> {
  const res = await fetch(`${API_BASE}/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to register incident');
  }
  return res.json();
}

export async function updateComplaintStatus(
  id: string,
  newStatus: ComplaintStatus,
  note?: string
): Promise<{ success: boolean; complaint: Complaint }> {
  const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newStatus, note })
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
}

export async function addInvestigationNote(
  id: string,
  note: string,
  isInternalOnly: boolean = false
): Promise<{ success: boolean; note: any }> {
  const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note, isInternalOnly })
  });
  if (!res.ok) throw new Error('Failed to add note');
  return res.json();
}

export async function assignOfficer(
  id: string,
  officerName: string,
  department?: string
): Promise<{ success: boolean; complaint: Complaint }> {
  const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note: `Assigned to ${officerName} (${department})` })
  });
  return res.json();
}

export async function uploadEvidence(
  id: string,
  fileData: {
    originalName: string;
    fileType: string;
    sizeBytes: number;
    base64Data?: string;
    extractedText?: string;
  }
) {
  const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note: `Supplementary evidence attached: ${fileData.originalName}` })
  });
  return res.json();
}

export async function refreshDatabaseLedger() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function verifyEvidenceHash(
  evidenceId: string,
  originalHash: string,
  currentContent?: string
) {
  const res = await fetch(`${API_BASE}/evidence/verify-hash`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ evidenceId, originalHash, currentContent })
  });
  return res.json();
}

export async function submitOfficialFIR(
  complaintId: string,
  userConfirmedConsent: boolean
): Promise<{ success: boolean; receipt: OfficialFIRReceipt; complaint: Complaint }> {
  const res = await fetch(`${API_BASE}/fir/file-portal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ complaintId, userConfirmedConsent })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'FIR transmission failed');
  }
  return res.json();
}

export async function getBriefing(id: string) {
  const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}/briefing`);
  return res.json();
}

export async function mcpSearchCases(query: string, category?: string) {
  const res = await fetch(`${API_BASE}/mcp/search-cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, category })
  });
  return res.json();
}

export async function mcpFindCameras(locationQuery: string) {
  const res = await fetch(`${API_BASE}/mcp/find-cameras`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ locationQuery })
  });
  return res.json();
}

export async function getOfficerDashboard() {
  const res = await fetch(`${API_BASE}/officer/dashboard`);
  return res.json();
}

export async function getAuditLogs(): Promise<{ logs: AuditLog[] }> {
  const res = await fetch(`${API_BASE}/system/audit-logs`);
  return res.json();
}

export async function formalizeStatement(rawText: string, language?: LanguageCode): Promise<{
  formalStatement: string;
  extractedFacts: string[];
  recommendedCategory: string;
}> {
  const res = await fetch(`${API_BASE}/ai/formalize-statement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawText, language })
  });
  if (!res.ok) throw new Error('Formalization failed');
  return res.json();
}

export async function markCaseAsViewed(id: string): Promise<{ success: boolean; complaint: Complaint }> {
  const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
}

export async function takeUpCase(id: string): Promise<{ success: boolean; complaint: Complaint }> {
  const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}/take-case`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to take up case');
  return res.json();
}

export async function getMcpManifest() {
  const res = await fetch(`${API_BASE}/mcp/manifest`);
  return res.json();
}

export async function executeMcpTool(tool: string, args: Record<string, any>) {
  const res = await fetch(`${API_BASE}/mcp/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, arguments: args })
  });
  return res.json();
}

export async function runAgenticBrowserLookup(query: string) {
  const res = await fetch(`${API_BASE}/investigation/agentic-browser-lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  return res.json();
}
