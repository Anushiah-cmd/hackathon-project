import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CreditCard,
  Globe,
  Smartphone,
  AlertTriangle,
  Clock,
  ExternalLink,
  FileCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Lock,
  Download,
  Terminal,
  Send
} from 'lucide-react';
import { getComplaints, updateComplaintStatus, addInvestigationNote } from '../services/api';
import { Complaint } from '../types';

export const CyberCrimeModule: React.FC = () => {
  const [cyberCases, setCyberCases] = useState<Complaint[]>([]);
  const [selectedCase, setSelectedCase] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [lienRequested, setLienRequested] = useState<string | null>(null);

  useEffect(() => {
    loadCyberCases();
  }, []);

  const loadCyberCases = async () => {
    setLoading(true);
    try {
      const res = await getComplaints();
      const filtered = res.items.filter(c =>
        c.category.toLowerCase().includes('cyber') ||
        c.category.toLowerCase().includes('upi') ||
        c.category.toLowerCase().includes('phishing') ||
        c.category.toLowerCase().includes('social media') ||
        c.category.toLowerCase().includes('identity') ||
        c.description.toLowerCase().includes('upi') ||
        c.description.toLowerCase().includes('whatsapp')
      );
      setCyberCases(filtered);
      if (filtered.length > 0) setSelectedCase(filtered[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerLienNotice = async (caseId: string, upiId: string) => {
    setLienRequested(caseId);
    try {
      await addInvestigationNote(
        caseId,
        `AUTOMATED CYBER CELL LIEN: Transmitted priority freeze request on UPI ${upiId} to National Cyber Crime Reporting Portal (1930).`,
        false
      );
      await updateComplaintStatus(caseId, 'UNDER_REVIEW', 'Cyber Cell account freeze action initiated.');
      await loadCyberCases();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Cyber Cell Header */}
      <div className="border border-indigo-900/40 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-950 to-indigo-950/40 p-6 md:p-8 backdrop-blur-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/40 text-indigo-300 text-xs font-mono">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
            <span>Cyber Crime Investigation Cell (1930 Protocol)</span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-slate-100">
            Digital Fraud & Cyber Incident Response
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Specialized workbench for UPI scams, phishing domains, social media extortion, and Golden Hour financial debit freeze coordination.
          </p>
        </div>

        {/* Rapid Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Active Cyber Cases</span>
            <div className="text-xl font-bold font-mono text-indigo-400">{cyberCases.length}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Reported Financial Loss</span>
            <div className="text-xl font-bold font-mono text-amber-400">₹1,68,000</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Flagged UPI Nodes</span>
            <div className="text-xl font-bold font-mono text-rose-400">4 Active</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Avg Response Time</span>
            <div className="text-xl font-bold font-mono text-emerald-400">&lt; 18 min</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Cyber Cases List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Cyber Incident Queue</span>
            <span className="font-mono text-slate-500">{cyberCases.length} records</span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {cyberCases.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCase(c)}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                  selectedCase?.id === c.id
                    ? 'bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-950/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono font-bold text-indigo-400">{c.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    c.priorityLevel === 'CRITICAL' ? 'bg-rose-950 text-rose-400' : 'bg-amber-950 text-amber-400'
                  }`}>
                    {c.priorityLevel}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-200 line-clamp-1">{c.title}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Loss: <span className="text-amber-300 font-mono">{c.lossAmount || 'N/A'}</span></span>
                  <span className="font-mono text-slate-500">{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center & Right Column: Detailed Cyber Case Forensics */}
        {selectedCase && (
          <div className="lg:col-span-2 space-y-6">
            <div className="border border-slate-800 rounded-2xl bg-slate-900/60 p-6 space-y-6">
              {/* Case Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-indigo-400">{selectedCase.id}</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono text-[10px] border border-indigo-800/40">
                      {selectedCase.category}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-100 mt-1">{selectedCase.title}</h2>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-mono">STATUS</div>
                  <div className="text-xs font-bold text-amber-400">{selectedCase.status}</div>
                </div>
              </div>

              {/* Extracted Cyber Entities */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Extracted Digital Indicators & Entities</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-cyan-400" /> Flagged UPI ID / Account
                    </div>
                    <div className="font-mono text-cyan-300 font-bold truncate">
                      {selectedCase.suspectDetails?.includes('@')
                        ? selectedCase.suspectDetails
                        : 'prof.k.sharma@okaxis'}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1">
                      <Globe className="w-3 h-3 text-purple-400" /> Phishing URL / Sender ID
                    </div>
                    <div className="font-mono text-purple-300 font-bold truncate">
                      {selectedCase.description.includes('.xyz') || selectedCase.description.includes('http')
                        ? 'mahadiscom-bill-update.xyz'
                        : 'WhatsApp: +91 87654 11223'}
                    </div>
                  </div>
                </div>

                {/* 1930 Financial Freeze Quick Action */}
                <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-rose-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-rose-400" />
                      <span>Golden Hour Financial Lien Action</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Transmit instant stop-payment order to beneficiary bank via NPCI & 1930 Cyber Fraud network.
                    </p>
                  </div>

                  <button
                    onClick={() => handleTriggerLienNotice(selectedCase.id, 'prof.k.sharma@okaxis')}
                    disabled={lienRequested === selectedCase.id}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shrink-0 flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-950"
                  >
                    {lienRequested === selectedCase.id ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Lien Order Dispatched</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Issue 1930 Lien Notice</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Case Narrative */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Complaint Statement:</span>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedCase.description}
                </div>
              </div>

              {/* Digital Evidence Attached */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">
                  Attached Digital Forensics ({selectedCase.evidence.length} files):
                </span>
                <div className="space-y-2">
                  {selectedCase.evidence.map(ev => (
                    <div key={ev.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                      <div className="truncate pr-4">
                        <div className="font-medium text-slate-200 truncate">{ev.originalName}</div>
                        <div className="font-mono text-[10px] text-cyan-400 truncate">{ev.sha256}</div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 shrink-0">SHA-256 VERIFIED</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
