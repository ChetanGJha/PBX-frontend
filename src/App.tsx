import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { LoginScreen } from './components/LoginScreen';
import { DashboardView } from './components/DashboardView';
import { AuthView } from './components/AuthView';
import { TenantsView } from './components/TenantsView';
import { ExtensionsView } from './components/ExtensionsView';
import { UsersView } from './components/UsersView';
import { XmlCurlConsole } from './components/XmlCurlConsole';
import { IvrView } from './components/IvrView';
import { AudioView } from './components/AudioView';
import { TrunksView } from './components/TrunksView';
import { DidsView } from './components/DidsView';
import { RoutingView } from './components/RoutingView';
import { QueuesView } from './components/QueuesView';
import { HuntGroupsView } from './components/HuntGroupsView';
import { VoicemailView } from './components/VoicemailView';
import { CallForwardingView } from './components/CallForwardingView';
import { ReportsView } from './components/ReportsView';
import { HelpView } from './components/HelpView';
import { ToastProvider } from './components/ToastProvider';
import { apiService } from './services/api';
import type { SystemStatus, User, Tenant, Extension } from './types';

// ─── Role Permissions Matrix ──────────────────────────────────────────────────
const ROLE_PERMISSIONS: Record<string, string[]> = {
  'SUPER_ADMIN':  ['*'],
  'TENANT_ADMIN': ['dashboard', 'tenant-users', 'extensions', 'tenant-dids', 'call-routing', 'queues', 'hunt-groups', 'ivr', 'voicemail', 'call-forwarding', 'audio-prompts', 'reports', 'help'],
  'SUPERVISOR':   ['dashboard', 'extensions', 'tenant-dids', 'queues', 'voicemail', 'reports', 'help'],
  'AGENT':        ['dashboard', 'voicemail', 'call-forwarding', 'help'],
};

const canAccess = (user: User | null, tab: string) => {
  if (!user) return false;
  const role = user.role || 'AGENT';
  if (role === 'SUPER_ADMIN') return true;
  if (tab === 'dashboard' || tab === 'help') return true;

  // Platform admin tabs strictly restricted to SUPER_ADMIN
  if (['tenants', 'users', 'trunks', 'dids', 'xmlcurl', 'auth'].includes(tab)) {
    return false;
  }

  // If sub-admin or custom allowed_modules
  if (role === 'SUB_ADMIN' || (user.allowed_modules && user.allowed_modules.length > 0)) {
    return (user.allowed_modules || []).includes(tab);
  }

  // Tenant master admin has full access to tenant suite
  if (role === 'TENANT_ADMIN') {
    return [
      'tenant-users', 'extensions', 'tenant-dids', 'call-routing',
      'queues', 'hunt-groups', 'ivr', 'voicemail', 'call-forwarding',
      'audio-prompts', 'reports', 'help'
    ].includes(tab);
  }

  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes('*') || perms.includes(tab);
};

