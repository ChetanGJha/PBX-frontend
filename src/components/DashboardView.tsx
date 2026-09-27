import React from 'react';
import { Building2, Phone, Server, Hash, ArrowLeftRight, GitBranch, List, BarChart2, Voicemail } from 'lucide-react';
import type { SystemStatus, User } from '../types';

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
      {/* Page Header */}
      <div className="page-head">
        <div>
          <div className="eyebrow">{isSuper ? 'Platform Administration' : 'Tenant Operations'}</div>
          <h1 className="page-title">{isSuper ? 'Platform Super Admin Dashboard' : 'Tenant PBX Dashboard'}</h1>
          <p className="page-sub">
            {isSuper
              ? 'Global oversight of multi-tenant domains, FreeSWITCH media core, carrier gateways, and telephone number allocations.'
              : `Operational dashboard for ${user?.tenant_domain || 'your organization'}: manage extensions, inbound DIDs, auto-attendants, and call routing.`}
          </p>
        </div>
      </div>

      {/* ── STATS GRID ───────────────────────────────────────────────────────── */}
      <div className="stats-grid">
        {isSuper ? (
          <>
            <div className="stat-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('tenants')}>
              <div className="stat-card-header">
                <span className="stat-label">Platform Tenants</span>
                <Building2 size={18} color="#FF5430" />
              </div>
              <div className="stat-value">{tenantCount}</div>
              <div className="stat-trend">+100% Isolated Domains</div>
            </div>

            <div className="stat-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('dids')}>
              <div className="stat-card-header">
                <span className="stat-label">Total Inbound DIDs</span>
                <Hash size={18} color="#2563EB" />
              </div>
              <div className="stat-value">{didCount}</div>
              <div className="stat-trend text-blue-600">Global Inventory</div>
            </div>

            <div className="stat-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('trunks')}>
              <div className="stat-card-header">
                <span className="stat-label">SIP Trunks & Gateways</span>
                <ArrowLeftRight size={18} color="#7C3AED" />
              </div>
              <div className="stat-value">{trunkCount !== undefined ? trunkCount : gatewayCount}</div>
              <div className="stat-trend text-purple-600">Active Carrier Routes</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">Media Core & DB</span>
                <Server size={18} color="#55A878" />
              </div>
              <div className="stat-value text-emerald-600">
                {status.database === 'connected' ? 'Connected' : 'Offline'}
              </div>
              <div className="stat-trend text-slate-400">FreeSWITCH 1.10.x Active</div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('extensions')}>
              <div className="stat-card-header">
                <span className="stat-label">Active Extensions</span>
                <Phone size={18} color="#FF5430" />
              </div>
              <div className="stat-value">{extensionCount}</div>
              <div className="stat-trend text-orange-600">SIP & WebRTC Active</div>
            </div>

            <div className="stat-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('tenant-trunks')}>
              <div className="stat-card-header">
                <span className="stat-label">Active Gateways</span>
                <ArrowLeftRight size={18} color="#7C3AED" />
              </div>
              <div className="stat-value">{gatewayCount}</div>
              <div className="stat-trend text-purple-600">Assigned In/Out Trunks</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">Assigned DIDs</span>
                <Hash size={18} color="#2563EB" />
              </div>
              <div className="stat-value">{didCount}</div>
              <div className="stat-trend text-blue-600">Inbound Phone Numbers</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">PBX Engine Status</span>
                <Server size={18} color="#55A878" />
              </div>
              <div className="stat-value text-emerald-600">
                {status.database === 'connected' ? 'Operational' : 'Degraded'}
              </div>
              <div className="stat-trend text-slate-400">mod_xml_curl Ready</div>
            </div>
          </>
        )}
      </div>

      {/* ── QUICK NAVIGATION CARDS ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isSuper ? (
          <>
            <div className="card p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="p-3 bg-[#FFF0EC] text-[#FF5430] w-fit rounded-xl mb-3 flex items-center justify-center">
                  <Building2 size={24} />
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-1">Tenants Registry</h3>
                <p className="text-xs text-slate-500">Provision client tenant domains, extension quotas, and domain bindings.</p>
              </div>
              <button onClick={() => setActiveTab('tenants')} className="btn-primary w-full justify-center">
                <span>Manage Tenants</span>
              </button>
            </div>

            <div className="card p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="p-3 bg-blue-50 text-blue-600 w-fit rounded-xl mb-3 flex items-center justify-center">
                  <Hash size={24} />
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-1">DID Inventory</h3>
                <p className="text-xs text-slate-500">Manage pool of telephone numbers and allocate them to tenant domains.</p>
              </div>
              <button onClick={() => setActiveTab('dids')} className="btn-primary w-full justify-center">
                <span>Manage DIDs</span>
              </button>
            </div>

            <div className="card p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="p-3 bg-purple-50 text-purple-600 w-fit rounded-xl mb-3 flex items-center justify-center">
                  <ArrowLeftRight size={24} />
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-1">SIP Trunks & Gateways</h3>
                <p className="text-xs text-slate-500">Configure upstream carrier Sofia gateways, outbound proxies, and codecs.</p>
              </div>
              <button onClick={() => setActiveTab('trunks')} className="btn-primary w-full justify-center">
                <span>Configure Trunks</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {canAccessTab('extensions') && (
              <div className="card p-6 flex flex-col justify-between space-y-4">
                <div>
                  <div className="p-3 bg-[#FFF0EC] text-[#FF5430] w-fit rounded-xl mb-3 flex items-center justify-center">
                    <Phone size={24} />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mb-1">Extension Management</h3>
                  <p className="text-xs text-slate-500">View and manage SIP & WebRTC softphone credentials and extension status.</p>
                </div>
                <button onClick={() => setActiveTab('extensions')} className="btn-primary w-full justify-center">
                  <span>Manage Extensions</span>
                </button>
              </div>
            )}

            {(canAccessTab('ivr') || canAccessTab('call-routing')) && (
              <div className="card p-6 flex flex-col justify-between space-y-4">
                <div>
                  <div className="p-3 bg-blue-50 text-blue-600 w-fit rounded-xl mb-3 flex items-center justify-center">
                    <GitBranch size={24} />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mb-1">Call Routing & IVR</h3>
                  <p className="text-xs text-slate-500">Design visual drag-and-drop auto-attendants and map inbound DIDs to departments.</p>
                </div>
                <button onClick={() => setActiveTab(canAccessTab('ivr') ? 'ivr' : 'call-routing')} className="btn-primary w-full justify-center">
                  <span>{canAccessTab('ivr') ? 'Design IVR Flow' : 'View Call Routing'}</span>
                </button>
              </div>
            )}

            {(canAccessTab('queues') || canAccessTab('hunt-groups')) && (
              <div className="card p-6 flex flex-col justify-between space-y-4">
                <div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 w-fit rounded-xl mb-3 flex items-center justify-center">
                    <List size={24} />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mb-1">Call Queues & Hunt Groups</h3>
                  <p className="text-xs text-slate-500">Manage agent queues, ring groups, and call distribution strategies.</p>
                </div>
                <button onClick={() => setActiveTab(canAccessTab('queues') ? 'queues' : 'hunt-groups')} className="btn-primary w-full justify-center">
                  <span>{canAccessTab('queues') ? 'Manage Queues' : 'Manage Hunt Groups'}</span>
                </button>
              </div>
            )}

            {canAccessTab('reports') && (
              <div className="card p-6 flex flex-col justify-between space-y-4">
                <div>
                  <div className="p-3 bg-amber-50 text-amber-600 w-fit rounded-xl mb-3 flex items-center justify-center">
                    <BarChart2 size={24} />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mb-1">CDR & Analytics</h3>
                  <p className="text-xs text-slate-500">View call detail records, call logs, and performance analytics.</p>
                </div>
                <button onClick={() => setActiveTab('reports')} className="btn-primary w-full justify-center">
                  <span>View CDR & Reports</span>
                </button>
              </div>
            )}

            {(canAccessTab('voicemail') || canAccessTab('call-forwarding')) && (
              <div className="card p-6 flex flex-col justify-between space-y-4">
                <div>
                  <div className="p-3 bg-indigo-50 text-indigo-600 w-fit rounded-xl mb-3 flex items-center justify-center">
                    <Voicemail size={24} />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mb-1">Voicemail & Forwarding</h3>
                  <p className="text-xs text-slate-500">Manage extension voicemail boxes, PINs, and call forwarding rules.</p>
                </div>
                <button onClick={() => setActiveTab(canAccessTab('voicemail') ? 'voicemail' : 'call-forwarding')} className="btn-primary w-full justify-center">
                  <span>{canAccessTab('voicemail') ? 'Voicemail Settings' : 'Call Forwarding'}</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

