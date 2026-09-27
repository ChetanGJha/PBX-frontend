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
      <div className="page-head flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="eyebrow text-[#FF5430] font-extrabold tracking-wider">PLATFORM SECURITY & AUTH</div>
          <h1 className="page-title text-2xl font-extrabold text-slate-900 tracking-tight">Auth & System Security</h1>
          <p className="page-sub text-slate-500 text-xs font-medium">Active administrator session details, security posture, and platform seeding controls.</p>
        </div>
        <div className="self-start sm:self-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Platform Hardened & Monitored</span>
          </div>
        </div>
      </div>

      {/* Status Alert Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-bold shadow-2xs transition-all ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
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
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid: Active Admin Profile & Platform Access Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Super Admin Profile Card */}
        <div className="auth-card flex flex-col justify-between">
          <div>
            <div className="auth-card-header">
              <div className="auth-card-header-left">
                <div className="auth-icon-box">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="auth-card-title">Active Administrator Profile</div>
                  <div className="auth-card-sub">Currently logged in system Super Admin account</div>
                </div>
              </div>
              <span className="terrix-badge green hidden sm:inline-flex">Active Session</span>
            </div>

            <div>
              <div className="info-row-item">
                <div className="info-label-wrap">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Username</span>
                </div>
                <span className="info-mono-badge">
                  {user?.username || 'superadmin'}
                </span>
              </div>

              <div className="info-row-item">
                <div className="info-label-wrap">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>Email Address</span>
                </div>
                <span className="info-value-badge">{user?.email || 'admin@pbx.com'}</span>
              </div>

              <div className="info-row-item">
                <div className="info-label-wrap">
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span>Administrative Role</span>
                </div>
                <span className="terrix-badge orange font-extrabold">{user?.role || 'SUPER_ADMIN'}</span>
              </div>

              <div className="info-row-item">
                <div className="info-label-wrap">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <span>Session Status</span>
                </div>
                <span className="terrix-badge green flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Active & Authenticated
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Access Controls Card */}
        <div className="auth-card flex flex-col justify-between">
          <div>
            <div className="auth-card-header">
              <div className="auth-card-header-left">
                <div className="auth-icon-box">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="auth-card-title">Platform Access Controls</div>
                  <div className="auth-card-sub">System capabilities granted to your administrator role</div>
                </div>
              </div>
              <span className="terrix-badge grey hidden sm:inline-flex">RBAC Enforced</span>
            </div>

            <div>
              <div className="info-row-item">
                <div className="info-label-wrap">
                  <Server className="w-4 h-4 text-[#FF5430]" />
                  <span>Multi-Tenant Isolation</span>
                </div>
                <span className="terrix-badge green font-extrabold">100% Enforced</span>
              </div>

              <div className="info-row-item">
                <div className="info-label-wrap">
                  <Cpu className="w-4 h-4 text-[#FF5430]" />
                  <span>FreeSWITCH Media Engine</span>
                </div>
                <span className="terrix-badge orange font-extrabold">Full Control</span>
              </div>

              <div className="info-row-item">
                <div className="info-label-wrap">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>PostgreSQL & Redis DB</span>
                </div>
                <span className="terrix-badge green font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Connected
                </span>
              </div>

              <div className="info-row-item">
                <div className="info-label-wrap">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>API Rate Limiting & Auth</span>
                </div>
                <span className="terrix-badge green font-extrabold">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bootstrap Additional Admin Account Card */}
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-card-header-left">
            <div className="auth-icon-box">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="auth-card-title">Bootstrap Additional Platform Admin</div>
              <div className="auth-card-sub">Seed a new platform Super Admin account (`POST /api/v1/auth/seed-superadmin`)</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSeed} className="space-y-6">
          <div className="form-grid-3">
            <div className="form-group mb-0">
              <label className="form-label">USERNAME</label>
              <div className="input-icon-wrap">
                <User className="input-left-icon" />
                <input
                  type="text"
                  value={seedUser}
                  onChange={(e) => setSeedUser(e.target.value)}
                  placeholder="superadmin2"
                  required
                />
              </div>
            </div>

            <div className="form-group mb-0">
              <label className="form-label">EMAIL ADDRESS</label>
              <div className="input-icon-wrap">
                <Mail className="input-left-icon" />
                <input
                  type="email"
                  value={seedEmail}
                  onChange={(e) => setSeedEmail(e.target.value)}
                  placeholder="admin2@pbx.com"
                  required
                />
              </div>
            </div>

            <div className="form-group mb-0">
              <label className="form-label">PASSWORD</label>
              <div className="input-icon-wrap">
                <KeyRound className="input-left-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={seedPassword}
                  onChange={(e) => setSeedPassword(e.target.value)}
                  style={{ paddingRight: '40px' }}
                  placeholder="SuperSecurePassword123!"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="input-eye-btn"
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <KeyRound className="w-4 h-4 text-[#FF5430] shrink-0" />
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