// ─── App Component ────────────────────────────────────────────────────────────
export const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [status, setStatus] = useState<SystemStatus>({
    healthy: false, ready: false, database: 'unknown', redis: 'unknown',
  });

  const [token, setToken] = useState<string | null>(localStorage.getItem('pbx_access_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pbx_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [dids, setDids] = useState<any[]>([]);
  const [gateways, setGateways] = useState<any[]>([]);

  // Health probe polling
  useEffect(() => {
    const check = async () => { setStatus(await apiService.checkHealth()); };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch counts when token changes
  useEffect(() => {
    if (token) {
      if (user?.role === 'SUPER_ADMIN') {
        apiService.getTenants(token).then(setTenants).catch(() => {});
      }
      apiService.getExtensions(token).then(setExtensions).catch(() => {});
      apiService.getDids(token).then(setDids).catch(() => {});
      apiService.getGateways(token).then(setGateways).catch(() => {});
    }
  }, [token, user?.role]);

  const handleLoginSuccess = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('pbx_access_token', newToken);
    localStorage.setItem('pbx_user', JSON.stringify(newUser));
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('pbx_access_token');
    localStorage.removeItem('pbx_user');
  };

  // Safe tab setter — enforce role guard
  const handleSetTab = (tab: string) => {
    if (!user) return;
    if (canAccess(user, tab)) {
      setActiveTab(tab);
    }
  };

  if (!token) {
    return (
      <ToastProvider>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </ToastProvider>
    );
  }

  const role = user?.role || 'AGENT';
  const isSuper = role === 'SUPER_ADMIN';

  return (
    <ToastProvider>
      <div id="appScreen" style={{ display: 'block' }}>
        <Sidebar
          collapsed={collapsed}
          activeTab={activeTab}
          setActiveTab={handleSetTab}
          user={user}
        />

        <main className="main">
          <Topbar
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
            status={status}
            user={user}
            onLogout={handleLogout}
          />

          <div className="content">

            {/* ── SHARED: DASHBOARD ─────────────────────────────────── */}
            {activeTab === 'dashboard' && (
              <DashboardView
                status={status}
                user={user}
                tenantCount={tenants.length}
                extensionCount={extensions.length}
                didCount={dids.length}
                gatewayCount={gateways.length}
                setActiveTab={handleSetTab}
              />
            )}

            {/* ── SUPER ADMIN ONLY ──────────────────────────────────── */}
            {activeTab === 'auth' && isSuper && (
              <AuthView onLoginSuccess={handleLoginSuccess} user={user} />
            )}

            {activeTab === 'tenants' && isSuper && (
              <TenantsView token={token} />
            )}

            {activeTab === 'users' && isSuper && (
              <UsersView token={token} currentUser={user} />
            )}

            {activeTab === 'trunks' && isSuper && (
              <TrunksView token={token} />
            )}

            {activeTab === 'dids' && isSuper && (
              <DidsView token={token} />
            )}

            {activeTab === 'xmlcurl' && isSuper && (
              <XmlCurlConsole />
            )}

            {/* ── TENANT MANAGEMENT (TENANT ADMIN + PERMITTED SUB-ADMINS) ─ */}
            {activeTab === 'tenant-users' && canAccess(user, 'tenant-users') && (
              <UsersView token={token} currentUser={user} tenantScoped />
            )}

            {activeTab === 'extensions' && canAccess(user, 'extensions') && (
              <ExtensionsView token={token} user={user} />
            )}

            {activeTab === 'tenant-dids' && canAccess(user, 'tenant-dids') && (
              <DidsView token={token} />
            )}

            {activeTab === 'call-routing' && canAccess(user, 'call-routing') && (
              <RoutingView token={token} />
            )}

            {activeTab === 'queues' && canAccess(user, 'queues') && (
              <QueuesView token={token} />
            )}

            {activeTab === 'hunt-groups' && canAccess(user, 'hunt-groups') && (
              <HuntGroupsView token={token} />
            )}

            {activeTab === 'ivr' && canAccess(user, 'ivr') && (
              <IvrView token={token} />
            )}

            {activeTab === 'voicemail' && canAccess(user, 'voicemail') && (
              <VoicemailView token={token} user={user} />
            )}

            {activeTab === 'call-forwarding' && canAccess(user, 'call-forwarding') && (
              <CallForwardingView token={token} user={user} />
            )}

            {activeTab === 'audio-prompts' && canAccess(user, 'audio-prompts') && (
              <AudioView token={token} />
            )}

            {/* ── REPORTS & ANALYTICS ─────────────────────────────────── */}
            {activeTab === 'reports' && canAccess(user, 'reports') && (
              <ReportsView token={token} />
            )}

            {/* ── HELP (ALL ROLES) ──────────────────────────────────── */}
            {activeTab === 'help' && (
              <HelpView user={user} token={token} />
            )}

          </div>
        </main>
      </div>
    </ToastProvider>
  );
};

export default App;
