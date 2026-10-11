import React, { useState } from 'react';
import { X, ArrowLeft, Shield, CheckCircle2, User as UserIcon, Lock, Mail, Phone, Building } from 'lucide-react';
import { User, UserRole } from '../types';
import { registerUser, loginWithEmail, switchRole } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  initialIsRegister?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialIsRegister = true
}) => {
  const [isRegister, setIsRegister] = useState(initialIsRegister);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('citizen');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await registerUser({
          name,
          email,
          phone,
          role,
          badgeNumber: badgeNumber || undefined,
          department: department || undefined
        });
        onSuccess(res.user);
        onClose();
      } else {
        const res = await loginWithEmail(email);
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative max-w-4xl w-full rounded-3xl bg-[#091222] border border-slate-800 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Side: Exactly matches the user's provided Stitch UI screenshot */}
        <div className="p-8 md:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800/80 bg-gradient-to-br from-[#0b172d] to-[#070e1b] relative overflow-hidden scanline-grid">
          {/* Subtle star / diamond motif in top-right as seen in screenshot */}
          <div className="absolute top-10 right-10 text-rose-500/20 pointer-events-none text-7xl select-none font-serif">
            ✦
          </div>

          <div className="space-y-6 relative z-10">
            {/* Logo in top left */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center font-bold text-white text-xl font-display shadow-lg shadow-rose-600/30">
                C
              </div>
              <span className="font-display text-xl font-extrabold tracking-tight text-white">
                CRIMVEXA <span className="text-rose-500">AI</span>
              </span>
            </div>

            <div className="pt-6 space-y-4">
              <div className="text-xs font-bold text-rose-500 uppercase tracking-widest font-mono">
                WELCOME TO CRIMVEXA AI
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight font-display tracking-tight">
                Your Safety.<br />
                Your Voice.<br />
                Your Account.
              </h1>

              <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
                Sign in to access your citizen dashboard, submit complaints, upload evidence, and track report updates.
              </p>
            </div>
          </div>

          <div className="pt-8 relative z-10">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-2 group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Home</span>
            </button>
          </div>
        </div>

        {/* Right Side: Registration / Sign In Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center bg-[#070e1b]">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white font-display">
                {isRegister ? 'Create Citizen Account' : 'Sign In to CRIMVEXA'}
              </h2>
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
              >
                {isRegister ? 'Already registered? Sign In' : 'Need an account? Register'}
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-600/50 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-xs text-white placeholder:text-slate-500 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. citizen@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-xs text-white placeholder:text-slate-500 outline-none"
                />
              </div>

              {isRegister && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Mobile Contact (for OTP/Updates)</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-rose-500 text-xs text-white placeholder:text-slate-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Access Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-rose-500 text-xs text-white outline-none"
                    >
                      <option value="citizen">Citizen Complainant</option>
                      <option value="police_officer">Police Station Officer</option>
                      <option value="cyber_officer">Cyber Crime Officer (1930)</option>
                      <option value="forensic_expert">Digital Forensic Specialist</option>
                      <option value="admin">Crime Records Bureau Administrator</option>
                    </select>
                  </div>

                  {role !== 'citizen' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Badge ID</label>
                        <input
                          type="text"
                          placeholder="e.g. POL-8812"
                          value={badgeNumber}
                          onChange={(e) => setBadgeNumber(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Department</label>
                        <input
                          type="text"
                          placeholder="e.g. Cyber Cell"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-rose-600/30 transition-all cursor-pointer mt-2 disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : isRegister ? 'Complete Registration' : 'Sign In Now'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
