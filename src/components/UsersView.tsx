import { useToast } from './ToastProvider';
import React, { useState, useEffect } from 'react';
import { Users, UserPlus, RefreshCw, Trash2, Search, X, AlertCircle, ShieldCheck, ShieldAlert, Settings } from 'lucide-react';
import { apiService } from '../services/api';
import type { User as UserType, Tenant } from '../types';

interface UsersViewProps {
  token: string | null;
  currentUser: UserType | null;
  tenantScoped?: boolean;
}

const AVAILABLE_MODULES = [
  { id: 'extensions',      label: 'SIP Extensions',    desc: 'Create, modify, and delete extensions' },
  { id: 'tenant-dids',     label: 'Assigned DIDs',     desc: 'View tenant inbound phone numbers' },
  { id: 'call-routing',    label: 'Call Routing',      desc: 'Inbound and outbound route rules' },
  { id: 'queues',          label: 'Call Queues',       desc: 'Queue management and ACD agents' },
  { id: 'hunt-groups',     label: 'Hunt Groups',       desc: 'Sequential and simultaneous ring lists' },
  { id: 'ivr',             label: 'IVR Flows',         desc: 'Visual IVR menu and DTMF designer' },
  { id: 'audio-prompts',   label: 'Audio Prompts',     desc: 'Upload audio files & sound library' },
  { id: 'voicemail',       label: 'Voicemail',         desc: 'Voicemail boxes and email routing' },
  { id: 'call-forwarding', label: 'Call Forwarding',   desc: 'Forward-always, busy, & follow-me' },
  { id: 'reports',         label: 'CDR & Reports',     desc: 'Call detail records & analytics' },
];

