import { useToast } from './ToastProvider';
import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, RefreshCw, Trash2, Search, X, AlertCircle, ShieldCheck, ShieldAlert, Settings,
  Phone, Hash, PhoneCall, PhoneForwarded, GitBranch, Music, Voicemail, ArrowLeftRight, BarChart2
} from 'lucide-react';
import { apiService } from '../services/api';
import type { User as UserType, Tenant } from '../types';

interface UsersViewProps {
  token: string | null;
  currentUser: UserType | null;
  tenantScoped?: boolean;
}

const AVAILABLE_MODULES = [
  { id: 'extensions',      label: 'SIP Extensions',    desc: 'Create, modify, and delete extensions', icon: Phone },
  { id: 'tenant-dids',     label: 'Assigned DIDs',     desc: 'View tenant inbound phone numbers',     icon: Hash },
  { id: 'call-routing',    label: 'Call Routing',      desc: 'Inbound and outbound route rules',       icon: PhoneCall },
  { id: 'queues',          label: 'Call Queues',       desc: 'Queue management and ACD agents',        icon: Users },
  { id: 'hunt-groups',     label: 'Hunt Groups',       desc: 'Sequential and simultaneous ring lists', icon: PhoneForwarded },
  { id: 'ivr',             label: 'IVR Flows',         desc: 'Visual IVR menu and DTMF designer',      icon: GitBranch },
  { id: 'audio-prompts',   label: 'Audio Prompts',     desc: 'Upload audio files & sound library',     icon: Music },
  { id: 'voicemail',       label: 'Voicemail',         desc: 'Voicemail boxes and email routing',      icon: Voicemail },
  { id: 'call-forwarding', label: 'Call Forwarding',   desc: 'Forward-always, busy, & follow-me',      icon: ArrowLeftRight },
  { id: 'reports',         label: 'CDR & Reports',     desc: 'Call detail records & analytics',        icon: BarChart2 },
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
      const tenantFilter = (tenantScoped && currentUser?.tenant_id && currentUser.tenant_id !== 'undefined' && currentUser.tenant_id !== 'null')
        ? currentUser.tenant_id
        : undefined;
      const [uRes, tRes] = await Promise.allSettled([
        apiService.getUsers(token, tenantFilter),
        currentUser?.role === 'SUPER_ADMIN' ? apiService.getTenants(token) : Promise.resolve([]),
      ]);

      if (uRes.status === 'fulfilled') {
        setUsersList(uRes.value);
      } else {
        setError(uRes.reason?.message || 'Failed to fetch users');
      }

      if (tRes.status === 'fulfilled') {
        setTenants(tRes.value);
        if (tenantScoped && currentUser?.tenant_id) {
          setTenantId(currentUser.tenant_id);
        } else if (tRes.value.length > 0 && !tenantId) {
          setTenantId(tRes.value[0].id);
        }
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

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control pl-9 text-xs"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="form-control text-xs w-40 shrink-0"
          >
            <option value="">All Roles</option>
            {!tenantScoped && <option value="SUPER_ADMIN">SUPER_ADMIN</option>}
            <option value="TENANT_ADMIN">TENANT_ADMIN</option>
            <option value="SUB_ADMIN">SUB_ADMIN</option>
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

      {/* ── Provision User Modal (Clean, Modern, Intuitive) ───────────────────── */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="terrix-modal" style={{ maxWidth: '640px', width: '100%', borderRadius: '16px', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{
              height: '68px',
              padding: '0 24px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              background: '#FFFFFF'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#FFF0EC',
                color: '#FF5430',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <UserPlus size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                  Provision Administrative Account
                </h3>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
                  Create an administrator or sub-admin with role-based permissions
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#F8FAFC',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div style={{ padding: '20px 24px', maxHeight: 'calc(85vh - 132px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {currentUser?.role === 'SUPER_ADMIN' && tenants.length > 0 && !tenantScoped && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Assign to Tenant Domain <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <select
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                      className="form-control"
                      style={{ height: '38px', borderRadius: '8px', fontSize: '13px' }}
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

                {/* Row 1: Username & Email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Username <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. jdoe_admin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="form-control"
                      style={{ height: '38px', borderRadius: '8px', fontSize: '13px', padding: '0 12px' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Email Address <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="jdoe@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-control"
                      style={{ height: '38px', borderRadius: '8px', fontSize: '13px', padding: '0 12px' }}
                      required
                    />
                  </div>
                </div>

                {/* Row 2: First Name & Last Name */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      First Name
                    </label>
                    <input
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="form-control"
                      style={{ height: '38px', borderRadius: '8px', fontSize: '13px', padding: '0 12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="form-control"
                      style={{ height: '38px', borderRadius: '8px', fontSize: '13px', padding: '0 12px' }}
                    />
                  </div>
                </div>

                {/* Row 3: Password & Role */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Password <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-control"
                      style={{ height: '38px', borderRadius: '8px', fontSize: '13px', padding: '0 12px' }}
                      required
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      User Role <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="form-control"
                      style={{ height: '38px', borderRadius: '8px', fontSize: '13px' }}
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

                {/* ── Sub-Admin Module Selector (Modern Tiles & Clear Hierarchy) ── */}
                {role === 'SUB_ADMIN' && (
                  <div style={{
                    marginTop: '4px',
                    background: '#FAFAFA',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    padding: '16px'
                  }}>
                    {/* Section Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '7px',
                          background: '#FFF0EC',
                          color: '#FF5430',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <ShieldCheck size={15} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                            Module Access Permissions
                          </span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            background: selectedModules.length > 0 ? '#FFF0EC' : '#F1F5F9',
                            color: selectedModules.length > 0 ? '#FF5430' : '#64748B',
                            padding: '2px 8px',
                            borderRadius: '12px'
                          }}>
                            {selectedModules.length} of {AVAILABLE_MODULES.length} Selected
                          </span>
                        </div>
                      </div>

                      {/* Quick Select All / Clear All */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedModules(AVAILABLE_MODULES.map(m => m.id))}
                          style={{ background: 'none', border: 'none', color: '#FF5430', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                        >
                          Select All
                        </button>
                        <span style={{ color: '#CBD5E1' }}>•</span>
                        <button
                          type="button"
                          onClick={() => setSelectedModules([])}
                          style={{ background: 'none', border: 'none', color: '#64748B', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <p style={{ fontSize: '11.5px', color: '#64748B', margin: '0 0 12px 0' }}>
                      Check which PBX management sections this sub-administrator is permitted to view and manage.
                    </p>

                    {/* Module Cards Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
                      {AVAILABLE_MODULES.map((mod) => {
                        const checked = selectedModules.includes(mod.id);
                        const IconComponent = mod.icon;
                        return (
                          <div
                            key={mod.id}
                            onClick={() => toggleModule(mod.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '9px 12px',
                              borderRadius: '9px',
                              cursor: 'pointer',
                              background: checked ? '#FFF9F7' : '#FFFFFF',
                              border: `1px solid ${checked ? '#FF8A65' : '#E2E8F0'}`,
                              boxShadow: checked ? '0 1px 3px rgba(255, 84, 48, 0.08)' : '0 1px 2px rgba(0,0,0,0.02)',
                              transition: 'all 0.15s ease',
                              userSelect: 'none'
                            }}
                          >
                            {/* Module Icon Badge */}
                            <div style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '7px',
                              background: checked ? '#FF5430' : '#F1F5F9',
                              color: checked ? '#FFFFFF' : '#64748B',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              transition: 'all 0.15s ease'
                            }}>
                              <IconComponent size={15} />
                            </div>

                            {/* Label & Description */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                color: checked ? '#0F172A' : '#334155',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {mod.label}
                              </div>
                              <div style={{
                                fontSize: '10.5px',
                                color: '#64748B',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                marginTop: '1px'
                              }}>
                                {mod.desc}
                              </div>
                            </div>

                            {/* Checkbox indicator */}
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {}}
                              style={{
                                accentColor: '#FF5430',
                                width: '15px',
                                height: '15px',
                                cursor: 'pointer',
                                flexShrink: 0,
                                pointerEvents: 'none'
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{
                height: '64px',
                padding: '0 24px',
                borderTop: '1px solid #F1F5F9',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '12px',
                background: '#FFFFFF'
              }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                  style={{ padding: '9px 18px', fontSize: '13px', borderRadius: '8px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{
                    background: '#FF5430',
                    padding: '9px 22px',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: '8px',
                    boxShadow: '0 2px 6px rgba(255, 84, 48, 0.25)'
                  }}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Permissions Modal for Sub-Admin ────────────────────────────── */}
      {permModalUser && (
        <div className="modal-backdrop">
          <div className="terrix-modal" style={{ maxWidth: '640px', width: '100%', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{
              height: '68px',
              padding: '0 24px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              background: '#FFFFFF'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#FFF0EC',
                color: '#FF5430',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <ShieldAlert size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                  Edit Sub-Admin Permissions
                </h3>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
                  User: <strong>{permModalUser.username}</strong> ({permModalUser.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPermModalUser(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#F8FAFC',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePermissions}>
              <div style={{ padding: '20px 24px', maxHeight: 'calc(85vh - 132px)', overflowY: 'auto' }}>
                <div style={{
                  background: '#FAFAFA',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '16px'
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                        Module Access Permissions
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        background: editModules.length > 0 ? '#FFF0EC' : '#F1F5F9',
                        color: editModules.length > 0 ? '#FF5430' : '#64748B',
                        padding: '2px 8px',
                        borderRadius: '12px'
                      }}>
                        {editModules.length} of {AVAILABLE_MODULES.length} Selected
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px' }}>
                      <button
                        type="button"
                        onClick={() => setEditModules(AVAILABLE_MODULES.map(m => m.id))}
                        style={{ background: 'none', border: 'none', color: '#FF5430', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                      >
                        Select All
                      </button>
                      <span style={{ color: '#CBD5E1' }}>•</span>
                      <button
                        type="button"
                        onClick={() => setEditModules([])}
                        style={{ background: 'none', border: 'none', color: '#64748B', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: '11.5px', color: '#64748B', margin: '0 0 12px 0' }}>
                    Configure the management modules visible to this sub-admin. They will only see selected tabs in their navigation.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
                    {AVAILABLE_MODULES.map((mod) => {
                      const checked = editModules.includes(mod.id);
                      const IconComponent = mod.icon;
                      return (
                        <div
                          key={mod.id}
                          onClick={() => toggleEditModule(mod.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '9px 12px',
                            borderRadius: '9px',
                            cursor: 'pointer',
                            background: checked ? '#FFF9F7' : '#FFFFFF',
                            border: `1px solid ${checked ? '#FF8A65' : '#E2E8F0'}`,
                            boxShadow: checked ? '0 1px 3px rgba(255, 84, 48, 0.08)' : '0 1px 2px rgba(0,0,0,0.02)',
                            transition: 'all 0.15s ease',
                            userSelect: 'none'
                          }}
                        >
                          <div style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '7px',
                            background: checked ? '#FF5430' : '#F1F5F9',
                            color: checked ? '#FFFFFF' : '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.15s ease'
                          }}>
                            <IconComponent size={15} />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              color: checked ? '#0F172A' : '#334155',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {mod.label}
                            </div>
                            <div style={{
                              fontSize: '10.5px',
                              color: '#64748B',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              marginTop: '1px'
                            }}>
                              {mod.desc}
                            </div>
                          </div>

                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {}}
                            style={{
                              accentColor: '#FF5430',
                              width: '15px',
                              height: '15px',
                              cursor: 'pointer',
                              flexShrink: 0,
                              pointerEvents: 'none'
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{
                height: '64px',
                padding: '0 24px',
                borderTop: '1px solid #F1F5F9',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '12px',
                background: '#FFFFFF'
              }}>
                <button
                  type="button"
                  onClick={() => setPermModalUser(null)}
                  className="btn-secondary"
                  style={{ padding: '9px 18px', fontSize: '13px', borderRadius: '8px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPerms}
                  className="btn-primary"
                  style={{
                    background: '#FF5430',
                    padding: '9px 22px',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: '8px',
                    boxShadow: '0 2px 6px rgba(255, 84, 48, 0.25)'
                  }}
                >
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
