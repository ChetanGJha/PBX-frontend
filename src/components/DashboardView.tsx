import React from 'react';
import { Building2, Phone, Server, Hash, ArrowLeftRight, GitBranch, List, BarChart2, Voicemail } from 'lucide-react';
import type { SystemStatus, User } from '../types';
import { PageHeader, StatCard, Card, Button, Heading, Text } from './ui';

interface DashboardViewProps {
  status: SystemStatus;
  user: User | null;
  tenantCount: number;
  extensionCount: number;
  didCount: number;
  gatewayCount: number;
  trunkCount?: number;
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  status,
  user,
  tenantCount,
  extensionCount,
  didCount,
  gatewayCount,
  trunkCount,
  setActiveTab,
}) => {
  const isSuper = user?.role === 'SUPER_ADMIN';

  const canAccessTab = (tab: string) => {
    if (!user) return false;
    const role = user.role || 'AGENT';
    if (role === 'SUPER_ADMIN') return true;
    if (tab === 'dashboard' || tab === 'help') return true;

    if (['tenants', 'users', 'trunks', 'dids', 'xmlcurl', 'auth'].includes(tab)) {
      return false;
    }

    if (role === 'SUB_ADMIN' || (user.allowed_modules && user.allowed_modules.length > 0)) {
      return (user.allowed_modules || []).includes(tab);
    }

    if (role === 'TENANT_ADMIN') {
      return [
        'tenant-users', 'extensions', 'tenant-dids', 'tenant-trunks', 'call-routing',
        'queues', 'hunt-groups', 'ivr', 'voicemail', 'call-forwarding',
        'audio-prompts', 'reports', 'help'
      ].includes(tab);
    }

    if (role === 'SUPERVISOR') {
      return ['extensions', 'tenant-dids', 'queues', 'voicemail', 'reports', 'help'].includes(tab);
    }

    if (role === 'AGENT') {
      return ['voicemail', 'call-forwarding', 'help'].includes(tab);
    }

    return false;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isSuper ? 'Platform Super Admin Dashboard' : 'Tenant PBX Dashboard'}
        subtitle={
          isSuper
            ? 'Global oversight of multi-tenant domains, FreeSWITCH media core, carrier gateways, and telephone number allocations.'
            : `Operational dashboard for ${user?.tenant_domain || 'your organization'}: manage extensions, inbound DIDs, auto-attendants, and call routing.`
        }
      />

      {/* ── STATS GRID ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isSuper ? (
          <>
            <div className="cursor-pointer" onClick={() => setActiveTab('tenants')}>
              <StatCard
                title="Platform Tenants"
                value={tenantCount}
                icon={<Building2 size={20} />}
                trend="+100% Isolated Domains"
              />
            </div>

            <div className="cursor-pointer" onClick={() => setActiveTab('dids')}>
              <StatCard
                title="Total Inbound DIDs"
                value={didCount}
                icon={<Hash size={20} />}
                trend="Global Inventory"
              />
            </div>

            <div className="cursor-pointer" onClick={() => setActiveTab('trunks')}>
              <StatCard
                title="SIP Trunks & Gateways"
                value={trunkCount !== undefined ? trunkCount : gatewayCount}
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
            <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ padding: '12px', backgroundColor: 'var(--pbx-color-primary-100)', color: 'var(--pbx-action-primary)', width: 'fit-content', borderRadius: 'var(--pbx-radius-lg)', marginBottom: '12px' }}>
                  <Building2 size={24} />
                </div>
                <Heading level={3}>Tenants Registry</Heading>
                <Text size="sm" variant="secondary" style={{ marginTop: '4px' }}>
                  Provision client tenant domains, extension quotas, and domain bindings.
                </Text>
              </div>
              <Button variant="primary" style={{ width: '100%' }} onClick={() => setActiveTab('tenants')}>
                Manage Tenants
              </Button>
            </Card>

            <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ padding: '12px', backgroundColor: 'var(--pbx-color-info-50)', color: 'var(--pbx-color-info-700)', width: 'fit-content', borderRadius: 'var(--pbx-radius-lg)', marginBottom: '12px' }}>
                  <Hash size={24} />
                </div>
                <Heading level={3}>DID Inventory</Heading>
                <Text size="sm" variant="secondary" style={{ marginTop: '4px' }}>
                  Manage pool of telephone numbers and allocate them to tenant domains.
                </Text>
              </div>
              <Button variant="primary" style={{ width: '100%' }} onClick={() => setActiveTab('dids')}>
                Manage DIDs
              </Button>
            </Card>

            <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ padding: '12px', backgroundColor: 'var(--pbx-color-indigo-50)', color: 'var(--pbx-color-indigo-700)', width: 'fit-content', borderRadius: 'var(--pbx-radius-lg)', marginBottom: '12px' }}>
                  <ArrowLeftRight size={24} />
                </div>
                <Heading level={3}>SIP Trunks & Gateways</Heading>
                <Text size="sm" variant="secondary" style={{ marginTop: '4px' }}>
                  Configure upstream carrier Sofia gateways, outbound proxies, and codecs.
                </Text>
              </div>
              <Button variant="primary" style={{ width: '100%' }} onClick={() => setActiveTab('trunks')}>
                Configure Trunks
              </Button>
            </Card>
          </>
        ) : (
          <>
            {canAccessTab('extensions') && (
              <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <div style={{ padding: '12px', backgroundColor: 'var(--pbx-color-primary-100)', color: 'var(--pbx-action-primary)', width: 'fit-content', borderRadius: 'var(--pbx-radius-lg)', marginBottom: '12px' }}>
                    <Phone size={24} />
                  </div>
                  <Heading level={3}>Extension Management</Heading>
                  <Text size="sm" variant="secondary" style={{ marginTop: '4px' }}>
                    View and manage SIP & WebRTC softphone credentials and extension status.
                  </Text>
                </div>
                <Button variant="primary" style={{ width: '100%' }} onClick={() => setActiveTab('extensions')}>
                  Manage Extensions
                </Button>
              </Card>
            )}

            {(canAccessTab('ivr') || canAccessTab('call-routing')) && (
              <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <div style={{ padding: '12px', backgroundColor: 'var(--pbx-color-info-50)', color: 'var(--pbx-color-info-700)', width: 'fit-content', borderRadius: 'var(--pbx-radius-lg)', marginBottom: '12px' }}>
                    <GitBranch size={24} />
                  </div>
                  <Heading level={3}>Call Routing & IVR</Heading>
                  <Text size="sm" variant="secondary" style={{ marginTop: '4px' }}>
                    Design visual drag-and-drop auto-attendants and map inbound DIDs to departments.
                  </Text>
                </div>
                <Button variant="primary" style={{ width: '100%' }} onClick={() => setActiveTab(canAccessTab('ivr') ? 'ivr' : 'call-routing')}>
                  {canAccessTab('ivr') ? 'Design IVR Flow' : 'View Call Routing'}
                </Button>
              </Card>
            )}

            {(canAccessTab('queues') || canAccessTab('hunt-groups')) && (
              <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <div style={{ padding: '12px', backgroundColor: 'var(--pbx-color-success-50)', color: 'var(--pbx-color-success-700)', width: 'fit-content', borderRadius: 'var(--pbx-radius-lg)', marginBottom: '12px' }}>
                    <List size={24} />
                  </div>
                  <Heading level={3}>Call Queues & Hunt Groups</Heading>
                  <Text size="sm" variant="secondary" style={{ marginTop: '4px' }}>
                    Manage agent queues, ring groups, and call distribution strategies.
                  </Text>
                </div>
                <Button variant="primary" style={{ width: '100%' }} onClick={() => setActiveTab(canAccessTab('queues') ? 'queues' : 'hunt-groups')}>
                  {canAccessTab('queues') ? 'Manage Queues' : 'Manage Hunt Groups'}
                </Button>
              </Card>
            )}

            {canAccessTab('reports') && (
              <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <div style={{ padding: '12px', backgroundColor: 'var(--pbx-color-warning-50)', color: 'var(--pbx-color-warning-700)', width: 'fit-content', borderRadius: 'var(--pbx-radius-lg)', marginBottom: '12px' }}>
                    <BarChart2 size={24} />
                  </div>
                  <Heading level={3}>CDR & Analytics</Heading>
                  <Text size="sm" variant="secondary" style={{ marginTop: '4px' }}>
                    View call detail records, call logs, and performance analytics.
                  </Text>
                </div>
                <Button variant="primary" style={{ width: '100%' }} onClick={() => setActiveTab('reports')}>
                  View CDR & Reports
                </Button>
              </Card>
            )}

            {(canAccessTab('voicemail') || canAccessTab('call-forwarding')) && (
              <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <div style={{ padding: '12px', backgroundColor: 'var(--pbx-color-indigo-50)', color: 'var(--pbx-color-indigo-700)', width: 'fit-content', borderRadius: 'var(--pbx-radius-lg)', marginBottom: '12px' }}>
                    <Voicemail size={24} />
                  </div>
                  <Heading level={3}>Voicemail & Forwarding</Heading>
                  <Text size="sm" variant="secondary" style={{ marginTop: '4px' }}>
                    Manage extension voicemail boxes, PINs, and call forwarding rules.
                  </Text>
                </div>
                <Button variant="primary" style={{ width: '100%' }} onClick={() => setActiveTab(canAccessTab('voicemail') ? 'voicemail' : 'call-forwarding')}>
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
