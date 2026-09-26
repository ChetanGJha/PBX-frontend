import React, { useState, useEffect } from 'react';
import { Users, UserPlus, RefreshCw, Trash2, Search, X, AlertCircle, ShieldCheck, Building2, User } from 'lucide-react';
import { apiService } from '../services/api';
import type { User as UserType, Tenant } from '../types';

interface UsersViewProps {
  token: string | null;
  currentUser: UserType | null;
}

export const UsersView: React.FC<UsersViewProps> = ({ token, currentUser }) => {
  const [usersList, setUsersList] = useState<UserType[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('TENANT_ADMIN');
  const [tenantId, setTenantId] = useState('');

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [uList, tList] = await Promise.all([
        apiService.getUsers(token),
        currentUser?.role === 'SUPER_ADMIN' ? apiService.getTenants(token) : Promise.resolve([]),
      ]);
      setUsersList(uList);
      setTenants(tList);
      if (tList.length > 0 && !tenantId) {
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
      });
      setShowModal(false);
      setUsername('');
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm('Are you sure you want to deactivate/delete this user?')) return;
    try {
      await apiService.deleteUser(token, id);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
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
          <div className="eyebrow">User Identity & Access</div>
          <h1 className="page-title">Users & Tenant Admins</h1>
          <p className="page-sub">Provision Tenant Administrators, Supervisors, and Extension Agents across multi-tenant domains (`/api/v1/users`).</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn-secondary">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <UserPlus className="w-4 h-4" />
            <span>Provision User / Tenant Admin</span>
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
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="TENANT_ADMIN">TENANT_ADMIN</option>
            <option value="SUPERVISOR">SUPERVISOR</option>
            <option value="AGENT">AGENT</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          Total Registered Users: <span className="text-slate-900">{usersList.length}</span>
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
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u: UserType) => (
                <tr key={u.id}>
                  <td className="font-bold text-slate-900">{u.username}</td>
                  <td className="font-mono text-slate-600">{u.email}</td>
                  <td className="text-slate-700">
                    {u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}` : 'N/A'}
                  </td>
                  <td className="font-mono text-slate-600">
                    {u.tenant_domain ? `${u.tenant_domain}` : 'Global (Platform)'}
                  </td>
                  <td>
                    <span
                      className={`terrix-badge ${
                        u.role === 'SUPER_ADMIN' ? 'orange' : u.role === 'TENANT_ADMIN' ? 'green' : 'grey'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className="terrix-badge green">Active</span>
                  </td>
                  <td className="text-right">
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
                    No users found. Click "Provision User / Tenant Admin" to create user logins.
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
          <div className="terrix-modal">
            <div className="modal-head">
              <div className="modal-icon">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3>Provision User Account</h3>
                <p>Create a Tenant Administrator, Supervisor, or Agent login</p>
              </div>
              <button onClick={() => setShowModal(false)} className="modal-close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body space-y-4">
                {currentUser?.role === 'SUPER_ADMIN' && tenants.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Target Tenant</label>
                    <select
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                      className="form-control"
                    >
                      {tenants.map((t: Tenant) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.domain})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Role Assignment</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="form-control"
                  >
                    <option value="TENANT_ADMIN">TENANT_ADMIN (Tenant Administrator)</option>
                    <option value="SUPERVISOR">SUPERVISOR (Call Center Supervisor)</option>
                    <option value="AGENT">AGENT (Standard Extension User)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      placeholder="acme_admin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      placeholder="admin@acme.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-control"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    placeholder="SecurePassword123!"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
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
              </div>

              <div className="modal-foot">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Creating...' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
