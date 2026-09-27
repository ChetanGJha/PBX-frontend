import React, { useState } from 'react';
import {
  ShieldAlert,
  UserPlus,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  Lock,
  Server,
  Cpu,
  Database,
  User,
  Mail,
  Shield,
  Activity,
  Eye,
  EyeOff,
  KeyRound,
  X
} from 'lucide-react';
import { apiService } from '../services/api';
import type { User as UserType } from '../types';

interface AuthViewProps {
  onLoginSuccess: (token: string, user: UserType) => void;
  user: UserType | null;
}

export const AuthView: React.FC<AuthViewProps> = ({ user }) => {
  // Seed form
  const [seedUser, setSeedUser] = useState('superadmin2');
  const [seedEmail, setSeedEmail] = useState('admin2@pbx.com');
  const [seedPassword, setSeedPassword] = useState('SuperSecurePassword123!');
  const [showPassword, setShowPassword] = useState(false);

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
      setMessage({ type: 'success', text: `SuperAdmin account seeded successfully! User ID: ${res.user_id}` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-head flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="eyebrow">Platform Security & Auth</div>
          <h1 className="page-title">Auth & System Security</h1>
          <p className="page-sub">Active administrator session details, security posture, and platform seeding controls.</p>
        </div>
        <div className="self-start sm:self-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Platform Hardened & Monitored</span>
          </div>
        </div>
      </div>

      {/* Message / Status Alert Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold shadow-xs transition-all ${
            message.type === 'success'
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800'
              : 'bg-rose-50/90 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg ${message.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
            </div>
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid of Security & Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Super Admin Profile Card */}
        <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF0EC] text-[#FF5430] flex items-center justify-center border border-[#FF5430]/15 shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">Active Administrator Profile</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Currently logged in system Super Admin account</p>
                </div>
              </div>
              <span className="terrix-badge green hidden sm:inline-block">Active Session</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-600 font-semibold">Username</span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                  {user?.username || 'superadmin'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-600 font-semibold">Email Address</span>
                </div>
                <span className="text-xs font-bold text-slate-900">{user?.email || 'admin@pbx.com'}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-600 font-semibold">Administrative Role</span>
                </div>
                <span className="terrix-badge orange font-bold">{user?.role || 'SUPER_ADMIN'}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-600 font-semibold">Session Status</span>
                </div>
                <span className="terrix-badge green flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Active & Authenticated
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Access Controls & Security Card */}
        <div className="card p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF0EC] text-[#FF5430] flex items-center justify-center border border-[#FF5430]/15 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">Platform Access Controls</h2>
                  <p className="text-xs text-slate-500 mt-0.5">System capabilities granted to your administrator role</p>
                </div>
              </div>
              <span className="terrix-badge grey hidden sm:inline-block">RBAC Enforced</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Server className="w-4 h-4 text-[#FF5430]" />
                  <span className="text-xs text-slate-700 font-semibold">Multi-Tenant Isolation</span>
                </div>
                <span className="terrix-badge green font-bold">100% Enforced</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-[#FF5430]" />
                  <span className="text-xs text-slate-700 font-semibold">FreeSWITCH Media Engine</span>
                </div>
                <span className="terrix-badge orange font-bold">Full Control</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs text-slate-700 font-semibold">PostgreSQL & Redis DB</span>
                </div>
                <span className="terrix-badge green font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Connected
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs text-slate-700 font-semibold">API Rate Limiting & Auth</span>
                </div>
                <span className="terrix-badge green font-bold">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bootstrap Additional Admin Account Card */}
      <div className="card p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-[#FFF0EC] text-[#FF5430] flex items-center justify-center border border-[#FF5430]/15 shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Bootstrap Additional Platform Admin</h2>
            <p className="text-xs text-slate-500 mt-0.5">Seed a new platform Super Admin account (`POST /api/v1/auth/seed-superadmin`)</p>
          </div>
        </div>

        <form onSubmit={handleSeed} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="form-group mb-0">
              <label className="form-label">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={seedUser}
                  onChange={(e) => setSeedUser(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '38px' }}
                  placeholder="superadmin2"
                  required
                />
              </div>
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={seedEmail}
                  onChange={(e) => setSeedEmail(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '38px' }}
                  placeholder="admin2@pbx.com"
                  required
                />
              </div>
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={seedPassword}
                  onChange={(e) => setSeedPassword(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '38px', paddingRight: '40px' }}
                  placeholder="SuperSecurePassword123!"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <KeyRound className="w-3.5 h-3.5 text-[#FF5430] shrink-0" />
              <span>Seeds a root platform administrator with global configuration permissions.</span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full sm:w-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Processing...' : 'Seed Super Admin Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
