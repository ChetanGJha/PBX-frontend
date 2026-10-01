import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import type { User as UserType } from '../types';
import { UserPlus, RefreshCw, Trash2, Settings } from 'lucide-react';

// Design System imports
import { PageHeader } from './layout';
import { Stack, Inline, Grid } from './layout/Stack';
import { Button, Card, Badge, Alert, Modal, FormField, Input, Select, Checkbox } from './ui';
import { DataTable, FilterBar } from './patterns';
import type { Column } from './patterns';

const AVAILABLE_MODULES = [
  { id: 'dashboard', label: 'Dashboard Overview', icon: 'LayoutDashboard', desc: 'System status & KPI widgets' },
  { id: 'tenants', label: 'Tenants Registry', icon: 'Building2', desc: 'Tenant provisioning' },
  { id: 'users', label: 'User Administration', icon: 'Users', desc: 'RBAC user management' },
  { id: 'extensions', label: 'Extensions & SIP', icon: 'Phone', desc: 'Extension provisioning' },
  { id: 'trunks', label: 'SIP Trunks & Gateways', icon: 'Server', desc: 'Upstream trunk routing' },
  { id: 'dids', label: 'Inbound DIDs', icon: 'PhoneIncoming', desc: 'Phone number assignment' },
  { id: 'routing', label: 'Dialplan & Outbound', icon: 'GitMerge', desc: 'Call routing logic' },
  { id: 'queues', label: 'Call Queues & ACD', icon: 'Users2', desc: 'Call distribution' },
  { id: 'huntgroups', label: 'Ring / Hunt Groups', icon: 'PhoneCall', desc: 'Multi-extension ringing' },
  { id: 'ivrs', label: 'IVR Auto-Attendants', icon: 'GitFork', desc: 'Interactive voice response' },
  { id: 'voicemail', label: 'Voicemail & Recording', icon: 'Voicemail', desc: 'Voicemail boxes' },
  { id: 'callforwarding', label: 'Call Forwarding', icon: 'PhoneForwarded', desc: 'Forwarding rules' },
  { id: 'audio', label: 'Audio Prompts Library', icon: 'Music', desc: 'Audio prompt assets' },
  { id: 'businesshours', label: 'Business Hours & Time', icon: 'Clock', desc: 'Schedule-based routing' },
  { id: 'conferences', label: 'Conference Bridges', icon: 'Users', desc: 'Multi-party conferencing' },
  { id: 'callblock', label: 'Call Blocking / Blacklist', icon: 'ShieldAlert', desc: 'Inbound spam block' },
  { id: 'contacts', label: 'Phonebook Contacts', icon: 'BookOpen', desc: 'Tenant contacts' },
  { id: 'emailsettings', label: 'SMTP & Notification', icon: 'Mail', desc: 'Email alerts' },
  { id: 'reports', label: 'CDR & Analytics', icon: 'BarChart2', desc: 'Call detail records' },
  { id: 'xmlcurlconsole', label: 'xml_curl Console', icon: 'Code', desc: 'FreeSWITCH XML Debugger' },
  { id: 'xmlcurltester', label: 'xml_curl Route Tester', icon: 'Terminal', desc: 'Dialplan Simulator' },
];

interface UsersViewProps {
  token: string;
  currentUser?: UserType | null;
  tenantScoped?: boolean;
}

