import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { PageContainer } from './layout/PageContainer';
import { Stack, Inline, Grid } from './layout/Stack';
import {
  Button,
  Input,
  Select,
  FormField,
  Modal,
  Badge,
} from './ui';
import { DataTable, FilterBar } from './patterns';

interface RoutingViewProps {
  token: string;
  user?: User | null;
}

export const RoutingView: React.FC<RoutingViewProps> = ({ token, user }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [routes, setRoutes] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [queues, setQueues] = useState<any[]>([]);
  const [ivrs, setIvrs] = useState<any[]>([]);
  const [dids, setDids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    did_number: '',
    route_type: 'inbound_did',
    destination_type: 'queue',
    destination: '',
    priority: 1,
    gateway_id: '',
    tenant_id: user?.tenant_id || ''
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    did_number: '',
    route_type: 'inbound_did',
    destination_type: 'queue',
    destination: '',
    priority: 1,
    gateway_id: '',
    enabled: true
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [rData, tData, extData, qData, ivrData, didData] = await Promise.allSettled([
        apiService.getRoutes(token),
        apiService.getTenants(token),
        apiService.getExtensions(token),
        apiService.getQueues(token),
        apiService.getIvrs(token),
        apiService.getDids(token),
      ]);

      if (rData.status === 'fulfilled') setRoutes(rData.value);
      if (tData.status === 'fulfilled') setTenants(tData.value);
      if (extData.status === 'fulfilled') setExtensions(extData.value);
      if (qData.status === 'fulfilled') setQueues(qData.value);
      if (ivrData.status === 'fulfilled') setIvrs(ivrData.value);
      if (didData.status === 'fulfilled') setDids(didData.value);
    } catch (err) {
      console.error('Failed to load routing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const assignedDids = useMemo(() => {
    if (user?.role === 'SUPER_ADMIN') return dids;
    return dids.filter((d: any) => d.tenant_id === user?.tenant_id || !d.tenant_id);
  }, [dids, user]);

  const destinationOptions = useMemo(() => {
    switch (formData.destination_type) {
      case 'extension':
        return extensions.map(e => ({
          value: e.extension_number,
          label: 'ext/' + e.extension_number + (e.display_name ? ' — ' + e.display_name : '')
        }));
      case 'queue':
        return queues.map(q => ({
          value: q.queue_number,
          label: q.queue_number + ' — ' + q.name
        }));
      case 'ivr':
        return ivrs.map(i => ({
          value: i.name,
          label: i.name
        }));
      case 'voicemail':
        return extensions.map(e => ({
          value: e.extension_number,
          label: 'ext/' + e.extension_number + ' (Voicemail)'
        }));
      default:
        return [];
    }
  }, [formData.destination_type, extensions, queues, ivrs]);

  const handleDestTypeChange = (newType: string) => {
    let def = '';
    if (newType === 'queue' && queues.length > 0) def = queues[0].queue_number;
    else if (newType === 'extension' && extensions.length > 0) def = extensions[0].extension_number;
    else if (newType === 'ivr' && ivrs.length > 0) def = ivrs[0].name;
    else if (newType === 'voicemail' && extensions.length > 0) def = extensions[0].extension_number;

    setFormData({
      ...formData,
      destination_type: newType,
      destination: def
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { ...formData };
      if (user?.role !== 'SUPER_ADMIN' && user?.tenant_id) {
        payload.tenant_id = user.tenant_id;
      } else if (!payload.tenant_id) {
        delete payload.tenant_id;
      }
      if (!payload.gateway_id) delete payload.gateway_id;

      const ruleName = payload.name;
      await apiService.createRoute(token, payload);
      setShowModal(false);
      setFormData({
        name: '',
        did_number: '',
        route_type: 'inbound_did',
        destination_type: 'queue',
        destination: '',
        priority: 1,
        gateway_id: '',
        tenant_id: user?.tenant_id || ''
      });
      showSuccessModal(
        'Routing Rule Configured',
        'Routing rule "' + ruleName + '" has been saved and applied to the dialplan engine.'
      );
      loadData();
    } catch (err: any) {
      showErrorModal('Failed to Create Route', err.message || 'Routing rule creation failed');
    }
  };

  const handleDelete = async (routeId: string) => {
    if (!window.confirm('Are you sure you want to delete this routing rule?')) return;
    try {
      await apiService.deleteRoute(token, routeId);
      showSuccessModal('Routing Rule Deleted', 'The routing rule was successfully deleted.');
      loadData();
    } catch (err: any) {
      showErrorModal('Delete Error', err.message || 'Could not delete routing rule');
    }
  };

  const editDestinationOptions = useMemo(() => {
    switch (editFormData.destination_type) {
      case 'extension':
        return extensions.map(e => ({
          value: e.extension_number,
          label: 'ext/' + e.extension_number + (e.display_name ? ' — ' + e.display_name : '')
        }));
      case 'queue':
        return queues.map(q => ({
          value: q.queue_number,
          label: q.queue_number + ' — ' + q.name
        }));
      case 'ivr':
        return ivrs.map(i => ({
          value: i.name,
          label: i.name
        }));
      case 'voicemail':
        return extensions.map(e => ({
          value: e.extension_number,
          label: 'ext/' + e.extension_number + ' (Voicemail)'
        }));
      default:
        return [];
    }
  }, [editFormData.destination_type, extensions, queues, ivrs]);

  const handleEditDestTypeChange = (newType: string) => {
    let def = '';
    if (newType === 'queue' && queues.length > 0) def = queues[0].queue_number;
    else if (newType === 'extension' && extensions.length > 0) def = extensions[0].extension_number;
    else if (newType === 'ivr' && ivrs.length > 0) def = ivrs[0].name;
    else if (newType === 'voicemail' && extensions.length > 0) def = extensions[0].extension_number;

    setEditFormData({
      ...editFormData,
      destination_type: newType,
      destination: def
    });
  };

  const handleOpenEdit = (r: any) => {
    setEditingRouteId(r.id);
    setEditFormData({
      name: r.name || '',
      did_number: r.did_number || r.regex_pattern || '',
      route_type: r.route_type || 'inbound_did',
      destination_type: r.destination_type || 'queue',
      destination: r.destination || '',
      priority: r.priority !== undefined ? r.priority : 1,
      gateway_id: r.gateway_id || '',
      enabled: r.enabled !== false
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRouteId) return;
    try {
      const payload: any = {
        name: editFormData.name,
        route_type: editFormData.route_type,
        destination_type: editFormData.destination_type,
        destination: editFormData.destination,
        priority: Number(editFormData.priority) || 1,
        enabled: editFormData.enabled
      };
      if (editFormData.route_type === 'inbound_did') {
        payload.did_number = editFormData.did_number;
        payload.regex_pattern = null;
      } else {
        payload.regex_pattern = editFormData.did_number;
        payload.did_number = null;
      }
      if (editFormData.gateway_id) {
        payload.gateway_id = editFormData.gateway_id;
      }

      await apiService.updateRoute(token, editingRouteId, payload);
      setShowEditModal(false);
      setEditingRouteId(null);
      showSuccessModal(
        'Routing Rule Updated',
        'Routing rule "' + editFormData.name + '" has been successfully updated.'
      );
      loadData();
    } catch (err: any) {
      showErrorModal('Update Error', err.message || 'Could not update routing rule');
    }
  };

  const filtered = routes.filter(r =>
    (r.name && r.name.toLowerCase().includes(search.toLowerCase())) ||
    (r.did_number && r.did_number.includes(search)) ||
    (r.destination && r.destination.toLowerCase().includes(search.toLowerCase()))
  );

  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'TENANT_ADMIN';

  const columns = [
    {
      key: 'name',
      header: 'Route Name',
      sortable: true,
      render: (r: any) => <strong>{r.name}</strong>,
    },
    {
      key: 'did_number',
      header: 'DID / Pattern',
      render: (r: any) => <code>{r.did_number || r.regex_pattern || '*'}</code>,
    },
    {
      key: 'route_type',
      header: 'Type',
      render: (r: any) => (
        <Badge variant={r.route_type === 'inbound_did' ? 'success' : 'warning'}>
          {r.route_type === 'inbound_did' ? 'INBOUND' : 'OUTBOUND'}
        </Badge>
      ),
    },
    {
      key: 'destination_type',
      header: 'Destination Type',
      render: (r: any) => <Badge variant="neutral">{r.destination_type ? r.destination_type.toUpperCase() : 'ROUTE'}</Badge>,
    },
    {
      key: 'destination',
      header: 'Target Destination',
      render: (r: any) => <strong>{r.destination}</strong>,
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (r: any) => <strong>P{r.priority}</strong>,
    },
    ...(user?.role === 'SUPER_ADMIN' ? [{
      key: 'tenant_name',
      header: 'Tenant',
      render: (r: any) => <Badge variant="warning">{r.tenant_name || 'Global'}</Badge>,
    }] : []),
  ];

  return (
    <PageContainer
      title="Call Routing Rules"
      subtitle="Configure tenant-wise inbound DID routing and outbound pattern matching"
      eyebrow="Dialplan Engine"
      actions={
        canManage ? (
          <Button variant="primary" onClick={() => setShowModal(true)} leftIcon={<Plus size={16} />}>
            Add Routing Rule
          </Button>
        ) : undefined
      }
    >
      <Stack gap="6">
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search routes..."
        />

        <DataTable
          columns={columns}
          data={filtered}
          isLoading={loading}
          emptyTitle="No routing rules configured yet"
          actions={canManage ? (r: any) => (
            <Inline gap="2" justify="flex-end">
              <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(r)} leftIcon={<Edit2 size={12} />}>
                Edit
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(r.id)} leftIcon={<Trash2 size={12} />}>
                Delete
              </Button>
            </Inline>
          ) : undefined}
        />
      </Stack>

      {/* CREATE MODAL */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Routing Rule"
        subtitle="Add tenant-wise inbound DID or outbound dialplan rule"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate}>Save Routing Rule</Button>
          </>
        }
      >
        <Stack gap="4">
          <Grid cols={2} gap="4">
            <FormField label="Route Name" required>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sales DID Inbound"
              />
            </FormField>

            <FormField label="Route Type">
              <Select
                value={formData.route_type}
                onChange={e => setFormData({ ...formData, route_type: e.target.value })}
              >
                <option value="inbound_did">Inbound DID Route</option>
                <option value="outbound">Outbound Dialplan Rule</option>
              </Select>
            </FormField>

            <FormField label={formData.route_type === 'inbound_did' ? 'Assigned DID Number' : 'Regex / Match Pattern'} required>
              {formData.route_type === 'inbound_did' ? (
                <Select
                  value={formData.did_number}
                  onChange={e => setFormData({ ...formData, did_number: e.target.value })}
                >
                  <option value="">-- Select Assigned DID --</option>
                  {assignedDids.map((d: any) => (
                    <option key={d.id} value={d.did_number}>
                      {d.did_number} {d.tenant_name ? '(' + d.tenant_name + ')' : '(Assigned)'}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  value={formData.did_number}
                  onChange={e => setFormData({ ...formData, did_number: e.target.value })}
                  placeholder="e.g. ^91\d{10}$"
                />
              )}
            </FormField>

            <FormField label="Destination Type">
              <Select
                value={formData.destination_type}
                onChange={e => handleDestTypeChange(e.target.value)}
              >
                <option value="queue">Call Queue</option>
                <option value="extension">Extension</option>
                <option value="ivr">IVR Menu Flow</option>
                <option value="voicemail">Voicemail Box</option>
              </Select>
            </FormField>
          </Grid>

          <FormField label="Destination Target" required hint={`(${formData.destination_type === 'queue' ? queues.length + ' queue(s)' : formData.destination_type === 'ivr' ? ivrs.length + ' IVR flow(s)' : extensions.length + ' extension(s)'} available)`}>
            {destinationOptions.length > 0 ? (
              <Select
                value={formData.destination}
                onChange={e => setFormData({ ...formData, destination: e.target.value })}
              >
                <option value="">-- Select {formData.destination_type === 'queue' ? 'Call Queue' : formData.destination_type === 'ivr' ? 'IVR Flow' : 'Extension'} --</option>
                {destinationOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            ) : (
              <Input
                value={formData.destination}
                onChange={e => setFormData({ ...formData, destination: e.target.value })}
                placeholder="e.g. 7001 or 1001"
              />
            )}
          </FormField>

          {user?.role === 'SUPER_ADMIN' && (
            <FormField label="Target Tenant (Optional)">
              <Select
                value={formData.tenant_id}
                onChange={e => setFormData({ ...formData, tenant_id: e.target.value })}
              >
                <option value="">-- Global / Select Tenant --</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.domain})</option>
                ))}
              </Select>
            </FormField>
          )}
        </Stack>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingRouteId(null); }}
        title="Edit Routing Rule"
        subtitle="Modify route destination, type, pattern or priority"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setEditingRouteId(null); }}>Cancel</Button>
            <Button variant="primary" onClick={handleUpdate}>Update Routing Rule</Button>
          </>
        }
      >
        <Stack gap="4">
          <Grid cols={2} gap="4">
            <FormField label="Route Name" required>
              <Input
                value={editFormData.name}
                onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </FormField>

            <FormField label="Route Type">
              <Select
                value={editFormData.route_type}
                onChange={e => setEditFormData({ ...editFormData, route_type: e.target.value })}
              >
                <option value="inbound_did">Inbound DID Route</option>
                <option value="outbound">Outbound Dialplan Rule</option>
              </Select>
            </FormField>

            <FormField label={editFormData.route_type === 'inbound_did' ? 'Assigned DID Number' : 'Regex / Match Pattern'} required>
              {editFormData.route_type === 'inbound_did' ? (
                <Select
                  value={editFormData.did_number}
                  onChange={e => setEditFormData({ ...editFormData, did_number: e.target.value })}
                >
                  <option value="">-- Select Assigned DID --</option>
                  {assignedDids.map((d: any) => (
                    <option key={d.id} value={d.did_number}>
                      {d.did_number} {d.tenant_name ? '(' + d.tenant_name + ')' : '(Assigned)'}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  value={editFormData.did_number}
                  onChange={e => setEditFormData({ ...editFormData, did_number: e.target.value })}
                />
              )}
            </FormField>

            <FormField label="Destination Type">
              <Select
                value={editFormData.destination_type}
                onChange={e => handleEditDestTypeChange(e.target.value)}
              >
                <option value="queue">Call Queue</option>
                <option value="extension">Extension</option>
                <option value="ivr">IVR Menu Flow</option>
                <option value="voicemail">Voicemail Box</option>
              </Select>
            </FormField>

            <FormField label="Priority">
              <Input
                type="number"
                value={String(editFormData.priority)}
                onChange={e => setEditFormData({ ...editFormData, priority: parseInt(e.target.value) || 1 })}
              />
            </FormField>

            <FormField label="Status">
              <Select
                value={editFormData.enabled ? 'true' : 'false'}
                onChange={e => setEditFormData({ ...editFormData, enabled: e.target.value === 'true' })}
              >
                <option value="true">Active / Enabled</option>
                <option value="false">Disabled</option>
              </Select>
            </FormField>
          </Grid>

          <FormField label="Destination Target" required hint={`(${editFormData.destination_type === 'queue' ? queues.length + ' queue(s)' : editFormData.destination_type === 'ivr' ? ivrs.length + ' IVR flow(s)' : extensions.length + ' extension(s)'} available)`}>
            {editDestinationOptions.length > 0 ? (
              <Select
                value={editFormData.destination}
                onChange={e => setEditFormData({ ...editFormData, destination: e.target.value })}
              >
                <option value="">-- Select {editFormData.destination_type === 'queue' ? 'Call Queue' : editFormData.destination_type === 'ivr' ? 'IVR Flow' : 'Extension'} --</option>
                {editDestinationOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            ) : (
              <Input
                value={editFormData.destination}
                onChange={e => setEditFormData({ ...editFormData, destination: e.target.value })}
              />
            )}
          </FormField>
        </Stack>
      </Modal>
    </PageContainer>
  );
};
