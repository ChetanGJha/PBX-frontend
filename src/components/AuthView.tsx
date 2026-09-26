import React, { useState } from 'react';
import { ShieldAlert, UserPlus, CheckCircle2, ShieldCheck, UserCheck, Lock, Server, Cpu, Database } from 'lucide-react';
import { apiService } from '../services/api';
import type { User } from '../types';

interface AuthViewProps {
  onLoginSuccess: (token: string, user: User) => void;
  user: User | null;
}

export const AuthView: React.FC<AuthViewProps> = ({ user }) => {
  // Seed form
  const [seedUser, setSeedUser] = useState('superadmin2');
  const [seedEmail, setSeedEmail] = useState('admin2@pbx.com');
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
      <div className="page-head">
        <div>
          <div className="eyebrow">Platform Security & Auth</div>
          <h1 className="page-title">Auth & System Security</h1>
          <p className="page-sub">Active administrator session details, security posture, and platform seeding controls.</p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" /> : <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Grid of Security & Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Super Admin Profile Card */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-[#FFF0EC] text-[#FF5430] rounded-xl shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Active Administrator Profile</h2>
                <p className="text-xs text-slate-500">Currently logged in system Super Admin account</p>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold">Username</span>
                <span className="text-xs font-bold text-slate-900">{user?.username || 'superadmin'}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold">Email Address</span>
                <span className="text-xs font-bold text-slate-900">{user?.email || 'admin@pbx.com'}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold">Administrative Role</span>
                <span className="terrix-badge green">{user?.role || 'SUPER_ADMIN'}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold">Session Status</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> Active & Authenticated
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Access Controls & Security Card */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-[#FFF0EC] text-[#FF5430] rounded-xl shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Platform Access Controls</h2>
                <p className="text-xs text-slate-500">System capabilities granted to your administrator role</p>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#FF5430]" />
                  <span className="text-xs text-slate-700 font-semibold">Multi-Tenant Isolation</span>
                </div>
                <span className="text-xs font-bold text-slate-900">100% Enforced</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#FF5430]" />
                  <span className="text-xs text-slate-700 font-semibold">FreeSWITCH Media Engine</span>
                </div>
                <span className="text-xs font-bold text-slate-900">Full Control</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs text-slate-700 font-semibold">PostgreSQL & Redis DB</span>
                </div>
                <span className="text-xs font-bold text-emerald-600">Connected</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs text-slate-700 font-semibold">API Rate Limiting & Auth</span>
                </div>
                <span className="text-xs font-bold text-emerald-600">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bootstrap Additional Admin Account Card */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-[#FFF0EC] text-[#FF5430] rounded-xl shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Bootstrap Additional Platform Admin</h2>
            <p className="text-xs text-slate-500">Seed a new platform Super Admin account (`POST /api/v1/auth/seed-superadmin`)</p>
          </div>
        </div>

        <form onSubmit={handleSeed} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="form-group mb-0">
            <label className="form-label">Username</label>
            <input
              type="text"
              value={seedUser}
              onChange={(e) => setSeedUser(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <div className="form-group mb-0">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              value={seedEmail}
              onChange={(e) => setSeedEmail(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <div className="form-group mb-0">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={seedPassword}
              onChange={(e) => setSeedPassword(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <div className="md:col-span-3 mt-2">
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Processing...' : 'Seed Super Admin Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};