export const UsersView: React.FC<UsersViewProps> = ({ token, currentUser, tenantScoped = false }) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [tenantFilter, setTenantFilter] = useState<string>('');

  // Create User Form
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState(tenantScoped ? 'SUB_ADMIN' : 'TENANT_ADMIN');
  const [targetTenantId, setTargetTenantId] = useState('');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  // Permissions Modal
  const [permModalUser, setPermModalUser] = useState<UserType | null>(null);
  const [editModules, setEditModules] = useState<string[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [uRes, tRes] = await Promise.allSettled([
        apiService.getUsers(token),
        currentUser?.role === 'SUPER_ADMIN' ? apiService.getTenants(token) : Promise.resolve([])
      ]);
      if (uRes.status === 'fulfilled') setUsers(uRes.value);
      if (tRes.status === 'fulfilled') setTenants(tRes.value);
    } catch (err: any) {
      setError(err.message || 'Failed to load user accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const payload: any = {
        username,
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role,
      };

      if (!tenantScoped && currentUser?.role === 'SUPER_ADMIN' && targetTenantId) {
        payload.tenant_id = targetTenantId;
      } else if (tenantScoped && currentUser?.tenant_id) {
        payload.tenant_id = currentUser.tenant_id;
      }

      if (role === 'SUB_ADMIN') {
        payload.allowed_modules = selectedModules;
      }

      await apiService.createUser(token, payload);
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to create user account');
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setRole(tenantScoped ? 'SUB_ADMIN' : 'TENANT_ADMIN');
    setTargetTenantId('');
    setSelectedModules([]);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate/delete this user?')) return;
    try {
      setLoading(true);
      await apiService.deleteUser(token, id);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
      setLoading(false);
    }
  };

  const openPermModal = (user: UserType) => {
    setPermModalUser(user);
    setEditModules(user.allowed_modules || []);
  };

  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permModalUser) return;
    setSavingPerms(true);
    try {
      await apiService.updateUserPermissions(token, permModalUser.id, editModules);
      setPermModalUser(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to update permissions');
    } finally {
      setSavingPerms(false);
    }
  };

  const toggleModule = (id: string) => {
    setSelectedModules(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const toggleEditModule = (id: string) => {
    setEditModules(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const filteredUsers = users.filter((u) => {
    if (tenantScoped && currentUser?.tenant_id && u.tenant_id !== currentUser.tenant_id) {
      return false;
    }
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.first_name && u.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.last_name && u.last_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    const matchesTenant = tenantFilter
      ? (tenantFilter === 'global' ? (!u.tenant_id || u.tenant_id === 'global') : u.tenant_id === tenantFilter)
      : true;
    return matchesSearch && matchesRole && matchesTenant;
  });

  const canManage = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'TENANT_ADMIN';

  const columns: Column<UserType>[] = [
    { key: 'username', header: 'Username', sortable: true, render: (u: UserType) => <span className="font-bold">{u.username}</span> },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (u: UserType) => <Badge variant="primary">{u.role}</Badge> },
    { key: 'tenant_domain', header: 'Tenant Domain', render: (u: UserType) => <span className="font-mono">{u.tenant_domain || 'Global'}</span> },
    { key: 'status', header: 'Status', render: () => <Badge variant="success">Active</Badge> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={tenantScoped ? 'Tenant Admins & Sub-Admins' : 'Global Users & Administrators'}
        subtitle={
          tenantScoped
            ? 'Manage tenant administrators and create sub-admins with modular access (e.g. extensions-only, reporting-only).'
            : 'Provision Platform Super Administrators, Tenant Master Admins, Sub-Admins, and Staff across all tenants.'
        }
        actions={
          <Inline gap="3">
            <Button variant="secondary" onClick={fetchData} isLoading={loading} leftIcon={<RefreshCw size={14} />}>
              Refresh
            </Button>
            {canManage && (
              <Button variant="primary" onClick={() => setShowModal(true)} leftIcon={<UserPlus size={16} />}>
                {tenantScoped ? 'Provision Sub-Admin / Staff' : 'Provision User / Admin'}
              </Button>
            )}
          </Inline>
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}

      <Card padding="sm">
        <FilterBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search username or email..."
          filters={
            <Inline gap="3">
              <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-40">
                <option value="">All Roles</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                <option value="TENANT_ADMIN">TENANT_ADMIN</option>
                <option value="SUB_ADMIN">SUB_ADMIN</option>
                <option value="SUPERVISOR">SUPERVISOR</option>
                <option value="AGENT">AGENT</option>
              </Select>

              {currentUser?.role === 'SUPER_ADMIN' && !tenantScoped && tenants.length > 0 && (
                <Select value={tenantFilter} onChange={(e) => setTenantFilter(e.target.value)} className="w-48">
                  <option value="">All Tenants</option>
                  <option value="global">Global / System</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.domain})
                    </option>
                  ))}
                </Select>
              )}
            </Inline>
          }
          actions={
            <div className="text-xs font-semibold text-[var(--pbx-text-secondary)]">
              Total Users: <span className="text-[var(--pbx-text-primary)]">{filteredUsers.length}</span>
            </div>
          }
        />

        <DataTable
          columns={columns}
          data={filteredUsers}
          isLoading={loading}
          emptyTitle="No users found"
          emptyDescription="Provision a new user account to get started."
          actions={(u: UserType) => (
            <Inline gap="1" justify="flex-end">
              {u.role === 'SUB_ADMIN' && (
                <Button variant="ghost" size="sm" onClick={() => openPermModal(u)} title="Configure Permissions">
                  <Settings size={14} />
                </Button>
              )}
              {canManage && (
                <Button variant="ghost" size="sm" onClick={() => handleDelete(u.id)} title="Deactivate User">
                  <Trash2 size={14} className="text-rose-600" />
                </Button>
              )}
            </Inline>
          )}
        />
      </Card>

      {/* Create User Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={tenantScoped ? 'Provision Sub-Admin / Staff' : 'Provision User / Admin Account'}
        subtitle="Create credentials and assign domain role & permissions"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate} isLoading={loading}>
              Create User Account
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          <Stack gap="4">
            <Grid cols={2} gap="4">
              <FormField label="First Name">
                <Input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" />
              </FormField>
              <FormField label="Last Name">
                <Input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
              </FormField>
            </Grid>

            <FormField label="Username" required>
              <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="johndoe" required />
            </FormField>

            <FormField label="Email Address" required>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@company.com" required />
            </FormField>

            <FormField label="Password" required>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="SecretPassword123!" required />
            </FormField>

            <FormField label="Role" required>
              <Select value={role} onChange={(e) => setRole(e.target.value)}>
                {!tenantScoped && currentUser?.role === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">SUPER_ADMIN</option>}
                <option value="TENANT_ADMIN">TENANT_ADMIN</option>
                <option value="SUB_ADMIN">SUB_ADMIN (Custom Modules)</option>
                <option value="SUPERVISOR">SUPERVISOR</option>
                <option value="AGENT">AGENT</option>
              </Select>
            </FormField>

            {role === 'SUB_ADMIN' && (
              <FormField label="Allowed Modules">
                <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto">
                  {AVAILABLE_MODULES.map((m) => (
                    <Checkbox
                      key={m.id}
                      label={m.label}
                      checked={selectedModules.includes(m.id)}
                      onChange={() => toggleModule(m.id)}
                    />
                  ))}
                </div>
              </FormField>
            )}
          </Stack>
        </form>
      </Modal>

      {/* Edit Permissions Modal */}
      <Modal
        isOpen={!!permModalUser}
        onClose={() => setPermModalUser(null)}
        title={`Configure Sub-Admin Permissions: ${permModalUser?.username}`}
        subtitle="Select accessible modules for this sub-admin"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPermModalUser(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSavePermissions} isLoading={savingPerms}>
              Save Permissions
            </Button>
          </>
        }
      >
        <form onSubmit={handleSavePermissions}>
          <Stack gap="3">
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_MODULES.map((m) => (
                <Checkbox
                  key={m.id}
                  label={m.label}
                  checked={editModules.includes(m.id)}
                  onChange={() => toggleEditModule(m.id)}
                />
              ))}
            </div>
          </Stack>
        </form>
      </Modal>
    </div>
  );
};
