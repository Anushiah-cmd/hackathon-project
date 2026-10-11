import React, { useState } from 'react';
import {
  Cpu,
  Sparkles,
  Network,
  Terminal,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Database,
  Camera,
  Search,
  Hash,
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';
import { mcpSearchCases, mcpFindCameras } from '../services/api';

export const AgentStudio: React.FC = () => {
  // MCP Tool Testing States
  const [similarityQuery, setSimilarityQuery] = useState('Bicycle stolen lock cut bolt cutters');
  const [similarityResults, setSimilarityResults] = useState<any>(null);
  const [loadingSimilarity, setLoadingSimilarity] = useState(false);

  const [cameraQuery, setCameraQuery] = useState('Metro Station');
  const [cameraResults, setCameraResults] = useState<any>(null);
  const [loadingCamera, setLoadingCamera] = useState(false);

  // Active agents table
  const agents = [
    {
      name: 'Interviewer Agent',
      code: 'interviewer',
      role: 'Intake Completeness & Clarifications',
      description: 'Identifies missing key attributes (time, exact location, financial loss, vehicle, suspects) and provides polite clarifying prompts.',
      status: 'Active',
      avgLatency: '12ms',
      fallback: 'Deterministic rule-based questions'
    },
    {
      name: 'Category Classifier (System 1)',
      code: 'classifier',
      role: 'Instant First-Pass Categorization',
      description: 'Performs sub-15ms text token matching across cyber, financial, physical theft, and threat lexicons with confidence scoring.',
      status: 'Active',
      avgLatency: '9ms',
      fallback: 'General Report category tag'
    },
    {
      name: 'Priority Scorer Agent',
      code: 'priority_scorer',
      role: 'Explainable Triage Scoring',
      description: 'Transparent 0-100 score based on physical violence threats, financial loss magnitude, and Golden Hour urgency. Discloses limitations.',
      status: 'Active',
      avgLatency: '6ms',
      fallback: 'Baseline medium priority score'
    },
    {
      name: 'Case Linking Agent (MCP)',
      code: 'case_linking',
      role: 'TF-IDF Vector Cosine Case Similarity',
      description: 'Exposes search_similar_cases MCP tool to discover correlated complaints, repeating suspect UPIs, or modus operandi.',
      status: 'Active',
      avgLatency: '22ms',
      fallback: 'Empty candidate list without false positives'
    },
    {
      name: 'Evidence & Integrity Agent',
      code: 'evidence_analyzer',
      role: 'Cryptographic Hashing & Metadata Verification',
      description: 'Calculates FIPS 180-4 SHA-256 digests, inspects MIME/file types, and parses OCR text extracts.',
      status: 'Active',
      avgLatency: '14ms',
      fallback: 'Preserves raw metadata'
    },
    {
      name: 'Officer Briefing Agent',
      code: 'briefing',
      role: 'Executive Summary Synthesis',
      description: 'Structures report into Verified Citizen Facts, Unknowns/Pending Items, AI Suggestions, and Action Steps.',
      status: 'Active',
      avgLatency: '16ms',
      fallback: 'Standardized case template'
    },
    {
      name: 'Mock Portal Filing Agent',
      code: 'filing',
      role: 'Playwright Browser Automation Emulation',
      description: 'Simulates official e-filing into local mock police portal after citizen explicit consent, generating FIR receipts.',
      status: 'Active',
      avgLatency: '350ms',
      fallback: 'Manual filing draft preservation'
    }
  ];

  const handleRunSimilarityTool = async () => {
    setLoadingSimilarity(true);
    try {
      const res = await mcpSearchCases(similarityQuery);
      setSimilarityResults(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSimilarity(false);
    }
  };

  const handleRunCameraTool = async () => {
    setLoadingCamera(true);
    try {
      const res = await mcpFindCameras(cameraQuery);
      setCameraResults(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCamera(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="border border-purple-900/40 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-950 to-purple-950/40 p-6 md:p-8 backdrop-blur-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-800/40 text-purple-300 text-xs font-mono">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Multi-Agent Dispatcher & Model Context Protocol (MCP)</span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-slate-100">
            Agent Orchestration & MCP Tool Console
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Inspect the 7 independent agents, their input/output contracts, verified latencies, failure fallbacks, and test the Model Context Protocol (MCP) server endpoints.
          </p>
        </div>

        {/* Global Latency Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Registered Agents</span>
            <div className="text-xl font-bold font-mono text-purple-400">7 Active</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase">First-Pass Latency</span>
            <div className="text-xl font-bold font-mono text-emerald-400">14ms Median</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase">MCP Server Protocol</span>
            <div className="text-xl font-bold font-mono text-cyan-400">JSON-RPC / REST</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Safety Principle</span>
            <div className="text-xl font-bold font-mono text-amber-400">Human-In-The-Loop</div>
          </div>
        </div>
      </div>

      {/* Agents Table */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900/60 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Active Agent Roster & Contracts</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Agent Name</th>
                <th className="py-3 px-4">Role & Specialization</th>
                <th className="py-3 px-4">Median Latency</th>
                <th className="py-3 px-4">Failure Fallback Strategy</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {agents.map((ag) => (
                <tr key={ag.code} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-200">{ag.name}</div>
                    <div className="font-mono text-[10px] text-purple-400">agent::{ag.code}</div>
                  </td>
                  <td className="py-3 px-4 max-w-sm">
                    <div className="text-slate-300 font-medium">{ag.role}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{ag.description}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-emerald-400">
                    {ag.avgLatency}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {ag.fallback}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/40 text-[10px] font-mono">
                      {ag.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive MCP Tools Testing Workbench */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tool 1: search_similar_cases */}
        <div className="border border-slate-800 rounded-2xl bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-200">
                MCP Tool: <span className="font-mono text-cyan-300">search_similar_cases</span>
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400">
              TF-IDF Cosine
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Queries the local synthetic case records vector index for correlated modus operandi and keyword overlap.
          </p>

          <div className="space-y-3">
            <input
              type="text"
              value={similarityQuery}
              onChange={(e) => setSimilarityQuery(e.target.value)}
              placeholder="Enter search phrase or incident text..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 outline-none focus:border-cyan-500 font-mono"
            />

            <button
              onClick={handleRunSimilarityTool}
              disabled={loadingSimilarity}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{loadingSimilarity ? 'Executing Tool...' : 'Invoke search_similar_cases'}</span>
            </button>
          </div>

          {similarityResults && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="text-[10px] font-mono text-slate-500 flex justify-between">
                <span>TOOL RESULT: {similarityResults.tool}</span>
                <span>Found: {similarityResults.totalFound} matches</span>
              </div>

              {similarityResults.matches.length === 0 ? (
                <div className="text-slate-500 italic">No similarity matches above 25% threshold.</div>
              ) : (
                similarityResults.matches.map((m: any) => (
                  <div key={m.caseId} className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex justify-between font-mono text-cyan-300">
                      <span>{m.caseId}</span>
                      <span>{m.similarityScore}% similarity</span>
                    </div>
                    <div className="text-slate-300 font-medium">{m.title}</div>
                    <div className="text-[10px] text-slate-400">
                      Tokens: {m.matchingKeywords.join(', ')}
                    </div>
                  </div>
                ))
              )}

              <div className="text-[10px] text-amber-400/80 italic pt-1">
                ⚠️ {similarityResults.caveat}
              </div>
            </div>
          )}
        </div>

        {/* Tool 2: find_nearby_cameras */}
        <div className="border border-slate-800 rounded-2xl bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-slate-200">
                MCP Tool: <span className="font-mono text-purple-300">find_nearby_cameras</span>
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-400">
              Proximity Registry
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Queries municipal and metro CCTV camera registry within geographic proximity to locate potential surveillance video leads.
          </p>

          <div className="space-y-3">
            <input
              type="text"
              value={cameraQuery}
              onChange={(e) => setCameraQuery(e.target.value)}
              placeholder="e.g. Metro Station, Market, ATM Kiosk..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 outline-none focus:border-purple-500 font-mono"
            />

            <button
              onClick={handleRunCameraTool}
              disabled={loadingCamera}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{loadingCamera ? 'Executing Tool...' : 'Invoke find_nearby_cameras'}</span>
            </button>
          </div>

          {cameraResults && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="text-[10px] font-mono text-slate-500">
                TOOL RESULT: {cameraResults.tool}
              </div>

              {cameraResults.results.map((cam: any) => (
                <div key={cam.cameraId} className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex justify-between font-mono text-purple-300">
                    <span>{cam.cameraId}</span>
                    <span className="text-emerald-400">{cam.status} ({cam.distanceMeters}m away)</span>
                  </div>
                  <div className="text-slate-300 font-medium">{cam.location}</div>
                  <div className="text-[10px] text-slate-400">{cam.coverageNote}</div>
                  <div className="text-[10px] text-slate-500">Authority: {cam.contactDepartment}</div>
                </div>
              ))}

              <div className="text-[10px] text-slate-500 italic pt-1">
                {cameraResults.caveat}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
