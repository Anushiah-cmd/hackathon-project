import React, { useState, useEffect } from 'react';
import {
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Copy,
  Check,
  Upload,
  ExternalLink,
  ChevronRight,
  Hash,
  ArrowRight,
  Calendar,
  MapPin,
  ShieldAlert
} from 'lucide-react';
import { getComplaint, getComplaints, uploadEvidence, submitOfficialFIR } from '../services/api';
import { Complaint, ComplaintStatus, EvidenceItem } from '../types';

interface CaseTrackingProps {
  initialCaseId?: string | null;
  onNavigateToOfficer?: (caseId: string) => void;
}

export const CaseTracking: React.FC<CaseTrackingProps> = ({
  initialCaseId,
  onNavigateToOfficer
}) => {
  const [searchId, setSearchId] = useState(initialCaseId || '');
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [recentCases, setRecentCases] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // New evidence upload inside tracking
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadText, setUploadText] = useState('');

  // Mock portal state
  const [filingMock, setFilingMock] = useState(false);

  useEffect(() => {
    loadRecentCases();
  }, []);

  useEffect(() => {
    if (initialCaseId) {
      setSearchId(initialCaseId);
      fetchCase(initialCaseId);
    }
  }, [initialCaseId]);

  const loadRecentCases = async () => {
    try {
      const res = await getComplaints();
      setRecentCases(res.items.slice(0, 5));
      if (!initialCaseId && res.items.length > 0) {
        setComplaint(res.items[0]);
        setSearchId(res.items[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCase = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getComplaint(id.trim());
      setComplaint(data);
    } catch (err: any) {
      setError(err.message || `Case ${id} not found.`);
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !uploadFileName) return;

    try {
      await uploadEvidence(complaint.id, {
        originalName: uploadFileName,
        fileType: 'application/pdf',
        sizeBytes: 184000,
        extractedText: uploadText || 'Supplementary citizen record'
      });
      setShowUploadModal(false);
      setUploadFileName('');
      setUploadText('');
      fetchCase(complaint.id);
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    }
  };

  const handleOfficialFIRSubmit = async () => {
    if (!complaint) return;
    setFilingMock(true);
    try {
      await submitOfficialFIR(complaint.id, true);
      await fetchCase(complaint.id);
    } catch (err: any) {
      alert(err.message || 'FIR transmission failed');
    } finally {
      setFilingMock(false);
    }
  };

  const statusSteps: ComplaintStatus[] = [
    'SUBMITTED',
    'UNDER_REVIEW',
    'NEEDS_INFORMATION',
    'RESOLVED'
  ];

  const getStatusIndex = (currentStatus: ComplaintStatus) => {
    if (currentStatus === 'DRAFT') return 0;
    if (currentStatus === 'SUBMITTED') return 0;
    if (currentStatus === 'UNDER_REVIEW') return 1;
    if (currentStatus === 'NEEDS_INFORMATION') return 2;
    if (currentStatus === 'RESOLVED' || currentStatus === 'CLOSED') return 3;
    return 1;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header & Search Bar */}
      <div className="border border-cyan-900/40 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-950 to-blue-950/40 p-6 md:p-8 backdrop-blur-xl">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/40 text-cyan-300 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Citizen Tracking & Investigation Status</span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-slate-100">
            Real-Time Case Tracking
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Verify investigation milestones, digital evidence SHA-256 integrity, police officer notes, and e-filing receipts.
          </p>

          {/* Search Box */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter Case ID (e.g. CVX-2026-1042)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCase(searchId)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <button
              onClick={() => fetchCase(searchId)}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Searching...' : 'Track Case'}
            </button>
          </div>

          {/* Quick Case Pills */}
          {recentCases.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500 font-mono mr-1">Recent:</span>
              {recentCases.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSearchId(c.id);
                    fetchCase(c.id);
                  }}
                  className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                    complaint?.id === c.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {c.id}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-600/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Case Details Card */}
      {complaint && (
        <div className="space-y-6">
          {/* Top Status & Case Header */}
          <div className="border border-slate-800 rounded-2xl bg-slate-900/60 p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl font-bold text-cyan-400">{complaint.id}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    complaint.priorityLevel === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border border-rose-800/40' :
                    complaint.priorityLevel === 'HIGH' ? 'bg-amber-950 text-amber-400 border border-amber-800/40' :
                    complaint.priorityLevel === 'MEDIUM' ? 'bg-blue-950 text-blue-400 border border-blue-800/40' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {complaint.priorityLevel} Priority
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {complaint.category}
                  </span>
                </div>
                <h2 className="text-base md:text-lg font-semibold text-slate-100">
                  {complaint.title}
                </h2>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Current Status</div>
                  <div className="text-sm font-bold text-amber-400 flex items-center gap-1.5 justify-end">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    {complaint.status}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Timeline Progress */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-300">Case Investigation Progress</div>
              <div className="grid grid-cols-4 gap-2">
                {statusSteps.map((step, idx) => {
                  const currentIdx = getStatusIndex(complaint.status);
                  const isDone = currentIdx >= idx;
                  const isCurrent = currentIdx === idx;

                  return (
                    <div
                      key={step}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isCurrent
                          ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300 shadow-lg shadow-cyan-950/50'
                          : isDone
                          ? 'bg-slate-950/60 border-slate-700 text-slate-300'
                          : 'bg-slate-950/20 border-slate-800/50 text-slate-600'
                      }`}
                    >
                      <div className="text-[10px] font-mono text-slate-500 mb-1">Step {idx + 1}</div>
                      <div className="text-xs font-bold truncate">{step.replace('_', ' ')}</div>
                      <div className="mt-1 flex justify-center">
                        {isDone ? (
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isCurrent ? 'text-cyan-400' : 'text-emerald-400'}`} />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-700"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Official FIR Status Banner if filed */}
            {complaint.officialFIRFiling ? (
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-slate-950 border border-blue-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>State Police Electronic FIR Registry</span>
                  </div>
                  <div className="font-semibold text-slate-100 flex items-center gap-2">
                    Official FIR Number: <span className="font-mono text-emerald-400">{complaint.officialFIRFiling.filingReceiptId}</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Registered at: {complaint.officialFIRFiling.jurisdictionStation}
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-600/40 text-emerald-300 self-start sm:self-auto font-bold">
                  OFFICIAL RECORD
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="text-slate-400">
                  Electronic FIR transmission pending citizen verification.
                </div>
                <button
                  onClick={handleOfficialFIRSubmit}
                  disabled={filingMock}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{filingMock ? 'Registering...' : 'Transmit Electronic FIR'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Incident Details & Assigned Investigator */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 cols: Incident Narrative */}
            <div className="md:col-span-2 border border-slate-800 rounded-2xl bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Recorded Incident Statement</span>
              </h3>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {complaint.description}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Occurrence Date & Time</span>
                  </div>
                  <div className="font-semibold text-slate-200">
                    {complaint.incidentDate} at {complaint.incidentTime}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <div className="text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>Reported Location</span>
                  </div>
                  <div className="font-semibold text-slate-200 truncate">
                    {complaint.incidentLocation}
                  </div>
                </div>

                {complaint.lossAmount && (
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <div className="text-slate-500">Claimed Loss / Value</div>
                    <div className="font-semibold text-amber-300 font-mono">
                      {complaint.lossAmount}
                    </div>
                  </div>
                )}

                {complaint.suspectDetails && (
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <div className="text-slate-500">Suspect / Platform Details</div>
                    <div className="font-semibold text-slate-200 truncate">
                      {complaint.suspectDetails}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right col: Assigned Officer & Status History */}
            <div className="border border-slate-800 rounded-2xl bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Investigative Authority & Review</span>
                </span>
                {complaint.isViewedByOfficer ? (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-600/40 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Viewed by Officer</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-600/40 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                    <Clock className="w-3 h-3 animate-spin" />
                    <span>Pending IO Review</span>
                  </span>
                )}
              </h3>

              {/* Case Viewed or Not Alert Banner */}
              {complaint.isViewedByOfficer ? (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs space-y-1">
                  <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">
                    Case File Acknowledged
                  </div>
                  <div className="text-emerald-200 font-medium text-[11px]">
                    Reviewed by: <span className="font-bold text-white">{complaint.viewedByOfficerName || 'Duty Investigating Officer'}</span>
                  </div>
                  {complaint.viewedAt && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      Timestamp: {new Date(complaint.viewedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs space-y-1">
                  <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold">
                    Case In Duty Queue
                  </div>
                  <div className="text-amber-200 text-[11px]">
                    This complaint has been securely timestamped and is currently awaiting assignment to a duty officer.
                  </div>
                </div>
              )}

              {/* Investigating Officer (Case Taken Offer) Card */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Investigation Status</span>
                  {complaint.caseOfferAccepted ? (
                    <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/40">
                      CASE TAKEN BY IO
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                      QUEUED
                    </span>
                  )}
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Assigned Officer (IO)</div>
                  <div className="font-bold text-slate-100 text-sm mt-0.5 flex items-center gap-2">
                    <span>{complaint.assignedOfficerDetails?.name || complaint.assignedOfficer || 'Awaiting Officer Take-Up'}</span>
                  </div>
                  {complaint.assignedOfficerDetails?.badge && (
                    <div className="text-[10px] font-mono text-cyan-400 mt-0.5">
                      Badge: {complaint.assignedOfficerDetails.badge}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono">Police Wing / Station</div>
                  <div className="text-slate-300 mt-0.5 font-medium">
                    {complaint.assignedOfficerDetails?.station || complaint.assignedDepartment || 'State Police Central Command'}
                  </div>
                  {complaint.assignedOfficerDetails?.contact && (
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      Official Contact: {complaint.assignedOfficerDetails.contact}
                    </div>
                  )}
                </div>
              </div>

              {/* Status History Audit */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Status History Audit</span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {complaint.statusHistory.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="font-semibold text-cyan-400">{item.newStatus}</span>
                        <span className="font-mono text-[10px]">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-slate-300">{item.note}</div>
                      <div className="text-[10px] text-slate-500 italic">By: {item.actor} ({item.actorRole})</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Evidence Vault Section */}
          <div className="border border-slate-800 rounded-2xl bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Digital Evidence Chain of Custody ({complaint.evidence.length} files)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Each evidence item is secured by an immutable SHA-256 cryptographic checksum.
                </p>
              </div>

              <button
                onClick={() => setShowUploadModal(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-cyan-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload More Evidence</span>
              </button>
            </div>

            {complaint.evidence.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-950 text-center text-xs text-slate-500">
                No digital evidence files attached to this case.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {complaint.evidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="font-semibold text-slate-200 truncate">{ev.originalName}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {(ev.sizeBytes / 1024).toFixed(1)} KB
                      </span>
                    </div>

                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono space-y-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>SHA-256 Checksum:</span>
                        <button
                          onClick={() => handleCopyHash(ev.sha256)}
                          className="hover:text-cyan-400 transition-colors flex items-center gap-1"
                          title="Copy hash"
                        >
                          {copiedHash === ev.sha256 ? (
                            <span className="text-emerald-400 flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Copied
                            </span>
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div className="text-cyan-300 break-all">{ev.sha256}</div>
                    </div>

                    {ev.extractedText && (
                      <div className="text-[11px] text-slate-400 bg-slate-900/50 p-2 rounded border border-slate-800/60">
                        <span className="text-slate-500 font-semibold">Extracted Metadata/OCR:</span> "{ev.extractedText}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Investigation Notes (Citizen-Visible) */}
          <div className="border border-slate-800 rounded-2xl bg-slate-900/60 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Official Officer Notices & Updates</span>
            </h3>

            {complaint.investigationNotes.filter(n => !n.isInternalOnly).length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950 text-xs text-slate-500 text-center">
                No public officer remarks logged yet. Case is currently in investigative queue.
              </div>
            ) : (
              <div className="space-y-2">
                {complaint.investigationNotes.filter(n => !n.isInternalOnly).map((n) => (
                  <div key={n.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span className="font-semibold text-blue-400">{n.author} ({n.authorRole})</span>
                      <span className="font-mono text-[10px]">
                        {new Date(n.timestamp).toLocaleDateString()} {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-slate-200">{n.note}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Supplemental Evidence Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Attach Supplementary Evidence</span>
            </h3>

            <form onSubmit={handleAddEvidence} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Document / Screenshot Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bank Account Statement Oct 2026.pdf"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Extracted Context / Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Shows unauthorized transaction reference #49104812"
                  value={uploadText}
                  onChange={(e) => setUploadText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors"
                >
                  Upload & Hash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
