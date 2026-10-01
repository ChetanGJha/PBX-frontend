import React, { useState } from 'react';
import {
  UserPlus,
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
} from 'lucide-react';
import { apiService } from '../services/api';
import type { User as UserType } from '../types';
import { PageContainer, PageHeader } from './layout/PageContainer';
import { Stack, Grid } from './layout/Stack';
import { Card, Button, Input, FormField, Alert, Badge } from './ui';

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
    <PageContainer>
      <Stack gap="6">
        <PageHeader
          title="Auth & System Security"
          subtitle="Active administrator session details, security posture, and platform seeding controls."
          actions={
            <Badge variant="success">
              <ShieldCheck size={14} /> Platform Hardened
            </Badge>
          }
        />

        {/* Status Alert Notification */}
        {message && (
          <Alert variant={message.type === 'success' ? 'success' : 'danger'}>
            {message.text}
          </Alert>
        )}

        {/* Grid: Active Admin Profile & Platform Access Controls */}
        <Grid cols={2} gap="6">
          {/* Active Super Admin Profile Card */}
          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--pbx-color-primary-100)] text-[var(--pbx-action-primary)] rounded-lg">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Active Administrator Profile</h3>
                    <p className="text-xs text-slate-500">Currently logged in system Super Admin account</p>
                  </div>
                </div>
                <Badge variant="success">Active Session</Badge>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500">
                    <User size={16} />
                    <span>Username</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {user?.username || 'superadmin'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Mail size={16} />
                    <span>Email Address</span>
                  </div>
                  <span className="font-medium text-slate-900">{user?.email || 'admin@pbx.com'}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Shield size={16} />
                    <span>Administrative Role</span>
                  </div>
                  <Badge variant="primary">{user?.role || 'SUPER_ADMIN'}</Badge>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Activity size={16} />
                    <span>Session Status</span>
                  </div>
                  <Badge variant="success">Active & Authenticated</Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Platform Access Controls Card */}
          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--pbx-bg-subtle)] text-[var(--pbx-text-primary)] rounded-lg">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Platform Access Controls</h3>
                    <p className="text-xs text-slate-500">System capabilities granted to your administrator role</p>
                  </div>
                </div>
                <Badge variant="neutral">RBAC Enforced</Badge>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Server size={16} className="text-[var(--pbx-accent-primary)]" />
                    <span>Multi-Tenant Isolation</span>
                  </div>
                  <Badge variant="success">100% Enforced</Badge>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Cpu size={16} className="text-[var(--pbx-accent-primary)]" />
                    <span>FreeSWITCH Media Engine</span>
                  </div>
                  <Badge variant="primary">Full Control</Badge>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Database size={16} className="text-emerald-600" />
                    <span>PostgreSQL & Redis DB</span>
                  </div>
                  <Badge variant="success">Connected</Badge>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-slate-500">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    <span>API Rate Limiting & Auth</span>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
            </div>
          </Card>
        </Grid>

        {/* Bootstrap Additional Admin Account Card */}
        <Card>
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-100">
            <div className="p-2 bg-[var(--pbx-color-primary-100)] text-[var(--pbx-action-primary)] rounded-lg">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Bootstrap Additional Platform Admin</h3>
              <p className="text-xs text-slate-500">Seed a new platform Super Admin account (`POST /api/v1/auth/seed-superadmin`)</p>
            </div>
          </div>

          <form onSubmit={handleSeed}>
            <Stack gap="6">
              <Grid cols={3} gap="4">
                <FormField label="Username" required>
                  <Input
                    type="text"
                    value={seedUser}
                    onChange={(e) => setSeedUser(e.target.value)}
                    placeholder="superadmin2"
                    leftIcon={<User size={16} />}
                    required
                  />
                </FormField>

                <FormField label="Email Address" required>
                  <Input
                    type="email"
                    value={seedEmail}
                    onChange={(e) => setSeedEmail(e.target.value)}
                    placeholder="admin2@pbx.com"
                    leftIcon={<Mail size={16} />}
                    required
                  />
                </FormField>

                <FormField label="Password" required>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={seedPassword}
                    onChange={(e) => setSeedPassword(e.target.value)}
                    placeholder="SuperSecurePassword123!"
                    leftIcon={<KeyRound size={16} />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="bg-transparent border-0 cursor-pointer p-0"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                    required
                  />
                </FormField>
              </Grid>

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <KeyRound size={16} className="text-[var(--pbx-accent-primary)]" />
                  <span>Seeds a root platform administrator with global configuration permissions.</span>
                </div>
                <Button type="submit" isLoading={loading} variant="primary">
                  <UserPlus size={16} />
                  <span>Seed Super Admin Account</span>
                </Button>
              </div>
            </Stack>
          </form>
        </Card>
      </Stack>
    </PageContainer>
  );
};
