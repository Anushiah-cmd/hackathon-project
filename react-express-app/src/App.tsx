/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CitizenPortal } from './components/CitizenPortal';
import { CaseTracking } from './components/CaseTracking';
import { OfficerDashboard } from './components/OfficerDashboard';
import { CyberCrimeModule } from './components/CyberCrimeModule';
import { ForensicLab } from './components/ForensicLab';
import { AgentStudio } from './components/AgentStudio';
import { AuditView } from './components/AuditView';
import { AuthModal } from './components/AuthModal';
import { getCurrentUser, switchRole } from './services/api';
import { User, UserRole } from './types';
import { Shield, Sparkles, Terminal, Info, ExternalLink, Lock } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr-1',
    name: 'Aarav Sharma',
    email: 'aarav@citizen.org',
    role: 'citizen',
    phone: '+91 98765 43210'
  });

  const [activeTab, setActiveTab] = useState('citizen');
  const [trackingCaseId, setTrackingCaseId] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authIsRegister, setAuthIsRegister] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(res => {
        if (res.user) setCurrentUser(res.user);
      })
      .catch(err => console.error(err));
  }, []);

  const handleRoleChange = async (role: UserRole) => {
    try {
      const res = await switchRole(role);
      setCurrentUser(res.user);
      if (role === 'police_officer') setActiveTab('officer');
      else if (role === 'cyber_officer') setActiveTab('cyber');
      else if (role === 'forensic_expert') setActiveTab('forensics');
      else if (role === 'admin') setActiveTab('audit');
      else if (role === 'citizen') setActiveTab('citizen');
    } catch (e) {
      console.error(e);
    }
  };

  const handleCaseCreated = (caseId: string) => {
    setTrackingCaseId(caseId);
    setActiveTab('tracking');
  };

  return (
    <div className="min-h-screen bg-[#060c18] text-slate-100 flex flex-col antialiased selection:bg-rose-500 selection:text-white scanline-grid">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={(isReg) => {
          setAuthIsRegister(isReg);
          setIsAuthOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'citizen' && (
          <CitizenPortal
            onCaseCreated={handleCaseCreated}
            onOpenAuth={() => {
              setAuthIsRegister(true);
              setIsAuthOpen(true);
            }}
          />
        )}
        {activeTab === 'tracking' && (
          <CaseTracking initialCaseId={trackingCaseId} />
        )}
        {activeTab === 'officer' && (
          <OfficerDashboard
            currentUser={currentUser}
            onOpenCaseTracking={(caseId) => {
              setTrackingCaseId(caseId);
              setActiveTab('tracking');
            }}
          />
        )}
        {activeTab === 'cyber' && (
          <CyberCrimeModule />
        )}
        {activeTab === 'forensics' && (
          <ForensicLab />
        )}
        {activeTab === 'agents' && (
          <AgentStudio />
        )}
        {activeTab === 'audit' && (
          <AuditView onResetComplete={() => {}} />
        )}
      </main>

      {/* Auth Modal (matching Stitch UI screenshot) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialIsRegister={authIsRegister}
        onSuccess={(user) => {
          setCurrentUser(user);
          if (user.role === 'citizen') setActiveTab('citizen');
          else if (user.role === 'police_officer') setActiveTab('officer');
          else if (user.role === 'cyber_officer') setActiveTab('cyber');
          else if (user.role === 'forensic_expert') setActiveTab('forensics');
          else if (user.role === 'admin') setActiveTab('audit');
        }}
      />

      {/* High-Impact Footer */}
      <footer className="border-t border-slate-900 bg-[#070e1b] px-4 py-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-rose-600 flex items-center justify-center font-bold text-white text-xs">
              C
            </div>
            <span className="font-bold text-white">CRIMVEXA AI</span>
            <span className="text-slate-500">— Smart Crime Reporting & Digital Evidence Analysis</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Multilingual Voice Intake (EN / TA / ML)</span>
            <span>•</span>
            <span>FIPS 180-4 SHA-256 Verified</span>
            <span>•</span>
            <span className="text-rose-400 font-mono">Cyber Crime Incident Response</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
