import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import type { Tenant, User } from '../types';
import { Plus, RefreshCw, Edit2, Trash2 } from 'lucide-react';

// Design System imports
import { PageHeader } from './layout';
import { Stack, Inline, Grid } from './layout/Stack';
import { Button, Card, Badge, Alert, Modal, FormField, Input } from './ui';
import { DataTable, FilterBar } from './patterns';
import type { Column } from './patterns';

interface TenantsViewProps {
  token: string;
  user?: User | null;
}

export const TenantsView: React.FC<TenantsViewProps> = ({ token }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');

  // Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [sipDomain, setSipDomain] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    domain: '',
    sip_domain: '',
    timezone: 'UTC',
    max_extensions: 100,
    max_concurrent_calls: 20
  });

  const fetchTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getTenants(token);
      setTenants(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tenants list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    try {
      setLoading(true);
      await apiService.createTenant(token, {
        name,
        domain,
        sip_domain: sipDomain,
      });
      setShowModal(false);
      setName('');
      setDomain('');
      setSipDomain('');
      fetchTenants();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (tenant: Tenant) => {
    setEditingTenantId(tenant.id);
    setEditFormData({
      name: tenant.name,
      domain: tenant.domain,
      sip_domain: tenant.sip_domain,
      timezone: tenant.timezone || 'UTC',
      max_extensions: tenant.max_extensions || 100,
      max_concurrent_calls: tenant.max_concurrent_calls || 20
    });
    setShowEditModal(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenantId) return;
    try {
      setLoading(true);
      await apiService.updateTenant(token, editingTenantId, editFormData);
      setShowEditModal(false);
      setEditingTenantId(null);
      fetchTenants();
    } catch (err: any) {
      setError(err.message || 'Failed to update tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) return;
    try {
      setLoading(true);
      await apiService.deleteTenant(token, id);
      fetchTenants();
    } catch (err: any) {
      setError(err.message || 'Failed to delete tenant');
      setLoading(false);
    }
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.sip_domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<Tenant>[] = [
    { key: 'name', header: 'Tenant Name', sortable: true, render: (t: Tenant) => <span className="font-bold">{t.name}</span> },
    { key: 'domain', header: 'Web Domain', render: (t: Tenant) => <span className="font-mono">{t.domain}</span> },
    { key: 'sip_domain', header: 'SIP Domain', render: (t: Tenant) => <span className="font-mono">{t.sip_domain}</span> },
    { key: 'timezone', header: 'Timezone' },
    { key: 'max_extensions', header: 'Max Ext', render: (t: Tenant) => <span className="font-semibold">{t.max_extensions}</span> },
    { key: 'max_concurrent_calls', header: 'Max Calls', render: (t: Tenant) => <span className="font-semibold">{t.max_concurrent_calls}</span> },
    { key: 'enabled', header: 'Status', render: () => <Badge variant="success">Active</Badge> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants Registry"
        subtitle="Isolated multi-tenant domain mapping for PBX routing (`/api/v1/tenants`)."
        actions={
          <Inline gap="3">
            <Button variant="secondary" onClick={fetchTenants} isLoading={loading} leftIcon={<RefreshCw size={14} />}>
              Refresh
            </Button>
            <Button variant="primary" onClick={() => setShowModal(true)} leftIcon={<Plus size={16} />}>
              Add New Tenant
            </Button>
          </Inline>
        }
      />

      {error && <Alert variant="danger">{error}</Alert>}

      <Card padding="sm">
        <FilterBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search tenant name or domain..."
          actions={
            <div className="text-xs font-semibold text-[var(--pbx-text-secondary)]">
              Total Registered Tenants: <span className="text-[var(--pbx-text-primary)]">{tenants.length}</span>
            </div>
          }
        />

        <DataTable
          columns={columns}
          data={filteredTenants}
          isLoading={loading}
          emptyTitle="No tenants found"
          emptyDescription='Click "Add New Tenant" to provision a tenant domain.'
          actions={(t: Tenant) => (
            <Inline gap="1" justify="flex-end">
              <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(t)}>
                <Edit2 size={14} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
                <Trash2 size={14} className="text-rose-600" />
              </Button>
            </Inline>
          )}
        />
      </Card>

      {/* Create Tenant Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Provision New Tenant"
        subtitle="Add a new isolated tenant entity to the PBX platform"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate} isLoading={loading}>
              Provision Tenant
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          <Stack gap="4">
            {modalError && <Alert variant="danger">{modalError}</Alert>}

            <FormField label="Tenant Name" required>
              <Input
                type="text"
                placeholder="Acme Corporation"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Web Domain" required>
              <Input
                type="text"
                placeholder="acme.pbx.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                required
              />
            </FormField>

            <FormField label="SIP Domain (FreeSWITCH)" required>
              <Input
                type="text"
                placeholder="acme.local"
                value={sipDomain}
                onChange={(e) => setSipDomain(e.target.value)}
                required
              />
            </FormField>
          </Stack>
        </form>
      </Modal>

      {/* Edit Tenant Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingTenantId(null); }}
        title="Edit Tenant"
        subtitle={`Modify settings and resource quotas for ${editFormData.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setEditingTenantId(null); }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateSubmit} isLoading={loading}>
              Save Tenant Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateSubmit}>
          <Stack gap="4">
            <FormField label="Tenant Name" required>
              <Input
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />
            </FormField>

            <Grid cols={2} gap="4">
              <FormField label="Web Domain" required>
                <Input
                  type="text"
                  value={editFormData.domain}
                  onChange={(e) => setEditFormData({ ...editFormData, domain: e.target.value })}
                  required
                />
              </FormField>

              <FormField label="SIP Domain" required>
                <Input
                  type="text"
                  value={editFormData.sip_domain}
                  onChange={(e) => setEditFormData({ ...editFormData, sip_domain: e.target.value })}
                  required
                />
              </FormField>
            </Grid>

            <Grid cols={3} gap="4">
              <FormField label="Timezone">
                <Input
                  type="text"
                  value={editFormData.timezone}
                  onChange={(e) => setEditFormData({ ...editFormData, timezone: e.target.value })}
                />
              </FormField>

              <FormField label="Max Extensions">
                <Input
                  type="number"
                  value={editFormData.max_extensions}
                  onChange={(e) => setEditFormData({ ...editFormData, max_extensions: parseInt(e.target.value) || 0 })}
                />
              </FormField>

              <FormField label="Max Calls">
                <Input
                  type="number"
                  value={editFormData.max_concurrent_calls}
                  onChange={(e) => setEditFormData({ ...editFormData, max_concurrent_calls: parseInt(e.target.value) || 0 })}
                />
              </FormField>
            </Grid>
          </Stack>
        </form>
      </Modal>
    </div>
  );
};
