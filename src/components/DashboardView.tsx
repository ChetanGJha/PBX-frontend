import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import type { SystemStatus, User } from '../types';
import {
  Building2,
  Phone,
  ArrowLeftRight,
  Server,
  Hash,
  GitBranch,
  CheckCircle,
  AlertCircle,
  Activity,
  Cpu,
  HardDrive,
  TrendingUp,
  PhoneIncoming,
  PhoneOutgoing
} from 'lucide-react';

import { PageContainer, PageHeader } from './layout/PageContainer';
import { Stack, Grid, Inline } from './layout/Stack';
import { Card, StatCard, Heading, Text, Badge, IconTile } from './ui';

interface DashboardMetrics {
  system_utilization: {
    cpu_percent: number;
    memory_percent: number;
    disk_percent: number;
  };
  counts: {
    tenants: number;
    carriers: number;
    extensions: number;
    dids: number;
    queues_and_ivrs: number;
  };
  live_calls: number;
  traffic_summary: {
    inbound: { total: number; answered: number; unanswered: number; failed: number };
    outbound: { total: number; answered: number; unanswered: number; failed: number };
  };
  traffic_peak: {
    inbound_peak: number;
    outbound_peak: number;
  };
}

interface DashboardViewProps {
  token: string;
  user?: User | null;
  tenantCount?: number;
  extensionCount?: number;
  didCount?: number;
  gatewayCount?: number;
  trunkCount?: number;
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ token, user, setActiveTab }) => {
  const [status, setStatus] = useState<SystemStatus>({
    healthy: false,
    ready: false,
    database: 'disconnected',
    redis: 'disconnected'
  });
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await apiService.checkHealth();
        setStatus(data);
      } catch {
        setStatus({ healthy: false, ready: false, database: 'disconnected', redis: 'disconnected' });
      }
    };

    const fetchMetrics = async () => {
      try {
        const data = await apiService.getDashboardMetrics(token);
        setMetrics(data);
      } catch (err) {
        console.error('Failed to fetch dashboard metrics:', err);
      }
    };

    fetchStatus();
    fetchMetrics();
  }, [token]);

  const isSuper = user?.role === 'SUPER_ADMIN';

  return (
    <PageContainer>
      <Stack gap="6">
        {/* ── HEADER ───────────────────────────────────────────────────────────── */}
        <PageHeader
          title={isSuper ? 'Global System Administration' : `Tenant Dashboard (${(user as any)?.tenant_name || user?.tenant_domain || 'Tenant Domain'})`}
          subtitle="Platform health, real-time telephony status, and resource usage overview."
          actions={
            <Badge variant={status.database === 'connected' ? 'success' : 'danger'}>
              {status.database === 'connected' ? (
                <span className="flex items-center gap-1.5"><CheckCircle size={14} /> PBX Engine Online</span>
              ) : (
                <span className="flex items-center gap-1.5"><AlertCircle size={14} /> PBX Engine Offline</span>
              )}
            </Badge>
          }
        />

        {/* ── TOP STAT CARDS ────────────────────────────────────────────────────── */}
        <Grid cols={4} gap="6">
          {isSuper ? (
            <>
              <div className="cursor-pointer h-full" onClick={() => setActiveTab('tenants')}>
                <StatCard
                  title="Number of Tenants"
                  value={metrics?.counts.tenants ?? 0}
                  icon={<Building2 size={20} />}
                  trend="Multi-Tenant Organizations"
                />
              </div>

              <div className="cursor-pointer h-full" onClick={() => setActiveTab('trunks')}>
                <StatCard
                  title="Number of Carriers"
                  value={metrics?.counts.carriers ?? 0}
                  icon={<ArrowLeftRight size={20} />}
                  trend="Sofia Gateways + SIP Trunks"
                />
              </div>

              <StatCard
                title="Live Calls on Platform"
                value={metrics?.live_calls ?? 0}
                icon={<Activity size={20} />}
                trend="Active Real-Time Channels"
              />

              <StatCard
                title="PBX Engine Status"
                value={status.database === 'connected' ? 'Connected' : 'Offline'}
                icon={<Server size={20} />}
                trend="FreeSWITCH 1.10 Core Active"
              />
            </>
          ) : (
            <>
              <div className="cursor-pointer h-full" onClick={() => setActiveTab('extensions')}>
                <StatCard
                  title="Number of Extensions"
                  value={metrics?.counts.extensions ?? 0}
                  icon={<Phone size={20} />}
                  trend="SIP & WebRTC Endpoints"
                />
              </div>

              <div className="cursor-pointer h-full" onClick={() => setActiveTab('dids')}>
                <StatCard
                  title="Assigned DIDs"
                  value={metrics?.counts.dids ?? 0}
                  icon={<Hash size={20} />}
                  trend="Inbound Numbers Pool"
                />
              </div>

              <div className="cursor-pointer h-full" onClick={() => setActiveTab('queues')}>
                <StatCard
                  title="Queues & IVRs"
                  value={metrics?.counts.queues_and_ivrs ?? 0}
                  icon={<GitBranch size={20} />}
                  trend="Call Queues & Auto-Attendants"
                />
              </div>

              <StatCard
                title="Active Tenant Calls"
                value={metrics?.live_calls ?? 0}
                icon={<Activity size={20} />}
                trend="Current Live Sessions"
              />
            </>
          )}
        </Grid>

        {/* ── SYSTEM UTILIZATION WIDGET (Superadmin) ──────────────────────────── */}
        {isSuper && (
          <Card className="p-6">
            <Stack gap="4">
              <Inline justify="between" align="center">
                <div>
                  <Heading level={3}>System Utilization</Heading>
                  <Text size="sm" variant="secondary">Live CPU, RAM, and storage health telemetry</Text>
                </div>
                <Badge variant="info">Host Node Performance</Badge>
              </Inline>
              <Grid cols={3} gap="6">
                <div className="p-4 rounded-lg bg-[var(--pbx-bg-subtle)] border border-[var(--pbx-border-default)]">
                  <Inline justify="between" align="center" className="mb-2">
                    <span className="text-sm font-semibold text-[var(--pbx-text-primary)] flex items-center gap-2">
                      <Cpu size={16} /> CPU Utilization
                    </span>
                    <Badge variant={(metrics?.system_utilization.cpu_percent ?? 0) > 85 ? 'danger' : 'success'}>
                      {metrics?.system_utilization.cpu_percent ?? 0}%
                    </Badge>
                  </Inline>
                  <div className="w-full bg-[var(--pbx-border-default)] h-2 rounded-full overflow-hidden">
                    <div
                      className={`bg-[var(--pbx-accent)] h-full transition-all duration-300 w-[${Math.min(Math.max(Math.round(metrics?.system_utilization.cpu_percent ?? 0), 0), 100)}%]`}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[var(--pbx-bg-subtle)] border border-[var(--pbx-border-default)]">
                  <Inline justify="between" align="center" className="mb-2">
                    <span className="text-sm font-semibold text-[var(--pbx-text-primary)] flex items-center gap-2">
                      <Activity size={16} /> Memory Utilization
                    </span>
                    <Badge variant={(metrics?.system_utilization.memory_percent ?? 0) > 85 ? 'danger' : 'info'}>
                      {metrics?.system_utilization.memory_percent ?? 0}%
                    </Badge>
                  </Inline>
                  <div className="w-full bg-[var(--pbx-border-default)] h-2 rounded-full overflow-hidden">
                    <div
                      className={`bg-[var(--pbx-primary)] h-full transition-all duration-300 w-[${Math.min(Math.max(Math.round(metrics?.system_utilization.memory_percent ?? 0), 0), 100)}%]`}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[var(--pbx-bg-subtle)] border border-[var(--pbx-border-default)]">
                  <Inline justify="between" align="center" className="mb-2">
                    <span className="text-sm font-semibold text-[var(--pbx-text-primary)] flex items-center gap-2">
                      <HardDrive size={16} /> Disk Space
                    </span>
                    <Badge variant={(metrics?.system_utilization.disk_percent ?? 0) > 85 ? 'danger' : 'neutral'}>
                      {metrics?.system_utilization.disk_percent ?? 0}%
                    </Badge>
                  </Inline>
                  <div className="w-full bg-[var(--pbx-border-default)] h-2 rounded-full overflow-hidden">
                    <div
                      className={`bg-[var(--pbx-accent)] h-full transition-all duration-300 w-[${Math.min(Math.max(Math.round(metrics?.system_utilization.disk_percent ?? 0), 0), 100)}%]`}
                    />
                  </div>
                </div>
              </Grid>
            </Stack>
          </Card>
        )}

        {/* ── TRAFFIC SUMMARY & TRAFFIC PEAK WIDGETS ──────────────────────────── */}
        <Grid cols={2} gap="6">
          {/* Traffic Summary */}
          <Card className="p-6">
            <Stack gap="4">
              <Inline justify="between" align="center">
                <div>
                  <Heading level={3}>Traffic Summary</Heading>
                  <Text size="sm" variant="secondary">Inbound and Outbound answered, failed & unanswered breakdown</Text>
                </div>
                <Badge variant="primary">Call Telemetry</Badge>
              </Inline>

              <Grid cols={2} gap="4">
                {/* Inbound Summary */}
                <div className="p-4 rounded-lg bg-[var(--pbx-bg-subtle)] border border-[var(--pbx-border-default)]">
                  <div className="flex items-center gap-2 mb-3">
                    <IconTile icon={<PhoneIncoming size={16} />} />
                    <span className="font-bold text-sm text-[var(--pbx-text-primary)]">Inbound Calls</span>
                  </div>
                  <div className="text-2xl font-bold text-[var(--pbx-text-primary)] mb-3">
                    {metrics?.traffic_summary.inbound.total ?? 0}
                  </div>
                  <Stack gap="1">
                    <Inline justify="between" className="text-xs">
                      <span className="text-[var(--pbx-text-secondary)]">Answered:</span>
                      <Badge variant="success">{metrics?.traffic_summary.inbound.answered ?? 0}</Badge>
                    </Inline>
                    <Inline justify="between" className="text-xs">
                      <span className="text-[var(--pbx-text-secondary)]">Unanswered:</span>
                      <Badge variant="warning">{metrics?.traffic_summary.inbound.unanswered ?? 0}</Badge>
                    </Inline>
                    <Inline justify="between" className="text-xs">
                      <span className="text-[var(--pbx-text-secondary)]">Failed:</span>
                      <Badge variant="danger">{metrics?.traffic_summary.inbound.failed ?? 0}</Badge>
                    </Inline>
                  </Stack>
                </div>

                {/* Outbound Summary */}
                <div className="p-4 rounded-lg bg-[var(--pbx-bg-subtle)] border border-[var(--pbx-border-default)]">
                  <div className="flex items-center gap-2 mb-3">
                    <IconTile icon={<PhoneOutgoing size={16} />} />
                    <span className="font-bold text-sm text-[var(--pbx-text-primary)]">Outbound Calls</span>
                  </div>
                  <div className="text-2xl font-bold text-[var(--pbx-text-primary)] mb-3">
                    {metrics?.traffic_summary.outbound.total ?? 0}
                  </div>
                  <Stack gap="1">
                    <Inline justify="between" className="text-xs">
                      <span className="text-[var(--pbx-text-secondary)]">Answered:</span>
                      <Badge variant="success">{metrics?.traffic_summary.outbound.answered ?? 0}</Badge>
                    </Inline>
                    <Inline justify="between" className="text-xs">
                      <span className="text-[var(--pbx-text-secondary)]">Unanswered:</span>
                      <Badge variant="warning">{metrics?.traffic_summary.outbound.unanswered ?? 0}</Badge>
                    </Inline>
                    <Inline justify="between" className="text-xs">
                      <span className="text-[var(--pbx-text-secondary)]">Failed:</span>
                      <Badge variant="danger">{metrics?.traffic_summary.outbound.failed ?? 0}</Badge>
                    </Inline>
                  </Stack>
                </div>
              </Grid>
            </Stack>
          </Card>

          {/* Traffic Peak */}
          <Card className="p-6">
            <Stack gap="4">
              <Inline justify="between" align="center">
                <div>
                  <Heading level={3}>Traffic Peak</Heading>
                  <Text size="sm" variant="secondary">Peak hourly channel concurrency limits</Text>
                </div>
                <Badge variant="neutral">30-Day Analysis</Badge>
              </Inline>

              <Grid cols={2} gap="4">
                <div className="p-4 rounded-lg bg-[var(--pbx-bg-subtle)] border border-[var(--pbx-border-default)] flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <IconTile icon={<TrendingUp size={16} />} />
                      <span className="font-bold text-sm text-[var(--pbx-text-primary)]">Inbound Peak</span>
                    </div>
                    <div className="text-3xl font-extrabold text-[var(--pbx-text-primary)] my-2">
                      {metrics?.traffic_peak.inbound_peak ?? 0}
                      <span className="text-xs font-normal text-[var(--pbx-text-muted)] ml-1.5">concurrent calls</span>
                    </div>
                  </div>
                  <Text size="xs" variant="secondary">Highest simultaneous inbound call spike</Text>
                </div>

                <div className="p-4 rounded-lg bg-[var(--pbx-bg-subtle)] border border-[var(--pbx-border-default)] flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <IconTile icon={<TrendingUp size={16} />} />
                      <span className="font-bold text-sm text-[var(--pbx-text-primary)]">Outbound Peak</span>
                    </div>
                    <div className="text-3xl font-extrabold text-[var(--pbx-text-primary)] my-2">
                      {metrics?.traffic_peak.outbound_peak ?? 0}
                      <span className="text-xs font-normal text-[var(--pbx-text-muted)] ml-1.5">concurrent calls</span>
                    </div>
                  </div>
                  <Text size="xs" variant="secondary">Highest simultaneous outbound channel spike</Text>
                </div>
              </Grid>
            </Stack>
          </Card>
        </Grid>
      </Stack>
    </PageContainer>
  );
};
