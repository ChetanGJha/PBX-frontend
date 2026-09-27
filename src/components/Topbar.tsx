import React from 'react';
import { Menu, ChevronLeft, LogOut, ShieldCheck } from 'lucide-react';
import type { SystemStatus, User as UserType } from '../types';

interface TopbarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  status: SystemStatus;
  user: UserType | null;
  onLogout: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  collapsed,
  onToggleCollapse,
  status,
  user,
  onLogout,
}) => {
  return (
    <div className="topbar">
      {/* Left Section: Collapse Toggle & System Status */}
      <div className="flex items-center gap-4">
        <button onClick={onToggleCollapse} className="collapse-btn" title="Toggle Sidebar">
          {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>

        <div className="status-pill">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${status.healthy ? 'bg-emerald-400' : 'bg-rose-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${status.healthy ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          </span>
          <span className="font-semibold text-xs">API: {status.healthy ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* Right Section: User Info & Logout Action */}
      <div className="top-right">
        {user ? (
          <div className="flex items-center gap-3.5">
            <span className="role-pill">{user.role}</span>
            
            <div className="h-5 w-px bg-slate-200" />

            <div className="flex items-center gap-2.5">
              <div className="avatar">
                {user.username ? user.username.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-bold text-slate-900 text-xs leading-tight">{user.username}</div>
                <div className="text-[10px] text-slate-500 font-medium leading-tight">{user.email}</div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-100"
              title="Logout session"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200">
            <ShieldCheck size={15} />
            <span>Not Authenticated</span>
          </div>
        )}
      </div>
    </div>
  );
};

