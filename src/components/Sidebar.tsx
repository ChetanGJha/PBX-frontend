import React from 'react';
import { TerrixLogo } from './TerrixLogo';
import type { User } from '../types';

interface SidebarProps {
  collapsed: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
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
        <button
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <i className="bi bi-grid"></i>
          <span className="nav-text">Dashboard</span>
        </button>

        <div className="nav-label">Telephony Engine</div>
        <button
          className={`nav-item ${activeTab === 'extensions' ? 'active' : ''}`}
          onClick={() => setActiveTab('extensions')}
        >
          <i className="bi bi-telephone"></i>
          <span className="nav-text">Extensions</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'trunks' ? 'active' : ''}`}
          onClick={() => setActiveTab('trunks')}
        >
          <i className="bi bi-diagram-3"></i>
          <span className="nav-text">SIP Trunks</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'gateways' ? 'active' : ''}`}
          onClick={() => setActiveTab('gateways')}
        >
          <i className="bi bi-hdd-network"></i>
          <span className="nav-text">Gateways</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'routing' ? 'active' : ''}`}
          onClick={() => setActiveTab('routing')}
        >
          <i className="bi bi-sign-turn-right"></i>
          <span className="nav-text">Call Routing</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'queues' ? 'active' : ''}`}
          onClick={() => setActiveTab('queues')}
        >
          <i className="bi bi-people"></i>
          <span className="nav-text">Call Queues</span>
        </button>

        <div className="nav-label">Administration</div>
        <button
          className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <i className="bi bi-person-badge"></i>
          <span className="nav-text">Users & Admins</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'tenants' ? 'active' : ''}`}
          onClick={() => setActiveTab('tenants')}
        >
          <i className="bi bi-building"></i>
          <span className="nav-text">Tenants</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'auth' ? 'active' : ''}`}
          onClick={() => setActiveTab('auth')}
        >
          <i className="bi bi-shield-check"></i>
          <span className="nav-text">Auth Controls</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'xmlcurl' ? 'active' : ''}`}
          onClick={() => setActiveTab('xmlcurl')}
        >
          <i className="bi bi-code-slash"></i>
          <span className="nav-text">mod_xml_curl</span>
        </button>
      </div>
    </aside>
  );
};
