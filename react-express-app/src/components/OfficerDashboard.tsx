import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  UserCheck,
  Camera,
  Hash,
  ExternalLink,
  Send,
  Sparkles,
  ChevronRight,
  X,
  Layers,
  Activity,
  ArrowUpDown,
  Building,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import {
  getComplaints,
  getComplaint,
  updateComplaintStatus,
  addInvestigationNote,
  assignOfficer,
  getOfficerDashboard,
  getBriefing,
  markCaseAsViewed,
  takeUpCase
} from '../services/api';
import { Complaint, ComplaintStatus, PriorityLevel, User } from '../types';

interface OfficerDashboardProps {
  currentUser: User;
  onOpenCaseTracking: (caseId: string) => void;
}

export const OfficerDashboard: React.FC<OfficerDashboardProps> = ({
  currentUser,
  onOpenCaseTracking
}) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [selectedCase, setSelectedCase] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Officer Action Form States
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('UNDER_REVIEW');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [noteText, setNoteText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);

  const [assigneeName, setAssigneeName] = useState(currentUser.name);
  const [assigneeDept, setAssigneeDept] = useState(currentUser.department || 'Central Police Station');
  const [isAssigning, setIsAssigning] = useState(false);

  // Briefing modal
  const [showBriefing, setShowBriefing] = useState(false);
  const [briefingData, setBriefingData] = useState<any>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);

  useEffect(() => {
    loadData();
  }, [filterStatus, filterPriority, filterCategory, searchQuery]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, complaintsRes] = await Promise.all([
        getOfficerDashboard(),
        getComplaints({
          status: filterStatus !== 'ALL' ? filterStatus : undefined,
          priority: filterPriority !== 'ALL' ? filterPriority : undefined,
          category: filterCategory !== 'ALL' ? filterCategory : undefined,
          search: searchQuery || undefined
        })
      ]);
      setDashboardStats(statsRes.counts);
      setComplaints(complaintsRes.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCase = async (id: string) => {
    try {
      const fullCase = await getComplaint(id);
      setSelectedCase(fullCase);
      setNewStatus(fullCase.status);
      if (!fullCase.isViewedByOfficer) {
        await markCaseAsViewed(id);
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTakeUpCase = async () => {
    if (!selectedCase) return;
    setIsAssigning(true);
    try {
      const res = await takeUpCase(selectedCase.id);
      setSelectedCase(res.complaint);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to take up case');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    setIsUpdatingStatus(true);
    try {
      const res = await updateComplaintStatus(selectedCase.id, newStatus, statusNote);
      setSelectedCase(res.complaint);
      setStatusNote('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !noteText.trim()) return;
    setIsAddingNote(true);
    try {
      await addInvestigationNote(selectedCase.id, noteText, isInternalNote);
      setNoteText('');
      const updated = await getComplaint(selectedCase.id);
      setSelectedCase(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to add note');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !assigneeName) return;
    setIsAssigning(true);
    try {
      const res = await assignOfficer(selectedCase.id, assigneeName, assigneeDept);
      setSelectedCase(res.complaint);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to assign officer');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleGenerateBriefing = async () => {
    if (!selectedCase) return;
    setLoadingBriefing(true);
    setShowBriefing(true);
    try {
      const res = await getBriefing(selectedCase.id);
      setBriefingData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBriefing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Officer Command Header */}
      <div className="border border-blue-900/40 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-950 to-blue-950/40 p-6 md:p-8 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800/40 text-blue-300 text-xs font-mono">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Law Enforcement Command Center</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-slate-100">
              Police Officer Triage & Investigation Workbench
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Real-time incident dispatch, multi-agent automated triage review, camera proximity surveillance leads, and formal status audits.
            </p>
          </div>

          <button
            onClick={loadData}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Feed</span>
          </button>
        </div>

        {/* Real KPI Stat Cards */}
        {dashboardStats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Total Cases</div>
              <div className="text-xl font-bold font-mono text-slate-100">{dashboardStats.total}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-900/40 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">New Intake</div>
              <div className="text-xl font-bold font-mono text-cyan-300">{dashboardStats.newCases}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-900/40 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400">Under Review</div>
              <div className="text-xl font-bold font-mono text-amber-300">{dashboardStats.underReview}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-rose-900/40 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-rose-400">High / Critical</div>
              <div className="text-xl font-bold font-mono text-rose-300">{dashboardStats.highPriority}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-900/40 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-400">Cyber Frauds</div>
              <div className="text-xl font-bold font-mono text-indigo-300">{dashboardStats.cyberCases}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-900/40 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">Resolved</div>
              <div className="text-xl font-bold font-mono text-emerald-300">{dashboardStats.resolved}</div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search case ID, title, citizen, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 placeholder:text-slate-500 outline-none focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-300 outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
            <option value="NEEDS_INFORMATION">NEEDS_INFORMATION</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-300 outline-none focus:border-blue-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div className="text-[11px] font-mono text-slate-500">
          Showing {complaints.length} cases
        </div>
      </div>

      {/* Case Table List */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Subject & Citizen</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Evidence</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {complaints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No cases match the selected filters.
                  </td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => handleSelectCase(c.id)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
                      <div>{c.id}</div>
                      <div className="mt-0.5">
                        {c.isViewedByOfficer ? (
                          <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800/40">
                            VIEWED
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono text-amber-400 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-800/40 animate-pulse">
                            UNVIEWED
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-200 truncate">{c.title}</div>
                      <div className="text-[10px] text-slate-400 truncate">{c.citizenName} • {c.incidentLocation}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 font-mono text-[10px] border border-slate-800">
                        {c.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.priorityLevel === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border border-rose-800/40' :
                        c.priorityLevel === 'HIGH' ? 'bg-amber-950 text-amber-400 border border-amber-800/40' :
                        c.priorityLevel === 'MEDIUM' ? 'bg-blue-950 text-blue-400 border border-blue-800/40' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {c.priorityLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        c.status === 'SUBMITTED' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/40' :
                        c.status === 'UNDER_REVIEW' ? 'bg-amber-950 text-amber-400 border border-amber-800/40' :
                        c.status === 'NEEDS_INFORMATION' ? 'bg-purple-950 text-purple-400 border border-purple-800/40' :
                        c.status === 'RESOLVED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {c.evidence.length} file(s)
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                      {c.incidentDate}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCase(c.id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-semibold text-[11px] transition-colors border border-blue-600/30"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Investigation Drawer / Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-slate-900 border border-blue-900/50 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl font-bold text-cyan-400">{selectedCase.id}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                    selectedCase.priorityLevel === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                    selectedCase.priorityLevel === 'HIGH' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                    'bg-blue-950 text-blue-400 border border-blue-800'
                  }`}>
                    {selectedCase.priorityLevel} Priority
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 font-mono text-[10px]">
                    {selectedCase.category}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-100">{selectedCase.title}</h2>
                <div className="text-xs text-slate-400">
                  Citizen: <span className="text-slate-200">{selectedCase.citizenName}</span> ({selectedCase.citizenContact}) • Location: <span className="text-slate-200">{selectedCase.incidentLocation}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!selectedCase.caseOfferAccepted ? (
                  <button
                    type="button"
                    onClick={handleTakeUpCase}
                    disabled={isAssigning}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-bold text-xs shadow-md shadow-blue-900/50 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{isAssigning ? 'Accepting...' : 'Take Up Case (Accept Investigation)'}</span>
                  </button>
                ) : (
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Assigned to {selectedCase.assignedOfficerDetails?.name || selectedCase.assignedOfficer}</span>
                  </span>
                )}

                <button
                  onClick={handleGenerateBriefing}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-medium text-xs transition-colors border border-purple-500/40 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Executive Briefing</span>
                </button>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* AI Multi-Agent Triage Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category & Priority Analysis */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>System 1 Automated Classification</span>
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">HUMAN REVIEW REQUIRED</span>
                </div>
                <div className="text-slate-200">
                  Category: <span className="font-semibold text-cyan-400">{selectedCase.category}</span>
                </div>
                {selectedCase.analysis && (
                  <>
                    <div className="text-slate-400 text-[11px]">
                      {selectedCase.analysis.category.explanation}
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] space-y-1">
                      <span className="text-slate-400 font-medium">Priority Score Reasons:</span>
                      <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                        {selectedCase.analysis.priority.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>

              {/* Case Linking & Proximity Cameras */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-purple-400" />
                  <span>MCP Case Linking & Camera Registry Leads</span>
                </span>

                {selectedCase.analysis?.duplicateMatches && selectedCase.analysis.duplicateMatches.length > 0 ? (
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400">Potential duplicate/pattern matches:</span>
                    {selectedCase.analysis.duplicateMatches.map(m => (
                      <div key={m.caseId} className="p-1.5 rounded bg-slate-900 border border-slate-800 text-[11px] flex justify-between">
                        <span className="text-slate-300 truncate">{m.caseId}: {m.title}</span>
                        <span className="font-mono text-purple-400 shrink-0 ml-2">{m.similarityScore}% match</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500">No high-confidence duplicate complaints found.</div>
                )}

                {selectedCase.analysis?.cameraMatches && selectedCase.analysis.cameraMatches.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Camera className="w-3 h-3 text-cyan-400" /> Nearby CCTV coverage:
                    </span>
                    {selectedCase.analysis.cameraMatches.map(cam => (
                      <div key={cam.cameraId} className="p-1.5 rounded bg-slate-900 border border-slate-800 text-[11px]">
                        <div className="font-semibold text-cyan-300">{cam.cameraId} • {cam.location}</div>
                        <div className="text-[10px] text-slate-400">{cam.coverageNote}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Incident Statement */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300">Original Citizen Statement:</span>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {selectedCase.description}
              </div>
            </div>

            {/* Evidence List with SHA-256 */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300">
                Secured Digital Evidence ({selectedCase.evidence.length} items):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedCase.evidence.map(ev => (
                  <div key={ev.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-200 font-medium">
                      <span className="truncate">{ev.originalName}</span>
                      <span className="text-[10px] text-emerald-400 font-mono">SHA-256 VALID</span>
                    </div>
                    <div className="text-[10px] font-mono text-cyan-400 break-all">{ev.sha256}</div>
                    {ev.extractedText && (
                      <div className="text-[10px] text-slate-400 italic">"{ev.extractedText}"</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Officer Action Form: Status Update */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-xs font-semibold text-slate-200">Update Case Investigation Status</div>
              <form onSubmit={handleUpdateStatus} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Target Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-blue-500"
                  >
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                    <option value="NEEDS_INFORMATION">NEEDS_INFORMATION</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-1">Status Transition Reason / Audit Note</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dispatched forensic team to analyze transaction ledger..."
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={isUpdatingStatus}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer"
                    >
                      {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Add Investigation Note */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-xs font-semibold text-slate-200">Add Officer Investigation Remark</div>
              <form onSubmit={handleAddNote} className="space-y-3">
                <textarea
                  rows={2}
                  required
                  placeholder="Enter investigative finding, surveillance link, or contact log..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-blue-500"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-blue-500"
                    />
                    <span>Internal confidential note (Hidden from citizen portal)</span>
                  </label>
                  <button
                    type="submit"
                    disabled={isAddingNote}
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    {isAddingNote ? 'Saving...' : 'Add Note'}
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Notes Log */}
            {selectedCase.investigationNotes.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Case Investigation Log:</span>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedCase.investigationNotes.map((n) => (
                    <div key={n.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span className="font-semibold text-cyan-400">
                          {n.author} ({n.authorRole})
                          {n.isInternalOnly && <span className="ml-2 text-amber-400 font-mono">[INTERNAL]</span>}
                        </span>
                        <span className="font-mono text-[10px]">{new Date(n.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="text-slate-200">{n.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Structured Briefing Agent Modal */}
      {showBriefing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="max-w-2xl w-full bg-slate-900 border border-purple-800/60 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-slate-100">
                  CRIMVEXA Officer Executive Briefing
                </h3>
              </div>
              <button
                onClick={() => setShowBriefing(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingBriefing ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div>Briefing Agent synthesizing verified facts, unknowns, and recommendations...</div>
              </div>
            ) : briefingData ? (
              <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[11px] font-mono">
                    1. Verified Citizen Facts
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {briefingData.briefing.reportedFacts.map((fact: string, idx: number) => (
                      <li key={idx}>{fact}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="font-semibold text-amber-400 uppercase tracking-wider text-[11px] font-mono">
                    2. Unknowns & Critical Missing Details
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {briefingData.briefing.unknowns.length > 0 ? (
                      briefingData.briefing.unknowns.map((u: string, idx: number) => (
                        <li key={idx}>{u}</li>
                      ))
                    ) : (
                      <li>No critical parameters missing. Complaint statement is complete.</li>
                    )}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="font-semibold text-purple-400 uppercase tracking-wider text-[11px] font-mono">
                    3. AI Automated Suggestions (Human Review Required)
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {briefingData.briefing.aiSuggestions.map((sug: string, idx: number) => (
                      <li key={idx}>{sug}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-blue-800/40 space-y-1.5">
                  <span className="font-semibold text-cyan-400 uppercase tracking-wider text-[11px] font-mono">
                    4. Immediate Investigative Next Steps
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {briefingData.briefing.recommendedNextSteps.map((step: string, idx: number) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Print Officer Briefing</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
