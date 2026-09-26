import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { LoginScreen } from './components/LoginScreen';
import { DashboardView } from './components/DashboardView';
import { AuthView } from './components/AuthView';
import { TenantsView } from './components/TenantsView';
import { ExtensionsView } from './components/ExtensionsView';
import { UsersView } from './components/UsersView';
import { TrunksView } from './components/TrunksView';
import { GatewaysView } from './components/GatewaysView';
import { RoutingView } from './components/RoutingView';
import { QueuesView } from './components/QueuesView';
import { DidsView } from './components/DidsView';
import { IvrView } from './components/IvrView';
import { HuntGroupsView } from './components/HuntGroupsView';
import { ReportsView } from './components/ReportsView';
import { AudioView } from './components/AudioView';
import { apiService } from './services/api';
import type { SystemStatus, User, Tenant, Extension } from './types';

export const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [status, setStatus] = useState<SystemStatus>({
    healthy: false,
    ready: false,
    database: 'unknown',
    redis: 'unknown',
  });

  const [token, setToken] = useState<string | null>(localStorage.getItem('pbx_access_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pbx_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [extensions, setExtensions] = useState<Extension[]>([]);

  useEffect(() => {
    const check = async () => {
      const s = await apiService.checkHealth();
      setStatus(s);
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (token) {
      apiService.getTenants(token).then(setTenants).catch(() => {});
      apiService.getExtensions(token).then(setExtensions).catch(() => {});
    }
  }, [token]);

  const handleLoginSuccess = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('pbx_access_token', newToken);
    localStorage.setItem('pbx_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('pbx_access_token');
    localStorage.removeItem('pbx_user');
  };

  if (!token) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div id="appScreen" style={{ display: 'block' }}>
      <Sidebar
        collapsed={collapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
          {activeTab === 'dashboard' && (
            <DashboardView
              status={status}
              user={user}
              tenantCount={tenants.length}
              extensionCount={extensions.length}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'auth' && <AuthView onLoginSuccess={handleLoginSuccess} user={user} />}
          {activeTab === 'tenants' && <TenantsView token={token} />}
          {activeTab === 'users' && <UsersView token={token} currentUser={user} />}
          {activeTab === 'extensions' && <ExtensionsView token={token} />}
          {activeTab === 'dids' && <DidsView token={token} />}
          {activeTab === 'trunks' && <TrunksView token={token} />}
          {activeTab === 'gateways' && <GatewaysView token={token} />}
          {activeTab === 'routing' && <RoutingView token={token} />}
          {activeTab === 'queues' && <QueuesView token={token} />}
          {activeTab === 'ivr' && <IvrView token={token} />}
          {activeTab === 'audio' && <AudioView token={token} />}
          {activeTab === 'huntgroups' && <HuntGroupsView token={token} />}
          {activeTab === 'reports' && <ReportsView token={token} />}
        </div>
      </main>
    </div>
  );
};

export default App;
