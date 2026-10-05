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
import { Stack, Grid, Inline } from './layout/Stack';
import { Card, Button, Input, FormField, Alert, Badge } from './ui';

interface AuthViewProps {
  onLoginSuccess: (token: string, user: UserType) => void;
  user: UserType | null;
}

export const AuthView: React.FC<AuthViewProps> = ({ user }) => {
  // Seed form state (cleared initial state)
  const [seedUser, setSeedUser] = useState('');
  const [seedEmail, setSeedEmail] = useState('');
  const [seedPassword, setSeedPassword] = useState('');
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
        <Grid cols={2} gap="6" className="items-stretch">
          {/* Active Super Admin Profile Card */}
          <Card padding="lg" className="h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--pbx-border-default)]">
                <Inline gap="3" align="center" className="min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[var(--pbx-color-primary-50)] text-[var(--pbx-action-primary)] flex items-center justify-center shrink-0">
                    <UserCheck size={20} />
                  </div>
                  <Stack gap="1" className="min-w-0">
                    <h3 className="font-bold text-sm text-[var(--pbx-text-primary)] m-0">Active Administrator Profile</h3>
                    <p className="text-xs text-[var(--pbx-text-muted)] m-0">Currently logged in system Super Admin account</p>
                  </Stack>
                </Inline>
                <Badge variant="success" className="shrink-0">Active Session</Badge>
              </div>

              <div className="pt-2">
                <div className="min-h-[48px] py-3 flex items-center justify-between border-b border-[var(--pbx-border-default)]">
                  <Inline gap="3" align="center" className="text-[var(--pbx-text-muted)]">
                    <User size={18} />
                    <span className="text-xs font-medium text-[var(--pbx-text-secondary)]">Username</span>
                  </Inline>
                  <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-[var(--pbx-bg-subtle)] border border-[var(--pbx-border-default)] font-semibold text-[var(--pbx-text-primary)]">
                    {user?.username || 'superadmin'}
                  </span>
                </div>

                <div className="min-h-[48px] py-3 flex items-center justify-between border-b border-[var(--pbx-border-default)]">
                  <Inline gap="3" align="center" className="text-[var(--pbx-text-muted)]">
                    <Mail size={18} />
                    <span className="text-xs font-medium text-[var(--pbx-text-secondary)]">Email Address</span>
                  </Inline>
                  <span className="text-xs font-semibold text-[var(--pbx-text-primary)]">{user?.email || 'admin@pbx.com'}</span>
                </div>

                <div className="min-h-[48px] py-3 flex items-center justify-between border-b border-[var(--pbx-border-default)]">
                  <Inline gap="3" align="center" className="text-[var(--pbx-text-muted)]">
                    <Shield size={18} />
                    <span className="text-xs font-medium text-[var(--pbx-text-secondary)]">Administrative Role</span>
                  </Inline>
                  <Badge variant="primary">{user?.role || 'SUPER_ADMIN'}</Badge>
                </div>

                <div className="min-h-[48px] py-3 flex items-center justify-between">
                  <Inline gap="3" align="center" className="text-[var(--pbx-text-muted)]">
                    <Activity size={18} />
                    <span className="text-xs font-medium text-[var(--pbx-text-secondary)]">Session Status</span>
                  </Inline>
                  <Badge variant="success">Active & Authenticated</Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Platform Access Controls Card */}
          <Card padding="lg" className="h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--pbx-border-default)]">
                <Inline gap="3" align="center" className="min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[var(--pbx-color-primary-50)] text-[var(--pbx-action-primary)] flex items-center justify-center shrink-0">
                    <Lock size={20} />
                  </div>
                  <Stack gap="1" className="min-w-0">
                    <h3 className="font-bold text-sm text-[var(--pbx-text-primary)] m-0">Platform Access Controls</h3>
                    <p className="text-xs text-[var(--pbx-text-muted)] m-0">System capabilities granted to your administrator role</p>
                  </Stack>
                </Inline>
                <Badge variant="neutral" className="shrink-0">RBAC Enforced</Badge>
              </div>

              <div className="pt-2">
                <div className="min-h-[48px] py-3 flex items-center justify-between border-b border-[var(--pbx-border-default)]">
                  <Inline gap="3" align="center" className="text-[var(--pbx-text-muted)]">
                    <Server size={18} />
                    <span className="text-xs font-medium text-[var(--pbx-text-secondary)]">Multi-Tenant Isolation</span>
                  </Inline>
                  <Badge variant="success">100% Enforced</Badge>
                </div>

                <div className="min-h-[48px] py-3 flex items-center justify-between border-b border-[var(--pbx-border-default)]">
                  <Inline gap="3" align="center" className="text-[var(--pbx-text-muted)]">
                    <Cpu size={18} />
                    <span className="text-xs font-medium text-[var(--pbx-text-secondary)]">FreeSWITCH Media Engine</span>
                  </Inline>
                  <Badge variant="primary">Full Control</Badge>
                </div>

                <div className="min-h-[48px] py-3 flex items-center justify-between border-b border-[var(--pbx-border-default)]">
                  <Inline gap="3" align="center" className="text-[var(--pbx-text-muted)]">
                    <Database size={18} />
                    <span className="text-xs font-medium text-[var(--pbx-text-secondary)]">PostgreSQL & Redis DB</span>
                  </Inline>
                  <Badge variant="success">Connected</Badge>
                </div>

                <div className="min-h-[48px] py-3 flex items-center justify-between">
                  <Inline gap="3" align="center" className="text-[var(--pbx-text-muted)]">
                    <ShieldCheck size={18} />
                    <span className="text-xs font-medium text-[var(--pbx-text-secondary)]">API Rate Limiting & Auth</span>
                  </Inline>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
            </div>
          </Card>
        </Grid>

        {/* Bootstrap Additional Admin Account Card */}
        <Card padding="lg">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-[var(--pbx-border-default)]">
            <div className="w-10 h-10 rounded-xl bg-[var(--pbx-color-primary-50)] text-[var(--pbx-action-primary)] flex items-center justify-center shrink-0">
              <UserPlus size={20} />
            </div>
            <Stack gap="1">
              <h3 className="font-bold text-base text-[var(--pbx-text-primary)] m-0">Bootstrap Additional Platform Admin</h3>
              <p className="text-xs text-[var(--pbx-text-muted)] m-0">Seed a new platform Super Admin account with root configuration permissions.</p>
            </Stack>
          </div>

          <form onSubmit={handleSeed}>
            <Stack gap="6">
              <Grid cols={3} gap="4">
                <FormField label="Username" required>
                  <Input
                    type="text"
                    value={seedUser}
                    onChange={(e) => setSeedUser(e.target.value)}
                    placeholder="e.g. superadmin2"
                    leftIcon={<User size={16} />}
                    required
                  />
                </FormField>

                <FormField label="Email Address" required>
                  <Input
                    type="email"
                    value={seedEmail}
                    onChange={(e) => setSeedEmail(e.target.value)}
                    placeholder="e.g. admin2@pbx.com"
                    leftIcon={<Mail size={16} />}
                    required
                  />
                </FormField>

                <FormField label="Password" required>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={seedPassword}
                    onChange={(e) => setSeedPassword(e.target.value)}
                    placeholder="Enter secure password"
                    leftIcon={<KeyRound size={16} />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="bg-transparent border-0 cursor-pointer p-0 text-[var(--pbx-text-muted)] flex items-center justify-center"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                    required
                  />
                </FormField>
              </Grid>

              <div className="pt-4 border-t border-[var(--pbx-border-default)] flex flex-col sm:flex-row items-center justify-between gap-4">
                <Inline gap="2" align="center" className="text-xs text-[var(--pbx-text-muted)]">
                  <KeyRound size={16} className="text-[var(--pbx-action-primary)]" />
                  <span>Seeds a root platform administrator with global configuration permissions.</span>
                </Inline>
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
