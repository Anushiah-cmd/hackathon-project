import React from 'react';
import {
  Shield,
  Sparkles,
  Mic,
  FileCheck2,
  Lock,
  Scale,
  Cpu,
  Users,
  ArrowRight,
  CheckCircle2,
  LogIn,
  UserPlus,
  Languages,
  Database,
  Building,
  HelpCircle,
  FileText,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { UserRole, User } from '../types';

interface WelcomeThemePageProps {
  onOpenAuth: (isRegister: boolean) => void;
  onQuickDemoLogin: (role: UserRole) => void;
}

export const WelcomeThemePage: React.FC<WelcomeThemePageProps> = ({
  onOpenAuth,
  onQuickDemoLogin
}) => {
  return (
    <div className="space-y-16 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Welcome Section */}
      <section className="relative rounded-3xl border border-slate-800 bg-gradient-to-b from-[#0a1426] via-[#070e1b] to-[#050913] p-8 sm:p-12 lg:p-16 overflow-hidden shadow-2xl scanline-grid">
        {/* Ambient Glows */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          {/* Welcome Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>CRIMVEXA AI • Intelligent Citizen Safety & Police Dispatch</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight font-display">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-red-400 to-amber-400">CRIMVEXA AI</span>
          </h1>

          {/* Theme Description */}
          <p className="text-base sm:text-xl text-slate-300 leading-relaxed font-light max-w-3xl mx-auto">
            The next-generation smart crime reporting and digital forensics ecosystem.
            Speak your grievance in your mother tongue, get an instant legal First Information Report (FIR) formulation,
            and safeguard your evidence with cryptographic chain-of-custody verification.
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onOpenAuth(true)}
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold text-sm shadow-xl shadow-rose-600/30 hover:shadow-rose-600/50 hover:scale-[1.02] transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenAuth(false)}
              className="px-7 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-white font-bold text-sm shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-cyan-400" />
              <span>Citizen & Officer Login</span>
            </button>
          </div>

          {/* Quick Evaluator / Demo Access Pill */}
          <div className="pt-8 border-t border-slate-800/80 max-w-2xl mx-auto">
            <div className="text-xs text-slate-400 mb-3 flex items-center justify-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Instant Demo Access (Click to enter directly without typing credentials):</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => onQuickDemoLogin('citizen')}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-rose-500/40 hover:border-rose-400 text-rose-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Citizen (Aarav Sharma)</span>
              </button>
              <button
                onClick={() => onQuickDemoLogin('police_officer')}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-blue-500/40 hover:border-blue-400 text-blue-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Police Officer (Insp. Rajesh)</span>
              </button>
              <button
                onClick={() => onQuickDemoLogin('cyber_officer')}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-indigo-500/40 hover:border-indigo-400 text-indigo-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cyber Crime 1930 (Officer Priya)</span>
              </button>
              <button
                onClick={() => onQuickDemoLogin('forensic_expert')}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Forensic Expert (Dr. Sunita)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* App Theme Pillars */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="text-xs font-mono font-bold text-rose-400 uppercase tracking-widest">
            CORE PLATFORM THEME
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Transforming Crime Reporting with Artificial Intelligence
          </h2>
          <p className="text-sm text-slate-400">
            Addressing key obstacles in conventional police reporting: language barriers, emotional distress during filing, and digital evidence degradation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Theme Card 1 */}
          <div className="p-6 rounded-2xl bg-[#091222] border border-slate-800 hover:border-rose-500/50 transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
              <Languages className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white group-hover:text-rose-400 transition-colors">
                Multilingual Voice Intake
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Break linguistic friction. Report offenses comfortably speaking in Tamil, Malayalam, Hindi, or English. Web Speech Edge AI transcribes your spoken narrative in real-time.
              </p>
            </div>
            <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1 pt-2 border-t border-slate-800/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Native Language Accent Handling</span>
            </div>
          </div>

          {/* Theme Card 2 */}
          <div className="p-6 rounded-2xl bg-[#091222] border border-slate-800 hover:border-purple-500/50 transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Scale className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white group-hover:text-purple-400 transition-colors">
                AI FIR Legal Structuring
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Raw spoken words are automatically formalized into standardized police complaints. Automatically identifies relevant BNS 2023, IPC, and IT Act penal sections.
              </p>
            </div>
            <div className="text-[11px] font-mono text-purple-400 flex items-center gap-1 pt-2 border-t border-slate-800/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Sec 66D IT Act & BNS Mapping</span>
            </div>
          </div>

          {/* Theme Card 3 */}
          <div className="p-6 rounded-2xl bg-[#091222] border border-slate-800 hover:border-emerald-500/50 transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                Cryptographic Evidence Vault
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Upload bank transaction PDFs, chat screenshots, call recordings, and CCTV clips. Automatic SHA-256 fingerprinting ensures evidence complies with Section 65B of Evidence Act.
              </p>
            </div>
            <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 pt-2 border-t border-slate-800/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>FIPS 180-4 SHA-256 Hash Seals</span>
            </div>
          </div>

          {/* Theme Card 4 */}
          <div className="p-6 rounded-2xl bg-[#091222] border border-slate-800 hover:border-blue-500/50 transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                Case Offers & Police Triage
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connects directly to the Investigating Officer. Police review case offers from citizens, view CCTV proximities, issue 1930 financial liens, and update citizens in real time.
              </p>
            </div>
            <div className="text-[11px] font-mono text-blue-400 flex items-center gap-1 pt-2 border-t border-slate-800/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Full Investigation Trail & Notes</span>
            </div>
          </div>
        </div>
      </section>

      {/* How the Process Works */}
      <section className="p-8 sm:p-12 rounded-3xl bg-[#08101e] border border-slate-800 space-y-8">
        <div className="text-center space-y-2">
          <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            STEP-BY-STEP WORKFLOW
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            How CRIMVEXA AI Operates from Voice to Investigation
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3 relative">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 font-mono font-bold text-sm flex items-center justify-center">
              1
            </div>
            <h4 className="font-bold text-white text-sm">Speak or Type Incident</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Citizen accesses portal and speaks their experience in Tamil, Malayalam, or English.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3 relative">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 font-mono font-bold text-sm flex items-center justify-center">
              2
            </div>
            <h4 className="font-bold text-white text-sm">AI Legal Formulation</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gemini AI translates, formalizes into legal FIR terminology, and extracts key financial and phone artifacts.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3 relative">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-bold text-sm flex items-center justify-center">
              3
            </div>
            <h4 className="font-bold text-white text-sm">Evidence Hash Vault</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Files are hashed with SHA-256 for non-repudiation, preserving immutable digital chain-of-custody.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3 relative">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 font-mono font-bold text-sm flex items-center justify-center">
              4
            </div>
            <h4 className="font-bold text-white text-sm">Police Case Offer & IO Action</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Police officers review the case offer, accept assignment, deploy CCTV sweeps, and track status live.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Prompt */}
      <section className="text-center p-8 rounded-3xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-950 border border-rose-500/30 space-y-4">
        <h3 className="text-xl sm:text-2xl font-bold text-white">
          Ready to experience the platform?
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Please register or sign in to proceed to your Citizen Reporting Dashboard or Police Station Console.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => onOpenAuth(true)}
            className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/40 transition-all cursor-pointer"
          >
            Create Citizen Account
          </button>
          <button
            onClick={() => onOpenAuth(false)}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
          >
            Sign In Existing User
          </button>
        </div>
      </section>
    </div>
  );
};
