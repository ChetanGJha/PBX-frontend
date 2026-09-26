import React from 'react';
import { LayoutDashboard, Building2, Phone, Terminal, ShieldCheck, Users, Activity } from 'lucide-react';
import { TerrixLogo } from './TerrixLogo';
import type { User } from '../types';

interface SidebarProps {
  collapsed: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, activeTab, setActiveTab, user }) => {
  const role = user?.role || 'SUPER_ADMIN';

  const isSuper = role === 'SUPER_ADMIN';
  const isTenantAdmin = role === 'TENANT_ADMIN';

  const navGroups = [
    {
      label: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUPERVISOR', 'AGENT'] },
        { id: 'auth', label: 'Auth & Security', icon: ShieldCheck, roles: ['SUPER_ADMIN'] },
      ],
    },
    {
      label: 'Tenants & Users',
      items: [
        { id: 'tenants', label: 'Tenants Registry', icon: Building2, roles: ['SUPER_ADMIN'] },
        { id: 'users', label: 'Users & Admins', icon: Users, roles: ['SUPER_ADMIN', 'TENANT_ADMIN'] },
        { id: 'extensions', label: 'SIP Extensions', icon: Phone, roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUPERVISOR', 'AGENT'] },
      ],
    },
    {
      label: 'Telephony Engine',
      items: [
        { id: 'xmlcurl', label: 'FreeSWITCH Console', icon: Terminal, roles: ['SUPER_ADMIN', 'TENANT_ADMIN'] },
      ],
    },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="brand">
        <TerrixLogo size="small" />
        <div className="brand-name">
          Terrix AI
          <small>{isSuper ? 'PBX Engine' : isTenantAdmin ? 'Tenant Admin' : 'Agent Portal'}</small>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div className="sidebar-body">
        {navGroups.map((group, idx) => {
          const visibleItems = group.items.filter((item) => item.roles.includes(role));
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx}>
              <div className="nav-label">{group.label}</div>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="nav-text">{item.label}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="flex items-center gap-2 text-[10px] text-slate-400 px-2 py-1">
          <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span className="nav-text">v1.10.0-Production</span>
        </div>
      </div>
    </aside>
  );
};
