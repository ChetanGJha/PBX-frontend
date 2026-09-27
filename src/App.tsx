import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
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
  'TENANT_ADMIN': ['dashboard', 'tenant-users', 'extensions', 'tenant-dids', 'tenant-trunks', 'call-routing', 'queues', 'hunt-groups', 'ivr', 'voicemail', 'call-forwarding', 'audio-prompts', 'reports', 'help'],
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
      'tenant-users', 'extensions', 'tenant-dids', 'tenant-trunks', 'call-routing',
      'queues', 'hunt-groups', 'ivr', 'voicemail', 'call-forwarding',
      'audio-prompts', 'reports', 'help'
    ].includes(tab);
  }

  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes('*') || perms.includes(tab);
};

const isTokenExpired = (tokenString: string | null): boolean => {
  if (!tokenString) return false;
  try {
    const parts = tokenString.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload && typeof payload.exp === 'number') {
      return Date.now() >= payload.exp * 1000;
    }
  } catch (e) {}
  return false;
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
  const [trunks, setTrunks] = useState<any[]>([]);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);

  // Session expiry listener
  useEffect(() => {
    const handleExpired = () => {
      setShowSessionExpiredModal(true);
    };
    window.addEventListener('pbx:session-expired', handleExpired);
    return () => window.removeEventListener('pbx:session-expired', handleExpired);
  }, []);

  useEffect(() => {
    if (token && isTokenExpired(token)) {
      setShowSessionExpiredModal(true);
    }
  }, [token]);

  // Health probe polling
  useEffect(() => {
    const check = async () => { setStatus(await apiService.checkHealth()); };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch counts when token or activeTab changes
  useEffect(() => {
    if (token) {
      if (user?.role === 'SUPER_ADMIN') {
        apiService.getTenants(token).then(setTenants).catch(() => {});
      }
      apiService.getTrunks(token).then(setTrunks).catch(() => {});
      apiService.getExtensions(token).then(setExtensions).catch(() => {});
      apiService.getDids(token).then(setDids).catch(() => {});
      apiService.getGateways(token).then(setGateways).catch(() => {});
    }
  }, [token, user?.role, activeTab]);

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
                gatewayCount={gateways.length + trunks.length}
                trunkCount={trunks.length + gateways.length}
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
              <TrunksView token={token} user={user} />
            )}

            {activeTab === 'dids' && isSuper && (
              <DidsView token={token} user={user} />
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
              <DidsView token={token} user={user} />
            )}

            {activeTab === 'tenant-trunks' && canAccess(user, 'tenant-trunks') && (
              <TrunksView token={token} user={user} readOnly={!isSuper} />
            )}

            {activeTab === 'call-routing' && canAccess(user, 'call-routing') && (
              <RoutingView token={token} user={user} />
            )}

            {activeTab === 'queues' && canAccess(user, 'queues') && (
              <QueuesView token={token} user={user} />
            )}

            {activeTab === 'hunt-groups' && canAccess(user, 'hunt-groups') && (
              <HuntGroupsView token={token} user={user} />
            )}

            {activeTab === 'ivr' && canAccess(user, 'ivr') && (
              <IvrView token={token} user={user} />
            )}

            {activeTab === 'voicemail' && canAccess(user, 'voicemail') && (
              <VoicemailView token={token} user={user} />
            )}

            {activeTab === 'call-forwarding' && canAccess(user, 'call-forwarding') && (
              <CallForwardingView token={token} user={user} />
            )}

            {activeTab === 'audio-prompts' && canAccess(user, 'audio-prompts') && (
              <AudioView token={token} user={user} />
            )}

            {/* ── REPORTS & ANALYTICS ─────────────────────────────────── */}
            {activeTab === 'reports' && canAccess(user, 'reports') && (
              <ReportsView token={token} user={user} />
            )}

            {/* ── HELP (ALL ROLES) ──────────────────────────────────── */}
            {activeTab === 'help' && (
              <HelpView user={user} token={token} />
            )}

          </div>
        </main>
      </div>

      {/* ── SESSION EXPIRED MODAL OVERLAY ──────────────────────────── */}
      {showSessionExpiredModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              padding: '32px 28px 24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              textAlign: 'center',
              border: '1px solid #E2E8F0'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#FEF2F2',
                border: '1px solid #FEE2E2',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
              }}
            >
              <LogOut size={32} />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
              Session Expired
            </h3>

            <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6, marginBottom: '24px' }}>
              Your authentication session has expired or become invalid. Please log out and re-authenticate to continue using the PBX administration portal.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowSessionExpiredModal(false);
                  handleLogout();
                }}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  backgroundColor: '#FF5430',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(255, 84, 48, 0.3)',
                  transition: 'all 0.15s ease'
                }}
              >
                <LogOut size={16} />
                <span>Log Out & Sign In Again</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastProvider>
  );
};

export default App;
