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
      {/* Sidebar Collapse Toggle */}
      <button onClick={onToggleCollapse} className="collapse-btn" title="Toggle Sidebar">
        {collapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Status Pill */}
      <div className="status-pill">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>API: {status.healthy ? 'Online' : 'Offline'}</span>
      </div>

      {/* User Info & Actions */}
      <div className="top-right">
        {user ? (
          <div className="flex items-center gap-3">
            <span className="role-pill">{user.role}</span>
            <div className="flex items-center gap-2">
              <div className="avatar">
                {user.username ? user.username.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-800 text-xs leading-tight">{user.username}</div>
                <div className="text-[9px] text-slate-400 leading-tight">{user.email}</div>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center justify-center cursor-pointer border-0 bg-transparent"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[10px] text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full font-semibold border border-amber-200">
            <ShieldCheck size={14} />
            <span>Not Authenticated</span>
          </div>
        )}
      </div>
    </div>
  );
};
