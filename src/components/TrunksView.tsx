import { useToast } from './ToastProvider';
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Network, Plus, ShieldCheck, Activity, CheckCircle2, Edit2, Trash2, Info, Building2 } from 'lucide-react';
import { PageContainer } from './layout/PageContainer';
import { Stack, Inline, Grid } from './layout/Stack';
import {
  Button,
  Input,
  Select,
  FormField,
  Modal,
  Badge,
  Alert,
  Checkbox,
} from './ui';
import { DataTable, FilterBar, StatCard } from './patterns';

interface TrunksViewProps {
  token: string;
  user?: any;
  readOnly?: boolean;
}

export const TrunksView: React.FC<TrunksViewProps> = ({ token, user, readOnly }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [trunks, setTrunks] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const isReadOnly = readOnly || (user && user.role !== 'SUPER_ADMIN');

  // View Info Modal
  const [viewInfoItem, setViewInfoItem] = useState<any | null>(null);

  // Create Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 5060,
    transport: 'UDP',
    username: '',
    password: '',
    realm: '',
    priority: 1,
    tenant_id: '',
    tenant_ids: [] as string[],
    register: true,
    srtp: false
  });

  // Edit Modal
  const [editTrunk, setEditTrunk] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    host: '',
    port: 5060,
    transport: 'UDP',
    username: '',
    password: '',
    realm: '',
    priority: 1,
    tenant_id: '',
    tenant_ids: [] as string[],
    register: true,
    srtp: false
  });

  // Delete Modal
  const [deleteTrunkId, setDeleteTrunkId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [tData, gData, tenData] = await Promise.all([
        apiService.getTrunks(token).catch(() => []),
        apiService.getGateways(token).catch(() => []),
        apiService.getTenants(token).catch(() => [])
      ]);

      const combined = [
        ...(tData || []).map((t: any) => ({
          ...t,
          itemType: 'SIP Trunk',
          hostDisplay: t.host ? `${t.host}:${t.port || 5060}` : 'N/A'
        })),
        ...(gData || []).map((g: any) => ({
          ...g,
          itemType: 'Sofia Gateway',
          host: g.proxy || '',
          port: 5060,
          transport: 'UDP',
          priority: 1,
          srtp: false,
          hostDisplay: g.proxy || 'N/A'
        }))
      ];

      setTrunks(combined);
      setTenants(tenData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load SIP trunks and gateways');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        tenant_ids: formData.tenant_ids,
        tenant_id: formData.tenant_ids.length === 1 ? formData.tenant_ids[0] : null
      };
      await apiService.createTrunk(token, payload);
      setShowModal(false);
      showSuccessModal('SIP Trunk Registered', `SIP trunk "${formData.name}" (${formData.host}:${formData.port}) created successfully.`);
      setFormData({
        name: '',
        host: '',
        port: 5060,
        transport: 'UDP',
        username: '',
        password: '',
        realm: '',
        priority: 1,
        tenant_id: '',
        tenant_ids: [],
        register: true,
        srtp: false
      });
      loadData();
    } catch (err: any) {
      showErrorModal('Failed to Create Trunk', err.message || 'Failed to create SIP trunk');
    }
  };

  const handleEditClick = (trunk: any) => {
    const assignedIds: string[] = Array.isArray(trunk.tenant_ids)
      ? trunk.tenant_ids
      : (trunk.assigned_tenants && Array.isArray(trunk.assigned_tenants)
          ? trunk.assigned_tenants.map((x: any) => x.id)
          : (trunk.tenant_id ? [trunk.tenant_id] : []));

    setEditTrunk(trunk);
    setEditFormData({
      name: trunk.name || '',
      host: trunk.host || '',
      port: trunk.port || 5060,
      transport: trunk.transport || 'UDP',
      username: trunk.username || '',
      password: trunk.password || '',
      realm: trunk.realm || '',
      priority: trunk.priority || 1,
      tenant_id: assignedIds[0] || '',
      tenant_ids: assignedIds,
      register: trunk.register !== undefined ? trunk.register : true,
      srtp: trunk.srtp !== undefined ? trunk.srtp : false
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTrunk) return;
    try {
      const payload = {
        ...editFormData,
        tenant_ids: editFormData.tenant_ids,
        tenant_id: editFormData.tenant_ids.length === 1 ? editFormData.tenant_ids[0] : null
      };
      if (editTrunk.itemType === 'Sofia Gateway') {
        await apiService.updateGateway(token, editTrunk.id, payload);
      } else {
        await apiService.updateTrunk(token, editTrunk.id, payload);
      }
      setEditTrunk(null);
      showSuccessModal('Trunk / Gateway Updated', `"${editFormData.name}" updated successfully.`);
      loadData();
    } catch (err: any) {
      showErrorModal('Failed to Update', err.message || 'Failed to update trunk/gateway');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTrunkId) return;
    try {
      const itemToDelete = trunks.find(t => t.id === deleteTrunkId);
      if (itemToDelete && itemToDelete.itemType === 'Sofia Gateway') {
        await apiService.deleteGateway(token, deleteTrunkId);
      } else {
        await apiService.deleteTrunk(token, deleteTrunkId);
      }
      setDeleteTrunkId(null);
      showSuccessModal('Deleted Successfully', 'The trunk/gateway route has been removed.');
      loadData();
    } catch (err: any) {
      showErrorModal('Failed to Delete', err.message || 'Failed to delete trunk/gateway');
    }
  };

  const filtered = trunks.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.host.toLowerCase().includes(search.toLowerCase()) ||
    (t.tenant_name && t.tenant_name.toLowerCase().includes(search.toLowerCase())) ||
    (t.itemType && t.itemType.toLowerCase().includes(search.toLowerCase()))
  );

  const columns = [
    {
      key: 'name',
      header: 'Route Name',
      sortable: true,
      render: (t: any) => <strong>{t.name}</strong>,
    },
    {
      key: 'itemType',
      header: 'Type',
      render: (t: any) => (
        <Badge variant={t.itemType === 'Sofia Gateway' ? 'warning' : 'info'}>
          {t.itemType}
        </Badge>
      ),
    },
    {
      key: 'host',
      header: 'SIP Host / Proxy',
      render: (t: any) => <code>{t.host}</code>,
    },
    {
      key: 'transport',
      header: 'Transport',
      render: (t: any) => <Badge variant="neutral">{t.transport}</Badge>,
    },
    {
      key: 'assigned_tenants',
      header: 'Assigned Tenant',
      render: (t: any) => {
        if (t.assigned_tenants && t.assigned_tenants.length > 0) {
          return (
            <Inline gap="1">
              {t.assigned_tenants.map((ten: any) => (
                <Badge key={ten.id} variant="success">{ten.name}</Badge>
              ))}
            </Inline>
          );
        }
        if (t.tenant_name && t.tenant_name !== 'Shared (All Tenants)') {
          return <Badge variant="success">{t.tenant_name}</Badge>;
        }
        return <Badge variant="info">Shared (All Tenants)</Badge>;
      },
    },
    {
      key: 'username',
      header: 'Auth Username',
      render: (t: any) => t.username || 'IP Auth',
    },
    {
      key: 'enabled',
      header: 'Status',
      render: (t: any) => (
        <Badge variant={t.enabled !== false ? 'success' : 'warning'}>
          {t.enabled !== false ? 'ACTIVE' : 'DISABLED'}
        </Badge>
      ),
    },
  ];

  return (
    <PageContainer
      title={isReadOnly ? 'Assigned SIP Trunks & Gateways' : 'SIP Trunks & Gateways'}
      subtitle={
        isReadOnly 
          ? 'View active carrier SIP trunk connections and FreeSWITCH gateways allocated to your tenant.' 
          : 'Configure carrier SIP trunk connections, proxies, tenant allocations and gateway routes'
      }
      eyebrow={isReadOnly ? 'Tenant Telephony' : 'Telephony Infrastructure'}
      actions={
        !isReadOnly ? (
          <Button variant="primary" onClick={() => setShowModal(true)} leftIcon={<Plus size={16} />}>
            Add SIP Trunk
          </Button>
        ) : undefined
      }
    >
      <Stack gap="6">
        <Grid cols={4} gap="4">
          <StatCard title="Active Routes" value={trunks.length} icon={<Network size={20} />} />
          <StatCard title="Registered" value={trunks.filter(t => t.register !== false).length} icon={<CheckCircle2 size={20} />} />
          <StatCard title="Active Channels" value={trunks.filter(t => t.enabled !== false).length * 30} icon={<Activity size={20} />} />
          <StatCard title="Security (SRTP)" value={`${trunks.filter(t => t.srtp).length} Enabled`} icon={<ShieldCheck size={20} />} />
        </Grid>

        {error && <Alert variant="danger" title="Error">{error}</Alert>}

        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search gateways by name, host or tenant..."
        />

        <DataTable
          columns={columns}
          data={filtered}
          isLoading={loading}
          emptyTitle="No assigned gateways or SIP trunks found"
          actions={(t: any) => (
            <Inline gap="2" justify="center" wrap={false}>
              <Button variant="secondary" size="sm" onClick={() => setViewInfoItem(t)} title="View Info">
                <Info size={14} />
              </Button>
              {!isReadOnly && (
                <>
                  <Button variant="secondary" size="sm" onClick={() => handleEditClick(t)} title="Edit">
                    <Edit2 size={14} />
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteTrunkId(t.id)} title="Delete">
                    <Trash2 size={14} />
                  </Button>
                </>
              )}
            </Inline>
          )}
        />
      </Stack>

      {/* VIEW INFO MODAL (READ ONLY) */}
      <Modal
        isOpen={!!viewInfoItem}
        onClose={() => setViewInfoItem(null)}
        title={viewInfoItem?.name || ''}
        subtitle="Gateway Information & Configuration Overview"
        footer={<Button variant="secondary" onClick={() => setViewInfoItem(null)}>Close</Button>}
      >
        {viewInfoItem && (
          <Stack gap="4">
            <Grid cols={2} gap="3">
              <FormField label="Route Type">
                <strong>{viewInfoItem.itemType}</strong>
              </FormField>
              <FormField label="Status">
                <Badge variant={viewInfoItem.enabled !== false ? 'success' : 'warning'}>
                  {viewInfoItem.enabled !== false ? 'ACTIVE' : 'DISABLED'}
                </Badge>
              </FormField>
              <FormField label="Host / Proxy Address">
                <code>{viewInfoItem.host}</code>
              </FormField>
              <FormField label="Port & Transport">
                <strong>{viewInfoItem.port || 5060} ({viewInfoItem.transport || 'UDP'})</strong>
              </FormField>
              <FormField label="Auth Username">
                <strong>{viewInfoItem.username || 'IP / Passwordless Auth'}</strong>
              </FormField>
              <FormField label="SIP Realm">
                <strong>{viewInfoItem.realm || 'Default Domain'}</strong>
              </FormField>
            </Grid>
            <FormField label="Allocated Tenant">
              <Inline gap="2">
                <Building2 size={16} />
                <span>{viewInfoItem.tenant_name ? `${viewInfoItem.tenant_name} (${viewInfoItem.tenant_domain})` : 'Shared (Available to All Tenants)'}</span>
              </Inline>
            </FormField>
          </Stack>
        )}
      </Modal>

      {/* CREATE MODAL */}
      <Modal
        isOpen={showModal && !isReadOnly}
        onClose={() => setShowModal(false)}
        title="Register SIP Trunk Connection"
        subtitle="Add a new carrier SIP proxy or gateway route"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateSubmit}>Register Trunk</Button>
          </>
        }
      >
        <Stack gap="4">
          <Grid cols={2} gap="4">
            <FormField label="Trunk Name" required>
              <Input placeholder="e.g. Tata Telecommunications" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </FormField>
            <FormField label="SIP Host / Proxy IP" required>
              <Input placeholder="e.g. sip.tata.com" value={formData.host} onChange={e => setFormData({...formData, host: e.target.value})} />
            </FormField>
            <FormField label="SIP Port">
              <Input type="number" value={String(formData.port)} onChange={e => setFormData({...formData, port: parseInt(e.target.value) || 5060})} />
            </FormField>
            <FormField label="Transport Protocol">
              <Select value={formData.transport} onChange={e => setFormData({...formData, transport: e.target.value})}>
                <option value="UDP">UDP (Standard)</option>
                <option value="TCP">TCP</option>
                <option value="TLS">TLS (Encrypted)</option>
              </Select>
            </FormField>
          </Grid>

          <FormField label={`Assigned Tenants (${formData.tenant_ids.length === 0 ? 'Shared to All Tenants' : `${formData.tenant_ids.length} selected`})`}>
            <Stack gap="2">
              <Inline gap="2">
                <Button variant="ghost" size="sm" onClick={() => setFormData({ ...formData, tenant_ids: tenants.map(t => t.id) })}>Select All</Button>
                <Button variant="ghost" size="sm" onClick={() => setFormData({ ...formData, tenant_ids: [] })}>Clear (Make Shared)</Button>
              </Inline>
              <Grid cols={2} gap="2">
                {tenants.map(t => {
                  const isSelected = formData.tenant_ids.includes(t.id);
                  return (
                    <Checkbox
                      key={t.id}
                      label={t.name}
                      checked={isSelected}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...formData.tenant_ids, t.id]
                          : formData.tenant_ids.filter((id: string) => id !== t.id);
                        setFormData({ ...formData, tenant_ids: next });
                      }}
                    />
                  );
                })}
              </Grid>
            </Stack>
          </FormField>

          <Grid cols={3} gap="4">
            <FormField label="Priority Level">
              <Input type="number" value={String(formData.priority)} onChange={e => setFormData({...formData, priority: parseInt(e.target.value) || 1})} />
            </FormField>
            <FormField label="Auth Username (Optional)">
              <Input placeholder="Digest auth user" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
            </FormField>
            <FormField label="Auth Password (Optional)">
              <Input type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </FormField>
          </Grid>
        </Stack>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={!!editTrunk && !isReadOnly}
        onClose={() => setEditTrunk(null)}
        title={`Edit ${editTrunk?.itemType || 'SIP Trunk'}`}
        subtitle="Update trunk host settings and tenant assignments"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditTrunk(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleEditSubmit}>Update Trunk</Button>
          </>
        }
      >
        <Stack gap="4">
          <Grid cols={2} gap="4">
            <FormField label="Trunk Name" required>
              <Input value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
            </FormField>
            <FormField label="SIP Host / Proxy" required>
              <Input value={editFormData.host} onChange={e => setEditFormData({...editFormData, host: e.target.value})} />
            </FormField>
            <FormField label="SIP Port">
              <Input type="number" value={String(editFormData.port)} onChange={e => setEditFormData({...editFormData, port: parseInt(e.target.value) || 5060})} />
            </FormField>
            <FormField label="Transport Protocol">
              <Select value={editFormData.transport} onChange={e => setEditFormData({...editFormData, transport: e.target.value})}>
                <option value="UDP">UDP (Standard)</option>
                <option value="TCP">TCP</option>
                <option value="TLS">TLS (Encrypted)</option>
              </Select>
            </FormField>
          </Grid>

          <FormField label={`Assigned Tenants (${editFormData.tenant_ids.length === 0 ? 'Shared to All Tenants' : `${editFormData.tenant_ids.length} selected`})`}>
            <Stack gap="2">
              <Inline gap="2">
                <Button variant="ghost" size="sm" onClick={() => setEditFormData({ ...editFormData, tenant_ids: tenants.map(t => t.id) })}>Select All</Button>
                <Button variant="ghost" size="sm" onClick={() => setEditFormData({ ...editFormData, tenant_ids: [] })}>Clear (Make Shared)</Button>
              </Inline>
              <Grid cols={2} gap="2">
                {tenants.map(t => {
                  const isSelected = editFormData.tenant_ids.includes(t.id);
                  return (
                    <Checkbox
                      key={t.id}
                      label={t.name}
                      checked={isSelected}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...editFormData.tenant_ids, t.id]
                          : editFormData.tenant_ids.filter((id: string) => id !== t.id);
                        setEditFormData({ ...editFormData, tenant_ids: next });
                      }}
                    />
                  );
                })}
              </Grid>
            </Stack>
          </FormField>

          <Grid cols={3} gap="4">
            <FormField label="Priority Level">
              <Input type="number" value={String(editFormData.priority)} onChange={e => setEditFormData({...editFormData, priority: parseInt(e.target.value) || 1})} />
            </FormField>
            <FormField label="Auth Username">
              <Input value={editFormData.username} onChange={e => setEditFormData({...editFormData, username: e.target.value})} />
            </FormField>
            <FormField label="Auth Password">
              <Input type="password" value={editFormData.password} onChange={e => setEditFormData({...editFormData, password: e.target.value})} />
            </FormField>
          </Grid>
        </Stack>
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={!!deleteTrunkId && !isReadOnly}
        onClose={() => setDeleteTrunkId(null)}
        title="Delete Gateway / Trunk"
        subtitle="Are you sure you want to remove this route?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTrunkId(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>Delete</Button>
          </>
        }
      >
        <p>
          Deleting this route will disable inbound/outbound call routing for numbers relying on this connection.
        </p>
      </Modal>
    </PageContainer>
  );
};
