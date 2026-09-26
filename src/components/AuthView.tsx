import React, { useState } from 'react';
import { KeyRound, ShieldAlert, UserPlus, LogIn, CheckCircle2, Copy } from 'lucide-react';
import { apiService } from '../services/api';
import type { User } from '../types';

interface AuthViewProps {
  onLoginSuccess: (token: string, user: User) => void;
  token: string | null;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess, token }) => {
  // Login form
  const [loginField, setLoginField] = useState('superadmin');
  const [loginPassword, setLoginPassword] = useState('SuperSecurePassword123!');
  
  // Seed form
  const [seedUser, setSeedUser] = useState('superadmin');
  const [seedEmail, setSeedEmail] = useState('admin@pbx.com');
  const [seedPassword, setSeedPassword] = useState('SuperSecurePassword123!');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSeed = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await apiService.seedSuperAdmin({
        username: seedUser,
        email: seedEmail,
        password: seedPassword,
      });
      setMessage({ type: 'success', text: `SuperAdmin seeded! User ID: ${res.user_id}` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await apiService.login({
        username_or_email: loginField,
        password: loginPassword,
      });
      onLoginSuccess(res.access_token, res.user);
      setMessage({ type: 'success', text: `Authenticated successfully as ${res.user.username} (${res.user.role})` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <ShieldAlert className="w-5 h-5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seed Super Admin Card */}
        <div className="glass-card p-6 border border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">1. Bootstrap Super Admin</h2>
              <p className="text-xs text-slate-400">Initialize platform administrator (Runs POST /api/v1/auth/seed-superadmin)</p>
            </div>
          </div>

          <form onSubmit={handleSeed} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
              <input
                type="text"
                value={seedUser}
                onChange={(e) => setSeedUser(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={seedEmail}
                onChange={(e) => setSeedEmail(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <input
                type="password"
                value={seedPassword}
                onChange={(e) => setSeedPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Processing...' : 'Seed Super Admin Account'}</span>
            </button>
          </form>
        </div>

        {/* Login Card */}
        <div className="glass-card p-6 border border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">2. User Login & Token Request</h2>
              <p className="text-xs text-slate-400">Authenticate and acquire JWT access token (POST /api/v1/auth/login)</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Username or Email</label>
              <input
                type="text"
                value={loginField}
                onChange={(e) => setLoginField(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center bg-gradient-to-r from-cyan-600 to-indigo-600">
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Authenticate & Acquire JWT'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Active Token Inspector */}
      {token && (
        <div className="glass-card p-6 border border-indigo-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
              <KeyRound className="w-4 h-4" />
              <span>Active JWT Bearer Token</span>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(token)}
              className="text-xs text-indigo-400 hover:text-indigo-200 flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Token</span>
            </button>
          </div>
          <div className="code-block break-all text-xs text-indigo-200">
            {token}
          </div>
        </div>
      )}
    </div>
  );
};
