import React from 'react';
import {
  LayoutDashboard, Building2, Phone, Terminal, ShieldCheck, Users, Activity,
  GitBranch, PhoneCall, PhoneForwarded, Voicemail, Hash, BarChart2, Music,
  HelpCircle, ArrowLeftRight, UserCog, Layers, List
} from 'lucide-react';
import { TerrixLogo } from './TerrixLogo';
import type { User } from '../types';

interface SidebarProps {
  collapsed: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard',   label: 'Dashboard',         icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN', 'SUPERVISOR', 'AGENT'] },
      { id: 'auth',        label: 'Auth & Security',   icon: ShieldCheck,     roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    // Super Admin only — platform-level management
    label: 'Platform Administration',
    items: [
      { id: 'tenants',     label: 'Tenants Registry',  icon: Building2,       roles: ['SUPER_ADMIN'] },
      { id: 'users',       label: 'Global Users',      icon: Users,           roles: ['SUPER_ADMIN'] },
      { id: 'trunks',      label: 'SIP Trunks',        icon: ArrowLeftRight,  roles: ['SUPER_ADMIN'] },
      { id: 'dids',        label: 'DID Inventory',     icon: Hash,            roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    // Tenant Management functions (Tenant Admin & granted Sub-Admins)
    label: 'Tenant Management',
    items: [
      { id: 'tenant-users',     label: 'Admins & Users',   icon: UserCog,         roles: ['SUPER_ADMIN', 'TENANT_ADMIN'] },
      { id: 'extensions',       label: 'SIP Extensions',   icon: Phone,           roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN', 'SUPERVISOR'] },
      { id: 'tenant-dids',      label: 'Assigned DIDs',    icon: Hash,            roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN', 'SUPERVISOR'] },
      { id: 'call-routing',     label: 'Call Routing',     icon: PhoneForwarded,  roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN'] },
      { id: 'queues',           label: 'Call Queues',      icon: List,            roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN', 'SUPERVISOR'] },
      { id: 'hunt-groups',      label: 'Hunt Groups',      icon: Layers,          roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN'] },
      { id: 'ivr',              label: 'IVR Flows',        icon: GitBranch,       roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN'] },
      { id: 'voicemail',        label: 'Voicemail',        icon: Voicemail,       roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN', 'SUPERVISOR', 'AGENT'] },
      { id: 'call-forwarding',  label: 'Call Forwarding',  icon: PhoneCall,       roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN', 'AGENT'] },
      { id: 'audio-prompts',    label: 'Audio Prompts',    icon: Music,           roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN'] },
    ],
  },
  {
    label: 'Reports & Analytics',
    items: [
      { id: 'reports',     label: 'CDR & Reports',     icon: BarChart2,       roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN', 'SUPERVISOR'] },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'xmlcurl',     label: 'FreeSWITCH Console', icon: Terminal,      roles: ['SUPER_ADMIN'] },
      { id: 'help',        label: 'Help & Guides',      icon: HelpCircle,    roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN', 'SUPERVISOR', 'AGENT'] },
    ],
  },
];

function isItemVisible(item: NavItem, user: User | null): boolean {
  if (!user) return false;
  const role = user.role || 'AGENT';

  // Platform admin sees all
  if (role === 'SUPER_ADMIN') return true;

  // Overview and Help are accessible to all authenticated users
  if (item.id === 'dashboard' || item.id === 'help') return true;

  // Platform Administration is strictly SUPER_ADMIN only
  if (['tenants', 'users', 'trunks', 'dids', 'xmlcurl', 'auth'].includes(item.id)) {
    return false;
  }

  // If sub-admin or user has specific allowed_modules assigned
  if (role === 'SUB_ADMIN' || (user.allowed_modules && user.allowed_modules.length > 0)) {
    return (user.allowed_modules || []).includes(item.id);
  }

  // Tenant Admin has access to all tenant management functions
  if (role === 'TENANT_ADMIN') {
    return [
      'tenant-users', 'extensions', 'tenant-dids', 'call-routing',
      'queues', 'hunt-groups', 'ivr', 'voicemail', 'call-forwarding',
      'audio-prompts', 'reports', 'help'
    ].includes(item.id);
  }

  // Fallback to roles definition
  return item.roles.includes(role);
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, activeTab, setActiveTab, user }) => {
  const role = user?.role || 'AGENT';
  const isSuper = role === 'SUPER_ADMIN';
  const isTenantAdmin = role === 'TENANT_ADMIN';
  const isSubAdmin = role === 'SUB_ADMIN';

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="brand">
        <TerrixLogo size="small" />
        <div className="brand-name">
          Terrix AI
          <small>
            {isSuper
              ? 'Platform Admin'
              : isTenantAdmin
              ? 'Tenant Master'
              : isSubAdmin
              ? 'Sub-Admin'
              : role === 'SUPERVISOR'
              ? 'Supervisor'
              : 'Agent Portal'}
          </small>
        </div>
      </div>

      {/* User Context Badge */}
      {!collapsed && user && (
        <div style={{ margin: '4px 12px 8px', background: 'rgba(255,255,255,0.07)', borderRadius: '8px', padding: '8px 10px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {isSuper
              ? '🔑 Platform Super Admin'
              : isTenantAdmin
              ? '🏢 Tenant Master Admin'
              : isSubAdmin
              ? '🛡️ Tenant Sub-Admin'
              : '👤 ' + role}
          </div>
          <div style={{ fontSize: '12px', color: '#E2E8F0', marginTop: '2px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username}
          </div>
          {user.tenant_domain && (
            <div style={{ fontSize: '10px', color: '#64748B', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.tenant_domain}
            </div>
          )}
        </div>
      )}

      {/* Sidebar Navigation */}
      <div className="sidebar-body">
        {navGroups.map((group, idx) => {
          const visibleItems = group.items.filter(item => isItemVisible(item, user));
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx}>
              <div className="nav-label">{group.label}</div>
              {visibleItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    title={collapsed ? item.label : undefined}
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
          <span className="nav-text">v2.0.0-Production</span>
        </div>
      </div>
    </aside>
  );
};