export const UsersView: React.FC<UsersViewProps> = ({ token, currentUser, tenantScoped = false }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [usersList, setUsersList] = useState<UserType[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState(tenantScoped ? 'SUB_ADMIN' : 'TENANT_ADMIN');
  const [tenantId, setTenantId] = useState('');
  const [selectedModules, setSelectedModules] = useState<string[]>(['extensions', 'reports']);

  // Edit Permissions Modal
  const [permModalUser, setPermModalUser] = useState<UserType | null>(null);
  const [editModules, setEditModules] = useState<string[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const tenantFilter = tenantScoped && currentUser?.tenant_id ? currentUser.tenant_id : undefined;
      const [uList, tList] = await Promise.all([
        apiService.getUsers(token, tenantFilter),
        currentUser?.role === 'SUPER_ADMIN' ? apiService.getTenants(token) : Promise.resolve([]),
      ]);
      setUsersList(uList);
      setTenants(tList);
      if (tenantScoped && currentUser?.tenant_id) {
        setTenantId(currentUser.tenant_id);
      } else if (tList.length > 0 && !tenantId) {
        setTenantId(tList[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const toggleModule = (modId: string) => {
    setSelectedModules(prev =>
      prev.includes(modId) ? prev.filter(m => m !== modId) : [...prev, modId]
    );
  };

  const toggleEditModule = (modId: string) => {
    setEditModules(prev =>
      prev.includes(modId) ? prev.filter(m => m !== modId) : [...prev, modId]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      await apiService.createUser(token, {
        tenant_id: tenantId || (currentUser?.tenant_id ?? undefined),
        username,
        email,
        password,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        role,
        allowed_modules: role === 'SUB_ADMIN' ? selectedModules : [],
      });
      setShowModal(false);
      showSuccessModal(
        'User Account Provisioned',
        `User account "${username}" (${email}) has been successfully created with role ${role}.`
      );
      setUsername('');
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setSelectedModules(['extensions', 'reports']);
      fetchData();
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err.message || JSON.stringify(err);
      setError(msg);
      showErrorModal('Failed to Create User', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !permModalUser) return;
    setSavingPerms(true);
    try {
      await apiService.updateUserPermissions(token, permModalUser.id, editModules);
      showSuccessModal(
        'Sub-Admin Permissions Saved',
        `Module permissions for ${permModalUser.username} have been updated successfully.`
      );
      setPermModalUser(null);
      fetchData();
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err.message || JSON.stringify(err);
      setError(msg);
      showErrorModal('Failed to Update Permissions', msg);
    } finally {
      setSavingPerms(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm('Are you sure you want to deactivate/delete this user?')) return;
    try {
      await apiService.deleteUser(token, id);
      showSuccessModal('User Deactivated', 'The user account has been deactivated successfully.');
      fetchData();
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err.message || JSON.stringify(err);
      setError(msg);
      showErrorModal('Failed to Deactivate User', msg);
    }
  };

  const openPermModal = (u: UserType) => {
    setPermModalUser(u);
    setEditModules(u.allowed_modules || []);
  };

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.first_name && u.first_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <div className="eyebrow">{tenantScoped ? 'Tenant Governance' : 'Identity & Access Control'}</div>
          <h1 className="page-title">{tenantScoped ? 'Tenant Admins & Sub-Admins' : 'Global Users & Administrators'}</h1>
          <p className="page-sub">
            {tenantScoped
              ? 'Manage tenant administrators and create sub-admins with modular access (e.g. extensions-only, reporting-only).'
              : 'Provision Platform Super Administrators, Tenant Master Admins, Sub-Admins, and Staff across all tenants.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn-secondary">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <UserPlus className="w-4 h-4" />
            <span>{tenantScoped ? 'Provision Sub-Admin / Staff' : 'Provision User / Admin'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Toolbar & Filter */}
      <div className="card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control pl-9"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="form-control w-44"
          >
            <option value="">All Roles</option>
            {!tenantScoped && <option value="SUPER_ADMIN">SUPER_ADMIN</option>}
            <option value="TENANT_ADMIN">TENANT_ADMIN (Master)</option>
            <option value="SUB_ADMIN">SUB_ADMIN (Modular)</option>
            <option value="SUPERVISOR">SUPERVISOR</option>
            <option value="AGENT">AGENT</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          Total Users: <span className="text-slate-900">{usersList.length}</span>
        </div>
      </div>

      {/* Data Table */}
      <div className="card overflow-hidden">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email Address</th>
                <th>Full Name</th>
                <th>Assigned Tenant</th>
                <th>Role</th>
                <th>Module Permissions</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u: UserType) => (
                <tr key={u.id}>
                  <td className="font-bold text-slate-900">{u.username}</td>
                  <td className="font-mono text-slate-600 text-xs">{u.email}</td>
                  <td className="text-slate-700">
                    {u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}` : '—'}
                  </td>
                  <td className="font-mono text-xs text-slate-600">
                    {u.tenant_domain ? u.tenant_domain : 'Global (Platform)'}
                  </td>
                  <td>
                    <span
                      className={`terrix-badge ${
                        u.role === 'SUPER_ADMIN'
                          ? 'orange'
                          : u.role === 'TENANT_ADMIN'
                          ? 'green'
                          : u.role === 'SUB_ADMIN'
                          ? 'blue'
                          : 'grey'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td>
                    {u.role === 'SUPER_ADMIN' ? (
                      <span className="text-xs text-amber-600 font-semibold">All Platform Modules (Full)</span>
                    ) : u.role === 'TENANT_ADMIN' ? (
                      <span className="text-xs text-emerald-600 font-semibold">All Tenant Modules (Master)</span>
                    ) : u.role === 'SUB_ADMIN' ? (
                      <div className="flex flex-wrap gap-1 items-center">
                        {(u.allowed_modules && u.allowed_modules.length > 0) ? (
                          u.allowed_modules.map((m: string) => (
                            <span key={m} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] border border-blue-200">
                              {m}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">None assigned</span>
                        )}
                        <button
                          onClick={() => openPermModal(u)}
                          className="ml-1 p-1 text-slate-400 hover:text-blue-600 rounded"
                          title="Edit Sub-Admin Module Permissions"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Standard role access</span>
                    )}
                  </td>
                  <td className="text-right">
                    {u.role === 'SUB_ADMIN' && (
                      <button
                        onClick={() => openPermModal(u)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border-0 bg-transparent cursor-pointer mr-1"
                        title="Configure Module Access"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border-0 bg-transparent cursor-pointer"
                      title="Deactivate User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    No users found. Click "Provision User" to create administrative accounts.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="terrix-modal max-w-xl">
            <div className="modal-head">
              <div className="modal-icon">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3>Provision Administrative Account</h3>
                <p>Create a Tenant Administrator, Sub-Administrator, or Staff account</p>
              </div>
              <button onClick={() => setShowModal(false)} className="modal-close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body space-y-4">
                {currentUser?.role === 'SUPER_ADMIN' && tenants.length > 0 && !tenantScoped && (
                  <div>
                    <label className="form-label">Assign to Tenant Domain</label>
                    <select
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                      className="form-control"
                      required
                    >
                      <option value="">-- Global (Super Admin only) --</option>
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.domain})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      placeholder="e.g. jdoe_admin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="form-control"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      placeholder="jdoe@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-control"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="form-control"
                    />
                  </div>
                  <div>
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-control"
                      required
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="form-label">User Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="form-control"
                    >
                      {!tenantScoped && currentUser?.role === 'SUPER_ADMIN' && (
                        <option value="SUPER_ADMIN">SUPER_ADMIN (Platform Master)</option>
                      )}
                      <option value="TENANT_ADMIN">TENANT_ADMIN (Tenant Master)</option>
                      <option value="SUB_ADMIN">SUB_ADMIN (Granular Modules)</option>
                      <option value="SUPERVISOR">SUPERVISOR (Call Center)</option>
                      <option value="AGENT">AGENT (Extension User)</option>
                    </select>
                  </div>
                </div>

                {/* Sub-Admin Module Selector */}
                {role === 'SUB_ADMIN' && (
                  <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-200 space-y-3">
                    <div className="flex items-center gap-2 text-blue-900 font-semibold text-xs">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Assign Allowed Modules for this Sub-Admin</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Select which PBX management sections this sub-administrator is permitted to view and manage:
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {AVAILABLE_MODULES.map((mod) => {
                        const checked = selectedModules.includes(mod.id);
                        return (
                          <div
                            key={mod.id}
                            onClick={() => toggleModule(mod.id)}
                            className={`p-2.5 rounded-lg border cursor-pointer text-xs transition-colors flex items-start gap-2 ${
                              checked
                                ? 'bg-blue-100/70 border-blue-400 text-blue-950 font-medium'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {}}
                              className="mt-0.5 rounded text-blue-600 pointer-events-none"
                            />
                            <div>
                              <div className="font-semibold">{mod.label}</div>
                              <div className="text-[10px] text-slate-500">{mod.desc}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-foot">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Permissions Modal for Sub-Admin */}
      {permModalUser && (
        <div className="modal-backdrop">
          <div className="terrix-modal max-w-lg">
            <div className="modal-head">
              <div className="modal-icon">
                <ShieldAlert className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3>Edit Sub-Admin Permissions</h3>
                <p>User: <b>{permModalUser.username}</b> ({permModalUser.email})</p>
              </div>
              <button onClick={() => setPermModalUser(null)} className="modal-close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePermissions}>
              <div className="modal-body space-y-3">
                <p className="text-xs text-slate-600">
                  Configure module access for this sub-admin. They will only see the selected tabs in their navigation:
                </p>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  {AVAILABLE_MODULES.map((mod) => {
                    const checked = editModules.includes(mod.id);
                    return (
                      <div
                        key={mod.id}
                        onClick={() => toggleEditModule(mod.id)}
                        className={`p-2.5 rounded-lg border cursor-pointer text-xs transition-colors flex items-start gap-2 ${
                          checked
                            ? 'bg-blue-100/70 border-blue-400 text-blue-950 font-medium'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="mt-0.5 rounded text-blue-600 pointer-events-none"
                        />
                        <div>
                          <div className="font-semibold">{mod.label}</div>
                          <div className="text-[10px] text-slate-500">{mod.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="modal-foot">
                <button type="button" onClick={() => setPermModalUser(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={savingPerms} className="btn-primary">
                  {savingPerms ? 'Saving Permissions...' : 'Update Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
