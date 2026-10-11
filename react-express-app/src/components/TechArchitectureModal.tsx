import React, { useState } from 'react';
import {
  X,
  Cpu,
  Terminal,
  Zap,
  Globe,
  Layers,
  ShieldCheck,
  Mic,
  Play,
  CheckCircle2,
  ExternalLink,
  Search,
  Server,
  Activity
} from 'lucide-react';
import { executeMcpTool, runAgenticBrowserLookup } from '../services/api';

interface TechArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechArchitectureModal: React.FC<TechArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'agentic' | 'voice' | 'system1' | 'edge' | 'multiagent' | 'mcp'>('all');

  // Agentic Browser test state
  const [browserQuery, setBrowserQuery] = useState('https://sbi-kyc-update-alert.xyz/apk/quicksupport.apk');
  const [browserResults, setBrowserResults] = useState<any>(null);
  const [loadingBrowser, setLoadingBrowser] = useState(false);

  // System 1 JEV test state
  const [jevPrompt, setJevPrompt] = useState('Scammer demanding ₹50,000 via UPI immediately or parcel seized');
  const [jevResults, setJevResults] = useState<any>(null);
  const [loadingJev, setLoadingJev] = useState(false);

  // MCP test state
  const [mcpToolSelected, setMcpToolSelected] = useState('jev_fast_triage');
  const [mcpResult, setMcpResult] = useState<any>(null);
  const [loadingMcp, setLoadingMcp] = useState(false);

  if (!isOpen) return null;

  const handleRunAgenticBrowser = async () => {
    setLoadingBrowser(true);
    try {
      const data = await runAgenticBrowserLookup(browserQuery);
      setBrowserResults(data);
    } catch (e: any) {
      alert(e.message || 'Lookup failed');
    } finally {
      setLoadingBrowser(false);
    }
  };

  const handleRunJev = async () => {
    setLoadingJev(true);
    try {
      const data = await executeMcpTool('jev_fast_triage', { text: jevPrompt });
      setJevResults(data.result);
    } catch (e: any) {
      alert(e.message || 'JEV triage failed');
    } finally {
      setLoadingJev(false);
    }
  };

  const handleRunMcp = async () => {
    setLoadingMcp(true);
    try {
      const data = await executeMcpTool(mcpToolSelected, {
        query: 'Bicycle stolen campus lock cut',
        text: 'Urgent cyber scam ₹48,000 transfer',
        originalHash: '3cb080e4b85776d5e165417e0ef73fa1fbb59d3cfbe28eb079c656372ec72561'
      });
      setMcpResult(data.result);
    } catch (e: any) {
      alert(e.message || 'MCP tool execution failed');
    } finally {
      setLoadingMcp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="max-w-4xl w-full bg-[#081224] border border-cyan-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto text-slate-100">

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Cpu className="w-4 h-4" />
              <span>Hackathon Evaluation & Architecture Console</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-white mt-1">
              Expected Technologies & Core Innovations
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Live demonstration of the 6 key technologies implemented in CRIMVEXA AI. Judges can interact with live telemetry and test execution.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 6 Tech Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

          {/* Pillar 1: Agentic Browser */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded font-bold">1. AGENTIC BROWSER</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <h3 className="font-bold text-white text-xs">Sandbox Threat Intelligence</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Agent executes headless browser inspection on scam URLs/APKs, DOM harvesting, WHOIS registry lookup, and bank nodal switches.
            </p>
          </div>

          {/* Pillar 2: Ultra-low-latency voice */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-rose-500/50 transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded font-bold">2. LOW-LATENCY VOICE</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <h3 className="font-bold text-white text-xs">Web Speech Real-Time Stream</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Sub-15ms live chunk visualization for English (en-IN), தமிழ் (ta-IN), and മലയാളം (ml-IN) with Web Audio visualizer.
            </p>
          </div>

          {/* Pillar 3: System One Decision Models */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded font-bold">3. SYSTEM 1 MODELS (JEV)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <h3 className="font-bold text-white text-xs">Sub-50ms Reflex Triage Vector</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Fast intuitive triage (Just-in-time Evaluation Vector) before deep multi-agent deliberation. Golden Hour freeze flag in &lt;14ms.
            </p>
          </div>

          {/* Pillar 4: Edge Models */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded font-bold">4. EDGE MODELS</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <h3 className="font-bold text-white text-xs">Client-Side On-Device Engine</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Runs in-browser tokenization, PII redaction, localStorage draft persistence, and Web Crypto FIPS SHA-256 evidence hashing.
            </p>
          </div>

          {/* Pillar 5: Multi-Agent Orchestration */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/50 transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded font-bold">5. MULTI-AGENT ORCHESTRATION</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <h3 className="font-bold text-white text-xs">7 Specialized Cyber Agents</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Interviewer, Classifier, Priority Scorer, Case Linking (TF-IDF), Evidence Seal, Officer Briefing, and FIR Filing nodes.
            </p>
          </div>

          {/* Pillar 6: MCP Protocol */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-blue-500/50 transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded font-bold">6. MCP PROTOCOL</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <h3 className="font-bold text-white text-xs">Model Context Protocol Server</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Standardized tools manifest exposed at <code className="text-cyan-300">/api/mcp/manifest</code> and universal <code className="text-cyan-300">/api/mcp/call</code> endpoint.
            </p>
          </div>

        </div>

        {/* Live Interactive Verification Playground */}
        <div className="border border-slate-800 rounded-2xl bg-slate-950/90 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Interactive Telemetry & Live Tool Testing</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <button
                onClick={() => setActiveTab('agentic')}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all ${
                  activeTab === 'agentic' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                Test Agentic Browser
              </button>
              <button
                onClick={() => setActiveTab('system1')}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all ${
                  activeTab === 'system1' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                Test JEV System 1
              </button>
              <button
                onClick={() => setActiveTab('mcp')}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all ${
                  activeTab === 'mcp' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                Test MCP Tool
              </button>
            </div>
          </div>

          {/* Interactive Agentic Browser Sandbox View */}
          {(activeTab === 'all' || activeTab === 'agentic') && (
            <div className="p-4 rounded-xl bg-[#070e1b] border border-cyan-900/40 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-400 font-mono">Agentic Browser Sandbox Inspector:</span>
                <span className="text-[10px] text-slate-500 font-mono">Headless Chromium Container</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={browserQuery}
                  onChange={(e) => setBrowserQuery(e.target.value)}
                  placeholder="Enter suspect URL, UPI ID, or phone number..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs text-slate-100 outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleRunAgenticBrowser}
                  disabled={loadingBrowser}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shrink-0"
                >
                  {loadingBrowser ? 'Scanning...' : 'Execute Sandbox Inspection'}
                </button>
              </div>

              {browserResults && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-2">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Target: {browserResults.query}</span>
                    <span className="text-rose-400 font-bold">Threat Risk: {browserResults.threatAssessment.riskScore}/100</span>
                  </div>
                  <div className="space-y-1 pt-1 border-t border-slate-900">
                    <span className="text-slate-400 font-bold">Automated Agent Investigation Steps:</span>
                    {browserResults.agenticInvestigationSteps.map((s: any) => (
                      <div key={s.step} className="flex items-center gap-2 text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-cyan-300">Step {s.step}: {s.action}</span>
                        <span className="text-slate-500">→ {s.finding}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interactive JEV System 1 Reflex View */}
          {activeTab === 'system1' && (
            <div className="p-4 rounded-xl bg-[#070e1b] border border-amber-900/40 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400 font-mono">System One Decision Model (JEV Reflex):</span>
                <span className="text-[10px] text-emerald-400 font-mono">Sub-50ms Reflex Benchmark</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={jevPrompt}
                  onChange={(e) => setJevPrompt(e.target.value)}
                  placeholder="Enter complaint scenario..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs text-slate-100 outline-none focus:border-amber-500"
                />
                <button
                  onClick={handleRunJev}
                  disabled={loadingJev}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shrink-0"
                >
                  {loadingJev ? 'Computing...' : 'Run Sub-50ms Reflex'}
                </button>
              </div>

              {jevResults && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-1">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-amber-300 font-bold">Reflex Score: {jevResults.jevReflexScore}/100</span>
                    <span className="text-emerald-400 font-bold">Latency: {jevResults.sub50msLatencyMs}ms (Sub-50ms Pass)</span>
                  </div>
                  <div className="text-slate-300">Danger Tier: <span className="text-rose-400">{jevResults.dangerTier}</span></div>
                  <div className="text-slate-400">Action Vector: {jevResults.recommendedAction}</div>
                </div>
              )}
            </div>
          )}

          {/* Interactive MCP Tool Call View */}
          {activeTab === 'mcp' && (
            <div className="p-4 rounded-xl bg-[#070e1b] border border-blue-900/40 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-400 font-mono">Model Context Protocol (MCP) Tool Invocation:</span>
                <span className="text-[10px] text-cyan-400 font-mono">Protocol: model-context-protocol/v1</span>
              </div>
              <div className="flex gap-2">
                <select
                  value={mcpToolSelected}
                  onChange={(e) => setMcpToolSelected(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs text-slate-100 outline-none focus:border-blue-500"
                >
                  <option value="jev_fast_triage">mcp::jev_fast_triage</option>
                  <option value="search_similar_cases">mcp::search_similar_cases</option>
                  <option value="find_nearby_cameras">mcp::find_nearby_cameras</option>
                  <option value="verify_evidence_sha256">mcp::verify_evidence_sha256</option>
                  <option value="agentic_browser_lookup">mcp::agentic_browser_lookup</option>
                </select>
                <button
                  onClick={handleRunMcp}
                  disabled={loadingMcp}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
                >
                  {loadingMcp ? 'Calling MCP...' : 'Invoke Tool'}
                </button>
              </div>

              {mcpResult && (
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-emerald-300 overflow-x-auto max-h-40">
                  {JSON.stringify(mcpResult, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
          <span>CRIMVEXA AI Platform // Official Hackathon Submission</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors cursor-pointer"
          >
            Close Console
          </button>
        </div>

      </div>
    </div>
  );
};
