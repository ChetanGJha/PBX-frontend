import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import type { SystemStatus, User } from '../types';
import {
  Building2,
  Users,
  Phone,
  ArrowLeftRight,
  Server,
  Hash,
  GitBranch,
  List,
  BarChart2,
  Voicemail,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Design System imports
import { PageHeader } from './layout/PageHeader';
import { Card, StatCard, Heading, Text, Button, Badge } from './ui';

interface DashboardViewProps {
  token: string;
  user?: User | null;
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ token, user, setActiveTab }) => {
  const [status, setStatus] = useState<SystemStatus>({ database: 'disconnected' });
  const [tenantCount, setTenantCount] = useState<number>(0);
  const [userCount, setUserCount] = useState<number>(0);
  const [extensionCount, setExtensionCount] = useState<number>(0);
  const [gatewayCount, setGatewayCount] = useState<number>(0);
  const [didCount, setDidCount] = useState<number>(0);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await apiService.getHealth();
        setStatus(data);
      } catch {
        setStatus({ database: 'error' });
      }
    };

    const fetchMetrics = async () => {
      try {
        if (user?.role === 'SUPER_ADMIN') {
          const tenants = await apiService.getTenants(token);
          setTenantCount(tenants.length);
          const usersList = await apiService.getUsers(token);
          setUserCount(usersList.length);
        }
        const extList = await apiService.getExtensions(token);
        setExtensionCount(extList.length);
        const gwList = await apiService.getGateways(token);
        setGatewayCount(gwList.length);
        const didList = await apiService.getDids(token);
        setDidCount(didList.length);
      } catch (err) {
        console.error('Failed to fetch dashboard metrics:', err);
      }
    };

    fetchStatus();
    fetchMetrics();
  }, [token, user]);

  const isSuper = user?.role === 'SUPER_ADMIN';

  const canAccessTab = (modId: string) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN' || user.role === 'TENANT_ADMIN') return true;
    if (user.role === 'SUB_ADMIN') {
      return (user.allowed_modules || []).includes(modId);
    }
    return false;
  };

  return (
    <div className="space-y-8">
      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <PageHeader
        title={isSuper ? 'Global System Administration' : `Tenant Dashboard (${user?.tenant_name || user?.tenant_domain || 'Tenant Domain'})`}
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

      {/* ── METRICS GRID ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isSuper ? (
          <>
            <div className="cursor-pointer" onClick={() => setActiveTab('tenants')}>
              <StatCard
                title="Active Tenants"
                value={tenantCount}
                icon={<Building2 size={20} />}
                trend="Multi-Tenant Domain Isolations"
              />
            </div>

            <div className="cursor-pointer" onClick={() => setActiveTab('users')}>
              <StatCard
                title="Total Users"
                value={userCount}
                icon={<Users size={20} />}
                trend="RBAC Platform Accounts"
              />
            </div>

            <div className="cursor-pointer" onClick={() => setActiveTab('trunks')}>
              <StatCard
                title="Carrier Trunks"
                value={gatewayCount}
                icon={<ArrowLeftRight size={20} />}
                trend="Active Carrier Routes"
              />
            </div>

            <StatCard
              title="Media Core & DB"
              value={status.database === 'connected' ? 'Connected' : 'Offline'}
              icon={<Server size={20} />}
              trend="FreeSWITCH 1.10.x Active"
            />
          </>
        ) : (
          <>
            <div className="cursor-pointer" onClick={() => setActiveTab('extensions')}>
              <StatCard
                title="Active Extensions"
                value={extensionCount}
                icon={<Phone size={20} />}
                trend="SIP & WebRTC Active"
              />
            </div>

            <div className="cursor-pointer" onClick={() => setActiveTab('tenant-trunks')}>
              <StatCard
                title="Active Gateways"
                value={gatewayCount}
                icon={<ArrowLeftRight size={20} />}
                trend="Assigned In/Out Trunks"
              />
            </div>

            <StatCard
              title="Assigned DIDs"
              value={didCount}
              icon={<Hash size={20} />}
              trend="Inbound Phone Numbers"
            />

            <StatCard
              title="PBX Engine Status"
              value={status.database === 'connected' ? 'Operational' : 'Degraded'}
              icon={<Server size={20} />}
              trend="mod_xml_curl Ready"
            />
          </>
        )}
      </div>

      {/* ── QUICK NAVIGATION CARDS ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isSuper ? (
          <>
            <Card className="flex flex-col justify-between gap-4">
              <div>
                <div className="p-3 bg-[var(--pbx-color-primary-100)] text-[var(--pbx-action-primary)] w-fit rounded-lg mb-3">
                  <Building2 size={24} />
                </div>
                <Heading level={3}>Tenants Registry</Heading>
                <Text size="sm" variant="secondary" className="mt-1">
                  Provision client tenant domains, extension quotas, and domain bindings.
                </Text>
              </div>
              <Button variant="primary" className="w-full" onClick={() => setActiveTab('tenants')}>
                Manage Tenants
              </Button>
            </Card>

            <Card className="flex flex-col justify-between gap-4">
              <div>
                <div className="p-3 bg-[var(--pbx-color-info-50)] text-[var(--pbx-color-info-700)] w-fit rounded-lg mb-3">
                  <Hash size={24} />
                </div>
                <Heading level={3}>DID Inventory</Heading>
                <Text size="sm" variant="secondary" className="mt-1">
                  Manage pool of telephone numbers and allocate them to tenant domains.
                </Text>
              </div>
              <Button variant="primary" className="w-full" onClick={() => setActiveTab('dids')}>
                Manage DIDs
              </Button>
            </Card>

            <Card className="flex flex-col justify-between gap-4">
              <div>
                <div className="p-3 bg-[var(--pbx-color-indigo-50)] text-[var(--pbx-color-indigo-700)] w-fit rounded-lg mb-3">
                  <ArrowLeftRight size={24} />
                </div>
                <Heading level={3}>SIP Trunks & Gateways</Heading>
                <Text size="sm" variant="secondary" className="mt-1">
                  Configure upstream carrier Sofia gateways, outbound proxies, and codecs.
                </Text>
              </div>
              <Button variant="primary" className="w-full" onClick={() => setActiveTab('trunks')}>
                Configure Trunks
              </Button>
            </Card>
          </>
        ) : (
          <>
            {canAccessTab('extensions') && (
              <Card className="flex flex-col justify-between gap-4">
                <div>
                  <div className="p-3 bg-[var(--pbx-color-primary-100)] text-[var(--pbx-action-primary)] w-fit rounded-lg mb-3">
                    <Phone size={24} />
                  </div>
                  <Heading level={3}>Extension Management</Heading>
                  <Text size="sm" variant="secondary" className="mt-1">
                    View and manage SIP & WebRTC softphone credentials and extension status.
                  </Text>
                </div>
                <Button variant="primary" className="w-full" onClick={() => setActiveTab('extensions')}>
                  Manage Extensions
                </Button>
              </Card>
            )}

            {(canAccessTab('ivr') || canAccessTab('call-routing')) && (
              <Card className="flex flex-col justify-between gap-4">
                <div>
                  <div className="p-3 bg-[var(--pbx-color-info-50)] text-[var(--pbx-color-info-700)] w-fit rounded-lg mb-3">
                    <GitBranch size={24} />
                  </div>
                  <Heading level={3}>Call Routing & IVR</Heading>
                  <Text size="sm" variant="secondary" className="mt-1">
                    Design visual drag-and-drop auto-attendants and map inbound DIDs to departments.
                  </Text>
                </div>
                <Button variant="primary" className="w-full" onClick={() => setActiveTab(canAccessTab('ivr') ? 'ivr' : 'call-routing')}>
                  {canAccessTab('ivr') ? 'Design IVR Flow' : 'View Call Routing'}
                </Button>
              </Card>
            )}

            {(canAccessTab('queues') || canAccessTab('hunt-groups')) && (
              <Card className="flex flex-col justify-between gap-4">
                <div>
                  <div className="p-3 bg-[var(--pbx-color-success-50)] text-[var(--pbx-color-success-700)] w-fit rounded-lg mb-3">
                    <List size={24} />
                  </div>
                  <Heading level={3}>Call Queues & Hunt Groups</Heading>
                  <Text size="sm" variant="secondary" className="mt-1">
                    Manage agent queues, ring groups, and call distribution strategies.
                  </Text>
                </div>
                <Button variant="primary" className="w-full" onClick={() => setActiveTab(canAccessTab('queues') ? 'queues' : 'hunt-groups')}>
                  {canAccessTab('queues') ? 'Manage Queues' : 'Manage Hunt Groups'}
                </Button>
              </Card>
            )}

            {canAccessTab('reports') && (
              <Card className="flex flex-col justify-between gap-4">
                <div>
                  <div className="p-3 bg-[var(--pbx-color-warning-50)] text-[var(--pbx-color-warning-700)] w-fit rounded-lg mb-3">
                    <BarChart2 size={24} />
                  </div>
                  <Heading level={3}>CDR & Analytics</Heading>
                  <Text size="sm" variant="secondary" className="mt-1">
                    View call detail records, call logs, and performance analytics.
                  </Text>
                </div>
                <Button variant="primary" className="w-full" onClick={() => setActiveTab('reports')}>
                  View CDR & Reports
                </Button>
              </Card>
            )}

            {(canAccessTab('voicemail') || canAccessTab('call-forwarding')) && (
              <Card className="flex flex-col justify-between gap-4">
                <div>
                  <div className="p-3 bg-[var(--pbx-color-indigo-50)] text-[var(--pbx-color-indigo-700)] w-fit rounded-lg mb-3">
                    <Voicemail size={24} />
                  </div>
                  <Heading level={3}>Voicemail & Forwarding</Heading>
                  <Text size="sm" variant="secondary" className="mt-1">
                    Manage extension voicemail boxes, PINs, and call forwarding rules.
                  </Text>
                </div>
                <Button variant="primary" className="w-full" onClick={() => setActiveTab(canAccessTab('voicemail') ? 'voicemail' : 'call-forwarding')}>
                  {canAccessTab('voicemail') ? 'Voicemail Settings' : 'Call Forwarding'}
                </Button>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};
