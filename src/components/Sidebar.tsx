import React from 'react';
import { TerrixLogo } from './TerrixLogo';

interface SidebarProps {
  collapsed: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  activeTab,
  setActiveTab,
}) => {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand">
        <TerrixLogo size={collapsed ? 'small' : 'medium'} />
        {!collapsed && (
          <div className="brand-name">
            Terrix AI
            <small>Technologies</small>
          </div>
        )}
      </div>

      <div className="sidebar-body">
        <div className="nav-label">Overview</div>
        <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <i className="bi bi-grid"></i><span className="nav-text">Dashboard</span>
        </button>

        <div className="nav-label">Telephony Control</div>
        <button className={`nav-item ${activeTab === 'extensions' ? 'active' : ''}`} onClick={() => setActiveTab('extensions')}>
          <i className="bi bi-telephone"></i><span className="nav-text">Extensions</span>
        </button>

        <button className={`nav-item ${activeTab === 'dids' ? 'active' : ''}`} onClick={() => setActiveTab('dids')}>
          <i className="bi bi-hash"></i><span className="nav-text">DID Inventory</span>
        </button>

        <button className={`nav-item ${activeTab === 'trunks' ? 'active' : ''}`} onClick={() => setActiveTab('trunks')}>
          <i className="bi bi-diagram-3"></i><span className="nav-text">SIP Trunks</span>
        </button>

        <button className={`nav-item ${activeTab === 'gateways' ? 'active' : ''}`} onClick={() => setActiveTab('gateways')}>
          <i className="bi bi-hdd-network"></i><span className="nav-text">Gateways</span>
        </button>

        <button className={`nav-item ${activeTab === 'routing' ? 'active' : ''}`} onClick={() => setActiveTab('routing')}>
          <i className="bi bi-sign-turn-right"></i><span className="nav-text">Call Routing</span>
        </button>

        <button className={`nav-item ${activeTab === 'queues' ? 'active' : ''}`} onClick={() => setActiveTab('queues')}>
          <i className="bi bi-people"></i><span className="nav-text">Call Queues</span>
        </button>

        <button className={`nav-item ${activeTab === 'ivr' ? 'active' : ''}`} onClick={() => setActiveTab('ivr')}>
          <i className="bi bi-diagram-2"></i><span className="nav-text">IVR Flow Designer</span>
        </button>

        <button className={`nav-item ${activeTab === 'audio' ? 'active' : ''}`} onClick={() => setActiveTab('audio')}>
          <i className="bi bi-[#FF5430] bi-mic"></i><span className="nav-text">Audio Prompts</span>
        </button>

        <button className={`nav-item ${activeTab === 'huntgroups' ? 'active' : ''}`} onClick={() => setActiveTab('huntgroups')}>
          <i className="bi bi-telephone-forward"></i><span className="nav-text">Hunt Groups</span>
        </button>

        <div className="nav-label">Reports & Analytics</div>
        <button className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
          <i className="bi bi-bar-chart-line"></i><span className="nav-text">Reports & CDR</span>
        </button>

        <div className="nav-label">Administration</div>
        <button className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <i className="bi bi-person-badge"></i><span className="nav-text">Users & Admins</span>
        </button>

        <button className={`nav-item ${activeTab === 'tenants' ? 'active' : ''}`} onClick={() => setActiveTab('tenants')}>
          <i className="bi bi-building"></i><span className="nav-text">Tenants</span>
        </button>
      </div>
    </aside>
  );
};
