import React, { useState } from 'react';
import { TerrixLogo } from './TerrixLogo';
import { apiService } from '../services/api';
import type { User } from '../types';
import { LogIn, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';

// Design System imports
import { Button, Input, FormField } from './ui';

interface LoginScreenProps {
  onLoginSuccess: (token: string, user: User) => void;
  initialMessage?: { text: string; type: 'success' | 'error' } | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, initialMessage }) => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(initialMessage || null);

  // Login form state
  const [loginUser, setLoginUser] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Seed form state
  const [seedUser, setSeedUser] = useState('superadmin');
  const [seedEmail, setSeedEmail] = useState('admin@pbx.local');
  const [seedPassword, setSeedPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await apiService.login({ username_or_email: loginUser, password: loginPassword });
      onLoginSuccess(res.access_token, res.user);
    } catch (err: any) {
      setMessage({
        text: err.message || 'Invalid username or password. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await apiService.seedSuperAdmin({
        username: seedUser,
        email: seedEmail,
        password: seedPassword
      });
      setMessage({
        text: 'SuperAdmin account bootstrapped successfully! You can now log in.',
        type: 'success'
      });
      setIsSeeding(false);
      setLoginUser(seedUser);
    } catch (err: any) {
      setMessage({
        text: err.message || 'Failed to bootstrap SuperAdmin account.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-screen-wrap">
      <div className="login-card">
        {/* Left Visual Area */}
        <div className="login-visual-area">
          <div className="login-visual-content">
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
                <span className="w-2 h-2 rounded-full bg-[var(--pbx-accent-primary)] shrink-0" />
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
              <div className="p-2 rounded-lg bg-[var(--pbx-color-primary-100)] text-[var(--pbx-action-primary)]">
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
                <FormField label="Username or Email" required>
                  <Input
                    type="text"
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    placeholder="Enter your username or email"
                    required
                  />
                </FormField>

                <FormField label="Password" required>
                  <Input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </FormField>

                <Button
                  type="submit"
                  isLoading={loading}
                  variant="primary"
                  size="lg"
                  className="w-full mt-2"
                >
                  Log In
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSeed}>
                <FormField label="Super Admin Username" required>
                  <Input
                    type="text"
                    value={seedUser}
                    onChange={(e) => setSeedUser(e.target.value)}
                    required
                  />
                </FormField>

                <FormField label="Email Address" required>
                  <Input
                    type="email"
                    value={seedEmail}
                    onChange={(e) => setSeedEmail(e.target.value)}
                    required
                  />
                </FormField>

                <FormField label="Password" required>
                  <Input
                    type="password"
                    value={seedPassword}
                    onChange={(e) => setSeedPassword(e.target.value)}
                    required
                  />
                </FormField>

                <Button
                  type="submit"
                  isLoading={loading}
                  variant="primary"
                  size="lg"
                  className="w-full mt-2"
                >
                  Seed SuperAdmin Account
                </Button>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setIsSeeding(!isSeeding)}
                className="text-xs font-bold text-[var(--pbx-accent-primary)] hover:underline bg-transparent border-0 cursor-pointer"
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
