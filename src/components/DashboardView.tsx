import React from 'react';
import { Building2, Phone, Server, Cpu } from 'lucide-react';
import type { SystemStatus, User } from '../types';

interface DashboardViewProps {
  status: SystemStatus;
  user: User | null;
  tenantCount: number;
  extensionCount: number;
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  status,
  tenantCount,
  extensionCount,
  setActiveTab,
}) => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <div className="eyebrow">Overview & Control</div>
          <h1 className="page-title">Terrix PBX Dashboard</h1>
          <p className="page-sub">Real-time status of FreeSWITCH media engine, database persistence, and active tenant isolation.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Active Tenants</span>
            <Building2 size={18} color="#FF5430" />
          </div>
          <div className="stat-value">{tenantCount}</div>
          <div className="stat-trend">+100% Isolated Domains</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">Provisioned Extensions</span>
            <Phone size={18} color="#FF5430" />
          </div>
          <div className="stat-value">{extensionCount}</div>
          <div className="stat-trend">SIP / WebRTC Endpoints</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">PostgreSQL Database</span>
            <Server size={18} color="#55A878" />
          </div>
          <div className="stat-value text-emerald-600">
            {status.database === 'connected' ? 'Connected' : 'Offline'}
          </div>
          <div className="stat-trend text-slate-400">Connection Pool Active</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">FreeSWITCH Node</span>
            <Cpu size={18} color="#55A878" />
          </div>
          <div className="stat-value text-emerald-600">1.10.x</div>
          <div className="stat-trend text-slate-400">mod_xml_curl Enabled</div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="p-3 bg-[#FFF0EC] text-[#FF5430] w-fit rounded-xl mb-3 flex items-center justify-center">
              <Building2 size={24} />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">Tenants Registry</h3>
            <p className="text-xs text-slate-500">Manage multi-tenant PBX domains, resource quotas, and domain bindings.</p>
          </div>
          <button onClick={() => setActiveTab('tenants')} className="btn-primary w-full justify-center">
            <span>Manage Tenants</span>
          </button>
        </div>

        <div className="card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="p-3 bg-[#FFF0EC] text-[#FF5430] w-fit rounded-xl mb-3 flex items-center justify-center">
              <Phone size={24} />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">Extension Management</h3>
            <p className="text-xs text-slate-500">Provision SIP & WebRTC softphone credentials, caller IDs, and voicemail PINs.</p>
          </div>
          <button onClick={() => setActiveTab('extensions')} className="btn-primary w-full justify-center">
            <span>Provision Extensions</span>
          </button>
        </div>

        <div className="card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="p-3 bg-[#FFF0EC] text-[#FF5430] w-fit rounded-xl mb-3 flex items-center justify-center">
              <Cpu size={24} />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">FreeSWITCH XML Console</h3>
            <p className="text-xs text-slate-500">Test live mod_xml_curl dynamic directory XML generation for FreeSWITCH.</p>
          </div>
          <button onClick={() => setActiveTab('xmlcurl')} className="btn-primary w-full justify-center">
            <span>Open XML Console</span>
          </button>
        </div>
      </div>
    </div>
  );
};
