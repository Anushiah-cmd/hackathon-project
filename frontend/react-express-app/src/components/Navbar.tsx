import React, { useState } from 'react';
import {
  User as UserIcon,
  ChevronDown,
  CheckCircle2,
  ShieldAlert,
  Languages,
  FileText,
  Activity,
  LogIn,
  Shield,
  Lock,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { User, UserRole } from '../types';

interface NavbarProps {
  currentUser: User;
  onRoleChange: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth: (isRegister: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onRoleChange,
  activeTab,
  setActiveTab,
  onOpenAuth
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const roles: { role: UserRole; label: string; badge: string; color: string }[] = [
    { role: 'citizen', label: 'Citizen Portal', badge: 'Public Access', color: 'text-rose-400' },
    { role: 'police_officer', label: 'Police Officer', badge: 'Central Command', color: 'text-blue-400' },
    { role: 'cyber_officer', label: 'Cyber Crime Officer', badge: 'National 1930 Cell', color: 'text-indigo-400' },
    { role: 'forensic_expert', label: 'Digital Forensics Expert', badge: 'State FSL Lab', color: 'text-emerald-400' },
    { role: 'admin', label: 'Crime Records Admin', badge: 'State SCRB', color: 'text-amber-400' },
  ];

  const isCitizen = currentUser.role === 'citizen';

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#070e1b]/95 backdrop-blur-xl">
      {/* High-security Status Ticker */}
      <div className="bg-[#0b1426] px-4 py-1.5 text-xs text-slate-300 border-b border-slate-800/60 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <span className="font-mono-code text-[11px] font-semibold text-rose-400 tracking-wider">
            CRIMVEXA AI // SECURE NATIONAL INCIDENT PORTAL
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400 text-[11px] hidden md:inline">
            FIPS 180-4 SHA-256 Verified Ledger
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5 text-cyan-400 font-medium">
            <Languages className="w-3.5 h-3.5" />
            <span>Multilingual Voice Intake: English • தமிழ் • മലയാളം</span>
          </div>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-emerald-400 font-mono hidden sm:inline">Reflex Response: 12ms</span>
        </div>
      </div>

      {/* Internal Authority Alert Banner (When logged in as Law Enforcement Official) */}
      {!isCitizen && (
        <div className="bg-gradient-to-r from-blue-950/80 via-indigo-950/60 to-slate-950 px-4 py-1.5 border-b border-blue-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-cyan-300 font-mono">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold">OFFICIAL LAW ENFORCEMENT WORKBENCH:</span>
            <span className="text-white capitalize">{currentUser.role.replace('_', ' ')}</span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline">Officer: {currentUser.name}</span>
          </div>
          <button
            onClick={() => onRoleChange('citizen')}
            className="text-[11px] font-mono text-cyan-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-blue-900/40 border border-blue-700/50 cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Exit to Public Citizen Portal</span>
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => {
              if (isCitizen) setActiveTab('citizen');
              else if (currentUser.role === 'police_officer') setActiveTab('officer');
              else if (currentUser.role === 'cyber_officer') setActiveTab('cyber');
              else if (currentUser.role === 'forensic_expert') setActiveTab('forensics');
              else setActiveTab('audit');
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-600/30 font-bold text-white text-xl font-display tracking-tight group-hover:scale-105 transition-transform">
              C
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-xl font-extrabold tracking-tight text-white">
                  CRIMVEXA <span className="text-rose-500">AI</span>
                </span>
                {!isCitizen && (
                  <span className="px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-mono uppercase">
                    Official
                  </span>
                )}
              </div>
              <p className="text-[10px] font-medium text-slate-400 tracking-tight hidden sm:block">
                Smart Crime Reporting & Digital Evidence Analysis
              </p>
            </div>
          </div>

          {/* Navigation Links (Strictly Role-Segregated) */}
          <nav className="hidden md:flex items-center gap-1.5">
            {isCitizen ? (
              /* Public Citizen Portal Tabs */
              <>
                <button
                  onClick={() => setActiveTab('citizen')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'citizen'
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-md shadow-rose-950'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  Report Incident
                </button>
                <button
                  onClick={() => setActiveTab('tracking')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'tracking'
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-md shadow-rose-950'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  Track My Complaint (Live IO)
                </button>
              </>
            ) : (
              /* Official Law Enforcement Workbenches */
              <>
                {currentUser.role === 'police_officer' && (
                  <button
                    onClick={() => setActiveTab('officer')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                      activeTab === 'officer'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-md shadow-blue-950'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    Police Triage & Case Queue
                  </button>
                )}
                {currentUser.role === 'cyber_officer' && (
                  <button
                    onClick={() => setActiveTab('cyber')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                      activeTab === 'cyber'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-md shadow-indigo-950'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    National Cyber Cell 1930
                  </button>
                )}
                {currentUser.role === 'forensic_expert' && (
                  <button
                    onClick={() => setActiveTab('forensics')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                      activeTab === 'forensics'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md shadow-emerald-950'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    Digital Evidence Lab
                  </button>
                )}
                {currentUser.role === 'admin' && (
                  <>
                    <button
                      onClick={() => setActiveTab('audit')}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                        activeTab === 'audit'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-950'
                          : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                      }`}
                    >
                      SCRB Audit Trail
                    </button>
                    <button
                      onClick={() => setActiveTab('agents')}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                        activeTab === 'agents'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-md shadow-purple-950'
                          : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                      }`}
                    >
                      AI Multi-Agent & MCP Studio
                    </button>
                  </>
                )}
                <button
                  onClick={() => setActiveTab('tracking')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'tracking'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  Case Dossier Inspector
                </button>
              </>
            )}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
            {/* Department Officer Portal Access / Role Switcher */}
            {isCitizen ? (
              <button
                onClick={() => {
                  onRoleChange('police_officer');
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-blue-500 text-slate-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                title="Enter police officer workbench"
              >
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Officer Login</span>
              </button>
            ) : null}

            {/* Register / Sign-In Button */}
            <button
              onClick={() => onOpenAuth(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold text-xs tracking-wide shadow-md shadow-rose-600/30 hover:shadow-rose-600/50 transition-all cursor-pointer"
            >
              Register
            </button>

            {/* Persona Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-slate-500 transition-all text-left cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs border border-slate-700">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                    {currentUser.name.split(' ')[0]}
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="text-[10px] text-rose-400 font-mono capitalize">
                    {currentUser.role.replace('_', ' ')}
                  </div>
                </div>
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl p-2 z-50 backdrop-blur-xl">
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <div className="text-xs font-semibold text-slate-200">Switch System Persona</div>
                    <div className="text-[10px] text-slate-400">Select role to verify different perspectives</div>
                  </div>
                  <div className="space-y-1">
                    {roles.map((r) => (
                      <button
                        key={r.role}
                        onClick={() => {
                          onRoleChange(r.role);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors text-left cursor-pointer ${
                          currentUser.role === r.role
                            ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                            : 'hover:bg-slate-800/70 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className={`font-medium ${r.color}`}>{r.label}</div>
                          <div className="text-[10px] text-slate-400">{r.badge}</div>
                        </div>
                        {currentUser.role === r.role && (
                          <CheckCircle2 className="w-4 h-4 text-rose-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
