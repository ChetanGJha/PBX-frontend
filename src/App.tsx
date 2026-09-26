import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AuthView } from './components/AuthView';
import { TenantsView } from './components/TenantsView';
import { ExtensionsView } from './components/ExtensionsView';
import { XmlCurlTester } from './components/XmlCurlTester';
import { apiService } from './services/api';
import type { SystemStatus, User } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('auth');
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

  // Health probe polling
  useEffect(() => {
    const check = async () => {
      const s = await apiService.checkHealth();
      setStatus(s);
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <Header
        status={status}
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      <main className="transition-all duration-300">
        {activeTab === 'auth' && (
          <AuthView onLoginSuccess={handleLoginSuccess} token={token} />
        )}
        {activeTab === 'tenants' && <TenantsView token={token} />}
        {activeTab === 'extensions' && <ExtensionsView token={token} />}
        {activeTab === 'xmlcurl' && <XmlCurlTester />}
      </main>
    </div>
  );
};

export default App;
