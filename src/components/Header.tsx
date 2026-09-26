import { Server, Database, Activity, LogOut, Cpu, ShieldCheck } from 'lucide-react';
import type { SystemStatus, User as UserType } from '../types';


interface HeaderProps {
  status: SystemStatus;
  user: UserType | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ status, user, activeTab, setActiveTab, onLogout }) => {
  return (
    <header className="glass-panel mb-8 p-4 border-b border-indigo-500/20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/40 rounded-xl text-indigo-400 shadow-lg shadow-indigo-500/20">
            <Cpu className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">
              Multi-Tenant PBX Platform
            </h1>
            <p className="text-xs text-slate-400 font-mono">Control Plane API Dashboard</p>
          </div>
        </div>

        {/* Live System Indicators */}
        <div className="flex items-center gap-3 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 text-xs font-medium">
            <Activity className={`w-3.5 h-3.5 ${status.healthy ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
            <span>API: {status.healthy ? 'Online' : 'Offline'}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 text-xs font-medium">
            <Database className={`w-3.5 h-3.5 ${status.database === 'connected' ? 'text-emerald-400' : 'text-rose-400'}`} />
            <span>PostgreSQL: {status.database}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 text-xs font-medium">
            <Server className={`w-3.5 h-3.5 ${status.redis === 'connected' ? 'text-emerald-400' : 'text-rose-400'}`} />
            <span>Redis: {status.redis}</span>
          </div>
        </div>

        {/* User Account State */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 bg-indigo-950/40 border border-indigo-500/30 px-3.5 py-1.5 rounded-xl">
              <div className="text-right">
                <div className="text-sm font-semibold text-indigo-200">{user.username}</div>
                <div className="text-[10px] text-indigo-400 font-mono uppercase">{user.role}</div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Unauthenticated</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
        {[
          { id: 'auth', label: 'Authentication & Seeding' },
          { id: 'tenants', label: 'Tenant Management' },
          { id: 'extensions', label: 'Extension Provisioning' },
          { id: 'xmlcurl', label: 'FreeSWITCH mod_xml_curl Console' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
};
