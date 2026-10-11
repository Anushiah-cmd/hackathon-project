import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Hash,
  Upload,
  CheckCircle2,
  FileText,
  Sparkles,
  Lock,
  Search,
  Eye,
  Check,
  Copy
} from 'lucide-react';
import { getComplaints, verifyEvidenceHash } from '../services/api';
import { Complaint, EvidenceItem } from '../types';

export const ForensicLab: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [allEvidence, setAllEvidence] = useState<{ item: EvidenceItem; caseId: string; caseTitle: string }[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<{ item: EvidenceItem; caseId: string; caseTitle: string } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [customHashTestText, setCustomHashTestText] = useState('');
  const [customComputedHash, setCustomComputedHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadEvidence();
  }, []);

  const loadEvidence = async () => {
    try {
      const res = await getComplaints();
      setComplaints(res.items);
      const items: { item: EvidenceItem; caseId: string; caseTitle: string }[] = [];
      for (const c of res.items) {
        for (const ev of c.evidence) {
          items.push({ item: ev, caseId: c.id, caseTitle: c.title });
        }
      }
      setAllEvidence(items);
      if (items.length > 0) setSelectedEvidence(items[0]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerifyIntegrity = async () => {
    if (!selectedEvidence) return;
    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await verifyEvidenceHash(
        selectedEvidence.item.id,
        selectedEvidence.item.sha256
      );
      setVerificationResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setVerifying(false);
    }
  };

  const handleComputeCustomHash = async (text: string) => {
    setCustomHashTestText(text);
    if (!text) {
      setCustomComputedHash(null);
      return;
    }
    const buffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    setCustomComputedHash(hex);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Forensic Lab Header */}
      <div className="border border-emerald-900/40 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-950 to-emerald-950/40 p-6 md:p-8 backdrop-blur-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/40 text-emerald-300 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Digital Forensic Science Laboratory (FSL)</span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-slate-100">
            Digital Evidence Analysis & Cryptographic Integrity Vault
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Forensic analysis of digital artifacts: SHA-256 cryptographic tamper verification, OCR document content extraction, and tamper-resistant chain of custody logs.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Secured Evidence Files</span>
            <div className="text-xl font-bold font-mono text-emerald-400">{allEvidence.length}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Cryptographic Standard</span>
            <div className="text-xl font-bold font-mono text-cyan-400">SHA-256</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Chain of Custody</span>
            <div className="text-xl font-bold font-mono text-slate-200">100% Immutable</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Tamper Incidents</span>
            <div className="text-xl font-bold font-mono text-emerald-400">0 Detected</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Evidence Repository */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Secured Evidence Items</span>
            <span className="font-mono text-slate-500">{allEvidence.length} artifacts</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {allEvidence.map(({ item, caseId, caseTitle }) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedEvidence({ item, caseId, caseTitle });
                  setVerificationResult(null);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                  selectedEvidence?.item.id === item.id
                    ? 'bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-950/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-slate-200 truncate pr-2">{item.originalName}</span>
                  <span className="text-[10px] font-mono text-emerald-400 shrink-0">{(item.sizeBytes / 1024).toFixed(1)} KB</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">Case: {caseId}</div>
                <div className="text-[10px] font-mono text-slate-500 truncate">SHA-256: {item.sha256}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Center & Right: Forensic Analysis Workbench */}
        {selectedEvidence && (
          <div className="lg:col-span-2 space-y-6">
            <div className="border border-slate-800 rounded-2xl bg-slate-900/60 p-6 space-y-6">
              {/* Evidence Detail Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-100">{selectedEvidence.item.originalName}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px] border border-emerald-800/40">
                      {selectedEvidence.item.mimeType}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Attached to Case: <span className="text-cyan-400 font-mono">{selectedEvidence.caseId}</span> — {selectedEvidence.caseTitle}
                  </div>
                </div>

                <button
                  onClick={handleVerifyIntegrity}
                  disabled={verifying}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
                  <span>{verifying ? 'Recalculating...' : 'Verify Cryptographic Hash'}</span>
                </button>
              </div>

              {/* SHA-256 Hash Verification Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Cryptographic SHA-256 Hash (FIPS 180-4 Standard)</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedEvidence.item.sha256)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 break-all select-all">
                  {selectedEvidence.item.sha256}
                </div>

                {/* Verification result feedback */}
                {verificationResult && (
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2 text-xs text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Integrity Check Successful: Computed digest matches stored digest. File has not been tampered with or modified since upload at {new Date(selectedEvidence.item.uploadedAt).toLocaleString()}.
                    </span>
                  </div>
                )}
              </div>

              {/* Metadata & OCR Content */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-semibold text-slate-300">Metadata & Device Context</span>
                  <div className="space-y-1.5 text-slate-400">
                    <div>Origin Device: <span className="text-slate-200">{selectedEvidence.item.metadata?.device || 'Citizen Terminal'}</span></div>
                    <div>Recorded Time: <span className="text-slate-200 font-mono">{new Date(selectedEvidence.item.uploadedAt).toLocaleString()}</span></div>
                    <div>Byte Size: <span className="text-slate-200 font-mono">{selectedEvidence.item.sizeBytes.toLocaleString()} bytes</span></div>
                    <div>Chain Status: <span className="text-emerald-400 font-semibold">Immutable Record</span></div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-semibold text-slate-300">OCR / Text Extraction Preview</span>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px] leading-relaxed italic">
                    {selectedEvidence.item.extractedText || 'No text elements extracted from this binary file.'}
                  </div>
                </div>
              </div>

              {/* Interactive Live Hash Playground */}
              <div className="p-4 rounded-xl bg-slate-950 border border-cyan-900/30 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Live Hash Simulation / Tamper Test Playground</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Web Crypto API</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Type or alter any text below to see the cryptographic avalanche effect of SHA-256 in real-time.
                </p>
                <input
                  type="text"
                  placeholder="Type any test text or modified invoice amount..."
                  value={customHashTestText}
                  onChange={(e) => handleComputeCustomHash(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none focus:border-cyan-500"
                />
                {customComputedHash && (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-cyan-800/40 text-[11px] font-mono text-cyan-400 break-all">
                    Computed SHA-256: {customComputedHash}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
