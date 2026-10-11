import React, { useState, useEffect } from 'react';
import {
  Shield,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Terminal,
  FileText,
  Filter,
  Activity,
  Layers,
  Lock,
  Cpu
} from 'lucide-react';
import { getAuditLogs, refreshDatabaseLedger, getHealth } from '../services/api';
import { AuditLog } from '../types';

interface AuditViewProps {
  onResetComplete: () => void;
}

export const AuditView: React.FC<AuditViewProps> = ({ onResetComplete }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [healthInfo, setHealthInfo] = useState<any>(null);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    loadAuditData();
  }, []);

  const loadAuditData = async () => {
    try {
      const [logsRes, healthRes] = await Promise.all([
        getAuditLogs(),
        getHealth()
      ]);
      setLogs(logsRes.logs);
      setHealthInfo(healthRes);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await refreshDatabaseLedger();
      await loadAuditData();
      onResetComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  const filteredLogs = severityFilter === 'ALL'
    ? logs
    : logs.filter(l => l.severity === severityFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="border border-amber-900/40 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-950 to-amber-950/40 p-6 md:p-8 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800/40 text-amber-300 text-xs font-mono">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>State Crime Records Bureau (SCRB) System Audit</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-slate-100">
              System Transparency & Immutable Audit Log
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Complete chronological audit trail of all platform activities, status transitions, SHA-256 evidence registrations, and multi-agent dispatch timings.
            </p>
          </div>

          <button
            onClick={handleReset}
            disabled={isResetting}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors flex items-center gap-2 self-start md:self-auto cursor-pointer border border-slate-700"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Synchronizing...' : 'Refresh Crime Records Ledger'}</span>
          </button>
        </div>

        {/* System Health Status */}
        {healthInfo && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase">System Status</span>
              <div className="font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                {healthInfo.status.toUpperCase()}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Architecture Version</span>
              <div className="font-bold text-slate-200 font-mono">{healthInfo.version}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Active DB Cases</span>
              <div className="font-bold text-cyan-400 font-mono">{healthInfo.databaseCasesCount} Cases</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Cryptographic Engine</span>
              <div className="font-bold text-purple-400 font-mono">FIPS 180-4 SHA-256</div>
            </div>
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900/60 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Audit History Ledger ({filteredLogs.length} events)</span>
          </h2>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Filter Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-slate-300 outline-none focus:border-amber-500 font-mono text-[11px]"
            >
              <option value="ALL">All Severities</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ALERT">ALERT</option>
            </select>
          </div>
        </div>

        <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    log.severity === 'ALERT' ? 'bg-rose-950 text-rose-400 border border-rose-800/40' :
                    log.severity === 'WARNING' ? 'bg-amber-950 text-amber-400 border border-amber-800/40' :
                    'bg-slate-900 text-cyan-400 border border-slate-800'
                  }`}>
                    {log.severity}
                  </span>
                  <span className="font-mono font-bold text-slate-200">{log.action}</span>
                  {log.targetId && (
                    <span className="font-mono text-slate-500 text-[10px]">[{log.targetId}]</span>
                  )}
                </div>
                <span className="font-mono text-[10px] text-slate-500">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>

              <div className="text-slate-300 text-[11px] leading-relaxed">
                {log.details}
              </div>

              <div className="text-[10px] text-slate-500 italic flex items-center justify-between pt-0.5">
                <span>Actor: {log.actor} ({log.actorRole})</span>
                <span className="font-mono">{log.id}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
