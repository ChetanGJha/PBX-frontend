import React from 'react';
import { Menu, ChevronLeft, LogOut, ShieldCheck } from 'lucide-react';
import type { SystemStatus, User as UserType } from '../types';
import { Avatar, Badge } from './ui';

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

        <Badge variant={status.healthy ? 'success' : 'danger'}>
          API: {status.healthy ? 'Online' : 'Offline'}
        </Badge>
      </div>

      {/* Right Section: User Info & Logout Action */}
      <div className="top-right">
        {user ? (
          <div className="flex items-center gap-3.5">
            <Badge variant="primary">{user.role}</Badge>

            <div className="h-5 w-px bg-slate-200" />

            <div className="flex items-center gap-2.5">
              <Avatar name={user.username} size="sm" />
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
