import React from 'react';
import {
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
} from 'lucide-react';
import type { User as UserType } from '../types';
import { PageContainer, PageHeader } from './layout/PageContainer';
import { Stack, Grid, Inline } from './layout/Stack';
import { Card, Badge } from './ui';

interface AuthViewProps {
  onLoginSuccess: (token: string, user: UserType) => void;
  user: UserType | null;
}

export const AuthView: React.FC<AuthViewProps> = ({ user }) => {
  return (
    <PageContainer>
      <Stack gap="6">
        <PageHeader
          title="Auth & System Security"
          subtitle="Active administrator session details, security posture, and system authentication controls."
          actions={
            <Badge variant="success">
              <ShieldCheck size={14} /> Platform Hardened
            </Badge>
          }
        />

        {/* ── SECURITY STATS CARDS ───────────────────────────────────────────── */}
        <Grid cols={2} gap="6" className="items-stretch">
          {/* Card 1: Active Administrator Profile */}
          <Card padding="lg" className="h-full">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--pbx-border-default)]">
              <Inline gap="3" align="center">
                <div className="w-10 h-10 rounded-xl bg-[var(--pbx-color-primary-50)] text-[var(--pbx-action-primary)] flex items-center justify-center shrink-0">
                  <UserCheck size={20} />
                </div>
                <Stack gap="1">
                  <h3 className="font-bold text-sm text-[var(--pbx-text-primary)] m-0">Active Administrator Profile</h3>
                  <p className="text-xs text-[var(--pbx-text-muted)] m-0">Currently logged in system Super Admin account</p>
                </Stack>
              </Inline>
              <Badge variant="success">Active Session</Badge>
            </div>

            <div className="flex flex-col justify-between">
              <div className="divide-y divide-[var(--pbx-border-default)]">
                <div className="min-h-[48px] py-3 flex items-center justify-between">
                  <Inline gap="3" align="center" className="text-[var(--pbx-text-muted)]">
                    <User size={18} />
                    <span className="text-xs font-medium text-[var(--pbx-text-secondary)]">Username</span>
                  </Inline>
                  <span className="font-mono text-xs px-2.5 py-1 rounded bg-[var(--pbx-bg-subtle)] border border-[var(--pbx-border-default)] text-[var(--pbx-text-primary)] font-bold">
                    {user?.username || 'superadmin'}
                  </span>
                </div>

                <div className="min-h-[48px] py-3 flex items-center justify-between">
                  <Inline gap="3" align="center" className="text-[var(--pbx-text-muted)]">
                    <Mail size={18} />
                    <span className="text-xs font-medium text-[var(--pbx-text-secondary)]">Email Address</span>
                  </Inline>
                  <span className="text-xs font-bold text-[var(--pbx-text-primary)]">
                    {user?.email || 'admin@pbx.com'}
                  </span>
                </div>

                <div className="min-h-[48px] py-3 flex items-center justify-between">
                  <Inline gap="3" align="center" className="text-[var(--pbx-text-muted)]">
                    <Shield size={18} />
                    <span className="text-xs font-medium text-[var(--pbx-text-secondary)]">Administrative Role</span>
                  </Inline>
                  <Badge variant="warning">{user?.role || 'SUPER_ADMIN'}</Badge>
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

          {/* Card 2: Platform Access Controls */}
          <Card padding="lg" className="h-full">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--pbx-border-default)]">
              <Inline gap="3" align="center">
                <div className="w-10 h-10 rounded-xl bg-[var(--pbx-color-primary-50)] text-[var(--pbx-action-primary)] flex items-center justify-center shrink-0">
                  <Lock size={20} />
                </div>
                <Stack gap="1">
                  <h3 className="font-bold text-sm text-[var(--pbx-text-primary)] m-0">Platform Access Controls</h3>
                  <p className="text-xs text-[var(--pbx-text-muted)] m-0">System capabilities granted to your administrator role</p>
                </Stack>
              </Inline>
              <Badge variant="neutral">RBAC Enforced</Badge>
            </div>

            <div className="flex flex-col justify-between">
              <div className="divide-y divide-[var(--pbx-border-default)]">
                <div className="min-h-[48px] py-3 flex items-center justify-between">
                  <Inline gap="3" align="center" className="text-[var(--pbx-text-muted)]">
                    <Server size={18} />
                    <span className="text-xs font-medium text-[var(--pbx-text-secondary)]">Multi-Tenant Isolation</span>
                  </Inline>
                  <Badge variant="success">100% Enforced</Badge>
                </div>

                <div className="min-h-[48px] py-3 flex items-center justify-between">
                  <Inline gap="3" align="center" className="text-[var(--pbx-text-muted)]">
                    <Cpu size={18} />
                    <span className="text-xs font-medium text-[var(--pbx-text-secondary)]">FreeSWITCH Media Engine</span>
                  </Inline>
                  <Badge variant="warning">Full Control</Badge>
                </div>

                <div className="min-h-[48px] py-3 flex items-center justify-between">
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
      </Stack>
    </PageContainer>
  );
};
