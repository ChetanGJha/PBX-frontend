import React, { useState } from 'react';
import { TerrixLogo } from './TerrixLogo';
import { apiService } from '../services/api';
import type { User } from '../types';
import { LogIn, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';


interface LoginScreenProps {
  onLoginSuccess: (token: string, user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isSeeding, setIsSeeding] = useState(false);

  // Login state
  const [loginUser, setLoginUser] = useState('superadmin');
  const [loginPassword, setLoginPassword] = useState('SuperSecurePassword123!');

  // Seed state
  const [seedUser, setSeedUser] = useState('superadmin');
  const [seedEmail, setSeedEmail] = useState('admin@pbx.com');
  const [seedPassword, setSeedPassword] = useState('SuperSecurePassword123!');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await apiService.login({
        username_or_email: loginUser,
        password: loginPassword,
      });
      onLoginSuccess(res.access_token, res.user);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

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
      setMessage({ type: 'success', text: `SuperAdmin seeded successfully! User ID: ${res.user_id}` });
      setIsSeeding(false);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="loginScreen">
      <div className="login-box">
        {/* Left Visual Pane */}
        <div className="login-visual">
          <div className="space-y-6 text-left">
            <TerrixLogo size="large" />
            
            <div className="space-y-2 mt-6">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Enterprise Multi-Tenant PBX
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Powered by FreeSWITCH 1.10.x, FastAPI control plane, dynamic mod_xml_curl directory routing, and WebRTC endpoints.
              </p>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-slate-700/60 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF5430] shrink-0" />
                <span>100% Isolated Tenant Domains</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span>Dynamic SIP Directory XML Generation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                <span>SIP Softphone & WebRTC Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Area */}
        <div className="login-form-area">
          <div className="login-form">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-[#FFF0EC] text-[#FF5430]">
                {isSeeding ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
              </div>
              <h1 className="login-title mb-0">
                {isSeeding ? 'Bootstrap SuperAdmin' : 'Log In'}
              </h1>
            </div>

            <div className="login-subtitle">
              {isSeeding
                ? 'Create the platform Super Admin account for initial setup.'
                : 'Enter your credentials to access the Terrix AI PBX engine securely.'}
            </div>

            {message && (
              <div
                className={`p-3.5 mb-4 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{message.text}</span>
              </div>
            )}

            {!isSeeding ? (
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label">Username or Email</label>
                  <input
                    type="text"
                    className="form-control"
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    placeholder="Enter your username or email"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <button type="submit" disabled={loading} className="login-submit">
                  {loading ? 'Authenticating...' : 'Log In'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSeed}>
                <div className="mb-3">
                  <label className="form-label">Super Admin Username</label>
                  <input
                    type="text"
                    className="form-control"
                    value={seedUser}
                    onChange={(e) => setSeedUser(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={seedEmail}
                    onChange={(e) => setSeedEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={seedPassword}
                    onChange={(e) => setSeedPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" disabled={loading} className="login-submit">
                  {loading ? 'Seeding Account...' : 'Seed SuperAdmin Account'}
                </button>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setIsSeeding(!isSeeding)}
                className="text-xs font-bold text-[#FF5430] hover:underline bg-transparent border-0 cursor-pointer"
              >
                {isSeeding ? '← Back to Login' : 'Need to bootstrap SuperAdmin account? Click here'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
