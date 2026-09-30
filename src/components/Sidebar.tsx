import React from 'react';
import {
  LayoutDashboard, Building2, Phone, Terminal, ShieldCheck, Users,
  GitBranch, PhoneCall, PhoneForwarded, Voicemail, Hash, BarChart2, Music,
  HelpCircle, ArrowLeftRight, UserCog, Layers, List, Users2, Ban, Contact, Clock, Mail
} from 'lucide-react';
import { TerrixLogo } from './TerrixLogo';
import type { User as UserType } from '../types';

interface SidebarProps {
  collapsed: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserType | null;
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
    label: 'Platform Administration',
    items: [
      { id: 'tenants',     label: 'Tenants Registry',  icon: Building2,       roles: ['SUPER_ADMIN'] },
      { id: 'users',       label: 'Global Users',      icon: Users,           roles: ['SUPER_ADMIN'] },
      { id: 'trunks',      label: 'SIP Trunks',        icon: ArrowLeftRight,  roles: ['SUPER_ADMIN'] },
      { id: 'dids',        label: 'DID Inventory',     icon: Hash,            roles: ['SUPER_ADMIN'] },
      { id: 'email-settings', label: 'SMTP & Email',     icon: Mail,            roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    label: 'Tenant Management',
    items: [
      { id: 'tenant-users',     label: 'Admins & Users',   icon: UserCog,         roles: ['SUPER_ADMIN', 'TENANT_ADMIN'] },
      { id: 'email-settings',   label: 'SMTP & Email',     icon: Mail,            roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN'] },
      { id: 'extensions',       label: 'SIP Extensions',   icon: Phone,           roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN', 'SUPERVISOR'] },
      { id: 'tenant-dids',      label: 'Assigned DIDs',    icon: Hash,            roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN', 'SUPERVISOR'] },
      { id: 'tenant-trunks',    label: 'Assigned Gateways',icon: ArrowLeftRight,  roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN'] },
      { id: 'call-routing',     label: 'Call Routing',     icon: PhoneForwarded,  roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN'] },
      { id: 'queues',           label: 'Call Queues',      icon: List,            roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN', 'SUPERVISOR'] },
      { id: 'hunt-groups',      label: 'Hunt Groups',      icon: Layers,          roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN'] },
      { id: 'ivr',              label: 'IVR Flows',        icon: GitBranch,       roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN'] },
      { id: 'voicemail',        label: 'Voicemail',        icon: Voicemail,       roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN', 'SUPERVISOR', 'AGENT'] },
      { id: 'call-forwarding',  label: 'Call Forwarding',  icon: PhoneCall,       roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN', 'AGENT'] },
      { id: 'audio-prompts',    label: 'Audio Prompts',    icon: Music,           roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN'] },
      { id: 'conferences',      label: 'Conferences',      icon: Users2,          roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN', 'SUPERVISOR'] },
      { id: 'call-block',       label: 'Call Block',       icon: Ban,             roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN'] },
      { id: 'business-hours',   label: 'Business Hours',   icon: Clock,           roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN'] },
      { id: 'contacts',         label: 'Contacts',         icon: Contact,         roles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'SUB_ADMIN', 'SUPERVISOR', 'AGENT'] },
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

function isItemVisible(item: NavItem, user: UserType | null, groupLabel?: string): boolean {
  if (!user) return false;
  const role = user.role || 'AGENT';

  if (role === 'SUPER_ADMIN') return true;
  if (item.id === 'dashboard' || item.id === 'help') return true;

  if (groupLabel === 'Platform Administration') {
    return false;
  }

  if (['tenants', 'users', 'trunks', 'dids', 'xmlcurl', 'auth'].includes(item.id)) {
    return false;
  }

  if (role === 'SUB_ADMIN' || (user.allowed_modules && user.allowed_modules.length > 0)) {
    return (user.allowed_modules || []).includes(item.id);
  }

  if (role === 'TENANT_ADMIN') {
    return [
      'tenant-users', 'extensions', 'tenant-dids', 'tenant-trunks', 'call-routing',
      'queues', 'hunt-groups', 'ivr', 'voicemail', 'call-forwarding',
      'audio-prompts', 'conferences', 'call-block', 'business-hours', 'contacts',
      'email-settings', 'reports', 'help'
    ].includes(item.id);
  }

  return item.roles.includes(role);
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, activeTab, setActiveTab, user }) => {
  const role = user?.role || 'AGENT';

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="brand flex items-center gap-3">
        <TerrixLogo size="small" />
        <div className="brand-name">
          Terrix AI
          <small>PBX System</small>
        </div>
      </div>

      {/* Compact User Profile Badge */}
      {!collapsed && user && (
        <div className="mx-3 my-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF5430] to-[#ED6140] text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-2xs">
            {user.username ? user.username.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-800 truncate leading-tight">
              {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username}
            </div>
            <div className="text-[10px] font-bold text-[#FF5430] uppercase tracking-wide truncate mt-0.5">
              {role.replace('_', ' ')}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <div className="sidebar-body">
        {navGroups.map((group, idx) => {
          const visibleItems = group.items.filter(item => isItemVisible(item, user, group.label));
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="mb-3">
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
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#FF5430]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    <span className="nav-text truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 px-2 py-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="nav-text text-slate-600">v2.0.0 • Engine Ready</span>
        </div>
      </div>
    </aside>
  );
};


