export type UserRole =
  | 'citizen'
  | 'police_officer'
  | 'cyber_officer'
  | 'forensic_expert'
  | 'admin';

export type LanguageCode = 'en' | 'ta' | 'ml' | 'hi';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  badgeNumber?: string;
  department?: string;
  phone?: string;
}

export type ComplaintStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'NEEDS_INFORMATION'
  | 'RESOLVED'
  | 'CLOSED';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface EvidenceItem {
  id: string;
  complaintId: string;
  originalName: string;
  fileType: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  uploadedAt: string;
  extractedText?: string;
  metadata?: {
    device?: string;
    locationHint?: string;
    timestamp?: string;
    integrityVerified: boolean;
  };
  fileUrl?: string;
}

export interface StatusHistoryEntry {
  id: string;
  oldStatus?: ComplaintStatus;
  newStatus: ComplaintStatus;
  actor: string;
  actorRole: UserRole;
  note: string;
  timestamp: string;
}

export interface InvestigationNote {
  id: string;
  author: string;
  authorRole: UserRole;
  note: string;
  timestamp: string;
  isInternalOnly: boolean;
}

export interface AgentRunLog {
  agentName: 'interviewer' | 'classifier' | 'priority_scorer' | 'case_linking' | 'evidence_analyzer' | 'briefing' | 'filing' | 'multilingual_transcriber';
  status: 'completed' | 'partial' | 'failed';
  latencyMs: number;
  timestamp: string;
  summary: string;
  details?: Record<string, any>;
}

export interface DuplicateCaseMatch {
  caseId: string;
  title: string;
  similarityScore: number; // 0 to 100
  matchingKeywords: string[];
  reasons: string[];
  status: ComplaintStatus;
}

export interface CameraRegistryMatch {
  cameraId: string;
  location: string;
  distanceMeters: number;
  status: 'ACTIVE' | 'OFFLINE';
  coverageNote: string;
  contactDepartment: string;
}

export interface AIAnalysisResult {
  category: {
    label: string;
    code: string;
    confidence: number;
    keywords: string[];
    explanation: string;
  };
  priority: {
    level: PriorityLevel;
    score: number; // 0 to 100
    reasons: string[];
    limitations: string;
  };
  missingDetails: {
    field: string;
    question: string;
    urgency: 'high' | 'medium' | 'low';
  }[];
  duplicateMatches: DuplicateCaseMatch[];
  cameraMatches: CameraRegistryMatch[];
  entitiesExtracted: {
    upiIds?: string[];
    phoneNumbers?: string[];
    urls?: string[];
    amounts?: string[];
    dates?: string[];
    locations?: string[];
    suspectDescriptions?: string[];
  };
  executiveBriefing: {
    reportedFacts: string[];
    unknowns: string[];
    aiSuggestions: string[];
    recommendedNextSteps: string[];
  };
  languageDetails?: {
    originalLanguage: LanguageCode;
    translatedEnglishText?: string;
    detectedPhrases?: string[];
  };
  humanReviewRequired: boolean;
  agentLogs: AgentRunLog[];
  analyzedAt: string;
}

export interface OfficialFIRReceipt {
  portalName: string;
  filingReceiptId: string;
  filingTimestamp: string;
  status: 'OFFICIALLY_REGISTERED' | 'PENDING' | 'REJECTED';
  jurisdictionStation: string;
  verificationHash: string;
}

export interface Complaint {
  id: string; // e.g. "CVX-2026-1042"
  title: string;
  description: string;
  originalLanguage?: LanguageCode;
  translatedDescription?: string;
  citizenName: string;
  citizenContact: string;
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string;
  city?: string;
  lossAmount?: string;
  suspectDetails?: string;
  witnessDetails?: string;
  cameraAvailable?: boolean;
  status: ComplaintStatus;
  category: string;
  priorityLevel: PriorityLevel;
  evidence: EvidenceItem[];
  statusHistory: StatusHistoryEntry[];
  investigationNotes: InvestigationNote[];
  assignedOfficer?: string;
  assignedDepartment?: string;
  isViewedByOfficer?: boolean;
  viewedAt?: string;
  viewedByOfficerName?: string;
  caseOfferAccepted?: boolean;
  assignedOfficerDetails?: {
    name: string;
    badge: string;
    station: string;
    contact: string;
    acceptedAt: string;
  };
  systemOneDecision?: {
    jevReflex: string;
    latencyMs: number;
    urgencyLevel: string;
    confidence: number;
  };
  analysis?: AIAnalysisResult;
  officialFIRFiling?: OfficialFIRReceipt;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  actorRole: string;
  targetId?: string;
  timestamp: string;
  details: string;
  severity: 'INFO' | 'WARNING' | 'ALERT';
}
