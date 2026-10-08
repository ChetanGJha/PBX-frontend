import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import { Plus, Trash2, Edit2, RefreshCw } from 'lucide-react';
import { ListPageLayout } from './layout';
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
  const [gateways, setGateways] = useState<any[]>([]);
  const [trunks, setTrunks] = useState<any[]>([]);
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
    tenant_id: user?.role === 'SUPER_ADMIN' ? '' : (user?.tenant_id || '')
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    did_number: '',
    route_type: 'inbound_did',
    destination_type: 'queue',
    destination: '',
    priority: 1,
    gateway_id: '',
    tenant_id: '',
    enabled: true
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [rData, tData, extData, qData, ivrData, didData, gData, trData] = await Promise.allSettled([
        apiService.getRoutes(token),
        user?.role === 'SUPER_ADMIN' ? apiService.getTenants(token) : Promise.resolve([]),
        apiService.getExtensions(token),
        apiService.getQueues(token),
        apiService.getIvrs(token),
        apiService.getDids(token),
        apiService.getGateways(token),
        apiService.getTrunks(token),
      ]);

      if (rData.status === 'fulfilled') setRoutes(rData.value);
      if (tData.status === 'fulfilled') setTenants(tData.value);
      if (extData.status === 'fulfilled') setExtensions(extData.value);
      if (qData.status === 'fulfilled') setQueues(qData.value);
      if (ivrData.status === 'fulfilled') setIvrs(ivrData.value);
      if (didData.status === 'fulfilled') setDids(didData.value);
      if (gData.status === 'fulfilled') setGateways(gData.value);
      if (trData.status === 'fulfilled') setTrunks(trData.value);
    } catch (err) {
      console.error('Failed to load routing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Combine Gateways and Trunks for selection
  const combinedGateways = useMemo(() => {
    const realGws = gateways.map(g => ({ ...g, is_real_gateway: true }));
    const sipTrunks = trunks.map(t => ({ ...t, is_real_gateway: false }));
    const list = [...realGws, ...sipTrunks];
    const uniqueMap = new Map();
    list.forEach(item => {
      if (item.id && !uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });
    return Array.from(uniqueMap.values());
  }, [gateways, trunks]);

  // Set default tenant when tenants list loads for SUPER_ADMIN if empty
  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' && tenants.length > 0 && !formData.tenant_id) {
      setFormData(prev => ({ ...prev, tenant_id: tenants[0].id }));
    }
  }, [tenants, user?.role]);

  // Used DIDs mapping for Phase 4 validation
  const usedDidNumbers = useMemo(() => {
    const set = new Set<string>();
    routes.forEach(r => {
      if (r.route_type === 'inbound_did' && r.did_number) {
        set.add(r.did_number);
      }
    });
    return set;
  }, [routes]);

  // Tenant-scoped targets filtering (Phase 3)
  const activeCreateTenantId = user?.role === 'SUPER_ADMIN' ? formData.tenant_id : user?.tenant_id;

  const filteredExtensions = useMemo(() => {
    if (!activeCreateTenantId) return extensions;
    return extensions.filter(e => e.tenant_id === activeCreateTenantId);
  }, [extensions, activeCreateTenantId]);

  const filteredQueues = useMemo(() => {
    if (!activeCreateTenantId) return queues;
    return queues.filter(q => q.tenant_id === activeCreateTenantId);
  }, [queues, activeCreateTenantId]);

  const filteredIvrs = useMemo(() => {
    if (!activeCreateTenantId) return ivrs;
    return ivrs.filter(i => i.tenant_id === activeCreateTenantId);
  }, [ivrs, activeCreateTenantId]);

  const filteredDids = useMemo(() => {
    if (!activeCreateTenantId) return dids;
    return dids.filter(d => d.tenant_id === activeCreateTenantId || !d.tenant_id);
  }, [dids, activeCreateTenantId]);

  const destinationOptions = useMemo(() => {
    switch (formData.destination_type) {
      case 'extension':
        return filteredExtensions.map(e => ({
          value: e.extension_number,
          label: 'ext/' + e.extension_number + (e.display_name ? ' — ' + e.display_name : '')
        }));
      case 'queue':
        return filteredQueues.map(q => ({
          value: q.queue_number,
          label: q.queue_number + ' — ' + q.name
        }));
      case 'ivr':
        return filteredIvrs.map(i => ({
          value: i.name,
          label: i.name
        }));
      case 'voicemail':
        return filteredExtensions.map(e => ({
          value: e.extension_number,
          label: 'ext/' + e.extension_number + ' (Voicemail)'
        }));
      default:
        return [];
    }
  }, [formData.destination_type, filteredExtensions, filteredQueues, filteredIvrs]);

  const handleTenantChange = (newTenantId: string) => {
    setFormData(prev => ({
      ...prev,
      tenant_id: newTenantId,
      did_number: '',
      destination: ''
    }));
  };

  const handleRouteTypeChange = (newRouteType: string) => {
    if (newRouteType === 'outbound') {
      const defaultGw = combinedGateways[0];
      setFormData(prev => ({
        ...prev,
        route_type: 'outbound',
        destination_type: 'gateway',
        gateway_id: defaultGw && defaultGw.is_real_gateway ? defaultGw.id : '',
        destination: defaultGw ? (defaultGw.name || defaultGw.host || 'Gateway') : 'Outbound Gateway',
        did_number: prev.did_number && prev.did_number !== '' ? prev.did_number : '^91\\d{10}$'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        route_type: 'inbound_did',
        destination_type: 'queue',
        gateway_id: '',
        destination: filteredQueues[0] ? filteredQueues[0].queue_number : ''
      }));
    }
  };

  const handleDestTypeChange = (newType: string) => {
    let def = '';
    if (newType === 'queue' && filteredQueues.length > 0) def = filteredQueues[0].queue_number;
    else if (newType === 'extension' && filteredExtensions.length > 0) def = filteredExtensions[0].extension_number;
    else if (newType === 'ivr' && filteredIvrs.length > 0) def = filteredIvrs[0].name;
    else if (newType === 'voicemail' && filteredExtensions.length > 0) def = filteredExtensions[0].extension_number;
    else if (newType === 'gateway' && combinedGateways.length > 0) {
      const defaultGw = combinedGateways[0];
      setFormData(prev => ({
        ...prev,
        destination_type: 'gateway',
        gateway_id: defaultGw && defaultGw.is_real_gateway ? defaultGw.id : '',
        destination: defaultGw.name || defaultGw.host || 'Gateway'
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      destination_type: newType,
      destination: def
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Phase 4 Submit-time validation
      if (formData.route_type === 'inbound_did' && formData.did_number && usedDidNumbers.has(formData.did_number)) {
        showErrorModal('Inbound DID Duplicate Error', `Inbound DID "${formData.did_number}" is already assigned to another routing rule.`);
        return;
      }

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
        tenant_id: user?.role === 'SUPER_ADMIN' && tenants.length > 0 ? tenants[0].id : (user?.tenant_id || '')
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

  // Edit Modal tenant-scoped filtering
  const activeEditTenantId = user?.role === 'SUPER_ADMIN' ? editFormData.tenant_id : user?.tenant_id;

  const editFilteredExtensions = useMemo(() => {
    if (!activeEditTenantId) return extensions;
    return extensions.filter(e => e.tenant_id === activeEditTenantId);
  }, [extensions, activeEditTenantId]);

  const editFilteredQueues = useMemo(() => {
    if (!activeEditTenantId) return queues;
    return queues.filter(q => q.tenant_id === activeEditTenantId);
  }, [queues, activeEditTenantId]);

  const editFilteredIvrs = useMemo(() => {
    if (!activeEditTenantId) return ivrs;
    return ivrs.filter(i => i.tenant_id === activeEditTenantId);
  }, [ivrs, activeEditTenantId]);

  const editFilteredDids = useMemo(() => {
    if (!activeEditTenantId) return dids;
    return dids.filter(d => d.tenant_id === activeEditTenantId || !d.tenant_id);
  }, [dids, activeEditTenantId]);

  const editDestinationOptions = useMemo(() => {
    switch (editFormData.destination_type) {
      case 'extension':
        return editFilteredExtensions.map(e => ({
          value: e.extension_number,
          label: 'ext/' + e.extension_number + (e.display_name ? ' — ' + e.display_name : '')
        }));
      case 'queue':
        return editFilteredQueues.map(q => ({
          value: q.queue_number,
          label: q.queue_number + ' — ' + q.name
        }));
      case 'ivr':
        return editFilteredIvrs.map(i => ({
          value: i.name,
          label: i.name
        }));
      case 'voicemail':
        return editFilteredExtensions.map(e => ({
          value: e.extension_number,
          label: 'ext/' + e.extension_number + ' (Voicemail)'
        }));
      default:
        return [];
    }
  }, [editFormData.destination_type, editFilteredExtensions, editFilteredQueues, editFilteredIvrs]);

  const handleEditTenantChange = (newTenantId: string) => {
    setEditFormData(prev => ({
      ...prev,
      tenant_id: newTenantId,
      destination: ''
    }));
  };

  const handleEditDestTypeChange = (newType: string) => {
    let def = '';
    if (newType === 'queue' && editFilteredQueues.length > 0) def = editFilteredQueues[0].queue_number;
    else if (newType === 'extension' && editFilteredExtensions.length > 0) def = editFilteredExtensions[0].extension_number;
    else if (newType === 'ivr' && editFilteredIvrs.length > 0) def = editFilteredIvrs[0].name;
    else if (newType === 'voicemail' && editFilteredExtensions.length > 0) def = editFilteredExtensions[0].extension_number;

    setEditFormData(prev => ({
      ...prev,
      destination_type: newType,
      destination: def
    }));
  };

  const handleOpenEdit = (r: any) => {
    setEditingRouteId(r.id);
    setEditFormData({
      name: r.name || '',
      did_number: r.did_number || '',
      route_type: r.route_type || 'inbound_did',
      destination_type: r.destination_type || 'queue',
      destination: r.destination || '',
      priority: r.priority || 1,
      gateway_id: r.gateway_id || '',
      tenant_id: r.tenant_id || '',
      enabled: r.enabled !== false
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRouteId) return;
    try {
      const payload: any = { ...editFormData };
      if (!payload.gateway_id) delete payload.gateway_id;

      await apiService.updateRoute(token, editingRouteId, payload);
      setShowEditModal(false);
      setEditingRouteId(null);
      showSuccessModal('Routing Rule Updated', 'Routing rule configuration updated successfully.');
      loadData();
    } catch (err: any) {
      showErrorModal('Update Failed', err.message || 'Could not update routing rule');
    }
  };

  const filteredRoutes = routes.filter((r: any) => {
    return (
      (r.name && r.name.toLowerCase().includes(search.toLowerCase())) ||
      (r.did_number && r.did_number.includes(search)) ||
      (r.destination && r.destination.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const columns = [
    {
      key: 'name',
      header: 'Rule Name',
      sortable: true,
      render: (r: any) => <strong>{r.name}</strong>
    },
    {
      key: 'route_type',
      header: 'Type',
      render: (r: any) => (
        <Badge variant={r.route_type === 'inbound_did' ? 'primary' : 'warning'}>
          {r.route_type === 'inbound_did' ? 'Inbound DID' : 'Outbound Dialplan'}
        </Badge>
      )
    },
    {
      key: 'did_number',
      header: 'DID / Pattern',
      render: (r: any) => <span className="font-mono text-xs font-semibold text-[var(--pbx-text-primary)]">{r.did_number || '—'}</span>
    },
    {
      key: 'destination',
      header: 'Target Destination',
      render: (r: any) => (
        <span className="text-xs">
          <span className="text-[var(--pbx-text-muted)] font-medium uppercase mr-1.5">[{r.destination_type}]</span>
          <strong>{r.destination}</strong>
        </span>
      )
    },
    ...(user?.role === 'SUPER_ADMIN'
      ? [
          {
            key: 'tenant',
            header: 'Tenant',
            render: (r: any) => {
              const t = tenants.find(tnt => tnt.id === r.tenant_id);
              return t ? t.name : r.tenant_id || 'Global';
            }
          }
        ]
      : []),
    {
      key: 'status',
      header: 'Status',
      render: (r: any) => (
        <Badge variant={r.enabled !== false ? 'success' : 'neutral'}>
          {r.enabled !== false ? 'Active' : 'Disabled'}
        </Badge>
      )
    }
  ];

  return (
    <ListPageLayout
      title="Call Routing & Dialplan Engine"
      subtitle="Configure inbound DID routing targets, auto-attendants, and outbound carrier routes"
      eyebrow="TELEPHONY DIALPLAN ENGINE"
      actions={
        <Inline gap="3">
          <Button variant="secondary" onClick={loadData} isLoading={loading} leftIcon={<RefreshCw size={14} />}>
            Refresh
          </Button>
          <Button variant="primary" onClick={() => setShowModal(true)} leftIcon={<Plus size={16} />}>
            Create Routing Rule
          </Button>
        </Inline>
      }
      filterBar={
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search routing rules by DID, name, target..."
        />
      }
    >
      <DataTable
        columns={columns}
        data={filteredRoutes}
        isLoading={loading}
        emptyTitle="No routing rules configured"
        emptyDescription="Click 'Create Routing Rule' to map inbound DIDs or outbound routes."
        actions={(r: any) => (
          <Inline gap="2" justify="center" wrap={false}>
            <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(r)} title="Edit Rule">
              <Edit2 size={14} />
            </Button>
            <Button variant="danger" size="sm" onClick={() => handleDelete(r.id)} title="Delete Rule">
              <Trash2 size={14} />
            </Button>
          </Inline>
        )}
      />

      {/* CREATE MODAL */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Routing Rule"
        subtitle="Map an Inbound DID to an extension, queue, IVR auto-attendant, or voicemail"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" form="create-route-form" variant="primary">Create Routing Rule</Button>
          </>
        }
      >
        <form id="create-route-form" onSubmit={handleCreate}>
          <Stack gap="4">
            {/* Phase 3: Target Tenant is the FIRST field */}
            {user?.role === 'SUPER_ADMIN' && (
              <FormField label="Target Tenant" required hint="Tenant organization owning this routing rule">
                <Select
                  value={formData.tenant_id}
                  onChange={e => handleTenantChange(e.target.value)}
                  required
                >
                  <option value="">-- Select Target Tenant --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.domain})</option>
                  ))}
                </Select>
              </FormField>
            )}

            <Grid cols={2} gap="4">
              <FormField label="Route Name" required>
                <Input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Main Support Inbound"
                  required
                />
              </FormField>

              <FormField label="Route Type">
                <Select
                  value={formData.route_type}
                  onChange={e => handleRouteTypeChange(e.target.value)}
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
                    required
                    disabled={user?.role === 'SUPER_ADMIN' && !formData.tenant_id}
                  >
                    <option value="">
                      {user?.role === 'SUPER_ADMIN' && !formData.tenant_id
                        ? '-- Select a Target Tenant first --'
                        : '-- Select Assigned DID --'}
                    </option>
                    {filteredDids.map((d: any) => {
                      const isUsed = usedDidNumbers.has(d.did_number);
                      return (
                        <option
                          key={d.id}
                          value={d.did_number}
                          disabled={isUsed}
                        >
                          {d.did_number} {isUsed ? '(Already used by another routing rule)' : d.tenant_name ? '(' + d.tenant_name + ')' : ''}
                        </option>
                      );
                    })}
                  </Select>
                ) : (
                  <Input
                    value={formData.did_number}
                    onChange={e => setFormData({ ...formData, did_number: e.target.value })}
                    placeholder="e.g. ^91\d{10}$ or .*"
                    required
                  />
                )}
              </FormField>

              <FormField label="Destination Type">
                <Select
                  value={formData.destination_type}
                  onChange={e => handleDestTypeChange(e.target.value)}
                  disabled={user?.role === 'SUPER_ADMIN' && !formData.tenant_id}
                >
                  {formData.route_type === 'outbound' ? (
                    <option value="gateway">SIP Gateway / Trunk (Outbound Only)</option>
                  ) : (
                    <>
                      <option value="queue">Call Queue</option>
                      <option value="extension">Extension</option>
                      <option value="ivr">IVR Menu Flow</option>
                      <option value="voicemail">Voicemail Box</option>
                    </>
                  )}
                </Select>
              </FormField>
            </Grid>

            {formData.route_type === 'outbound' || formData.destination_type === 'gateway' ? (
              <FormField label="Outbound Gateway / Trunk" required hint="Carrier gateway or trunk for routing outbound calls">
                <Select
                  value={formData.gateway_id || (combinedGateways.find(g => g.name === formData.destination)?.id || '')}
                  onChange={e => {
                    const selectedGw = combinedGateways.find(g => g.id === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      gateway_id: selectedGw && selectedGw.is_real_gateway ? selectedGw.id : '',
                      destination: selectedGw ? (selectedGw.name || selectedGw.host || 'Gateway') : 'Outbound Gateway'
                    }));
                  }}
                  required
                >
                  <option value="">-- Select Outbound Gateway / Trunk --</option>
                  {combinedGateways.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.host || g.proxy || 'Gateway'})
                    </option>
                  ))}
                </Select>
              </FormField>
            ) : (
              <FormField
                label="Destination Target"
                required
                hint={
                  user?.role === 'SUPER_ADMIN' && !formData.tenant_id
                    ? 'Select a Target Tenant first to view available targets'
                    : `(${formData.destination_type === 'queue' ? filteredQueues.length + ' queue(s)' : formData.destination_type === 'ivr' ? filteredIvrs.length + ' IVR flow(s)' : filteredExtensions.length + ' extension(s)'} available)`
                }
              >
                {destinationOptions.length > 0 ? (
                  <Select
                    value={formData.destination}
                    onChange={e => setFormData({ ...formData, destination: e.target.value })}
                    required
                    disabled={user?.role === 'SUPER_ADMIN' && !formData.tenant_id}
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
                    required
                    disabled={user?.role === 'SUPER_ADMIN' && !formData.tenant_id}
                  />
                )}
              </FormField>
            )}
          </Stack>
        </form>
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
            <Button type="submit" form="edit-route-form" variant="primary">Update Routing Rule</Button>
          </>
        }
      >
        <form id="edit-route-form" onSubmit={handleUpdate}>
          <Stack gap="4">
            {/* Phase 3: Target Tenant is the FIRST field */}
            {user?.role === 'SUPER_ADMIN' && (
              <FormField label="Target Tenant" required hint="Tenant organization owning this routing rule">
                <Select
                  value={editFormData.tenant_id}
                  onChange={e => handleEditTenantChange(e.target.value)}
                  required
                >
                  <option value="">-- Select Target Tenant --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.domain})</option>
                  ))}
                </Select>
              </FormField>
            )}

            <Grid cols={2} gap="4">
              <FormField label="Route Name" required>
                <Input
                  value={editFormData.name}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
              </FormField>

              <FormField label="Route Type">
                <Select
                  value={editFormData.route_type}
                  onChange={e => {
                    const newRouteType = e.target.value;
                    if (newRouteType === 'outbound') {
                      const defaultGw = combinedGateways[0];
                      setEditFormData(prev => ({
                        ...prev,
                        route_type: 'outbound',
                        destination_type: 'gateway',
                        gateway_id: defaultGw ? defaultGw.id : prev.gateway_id,
                        destination: defaultGw ? (defaultGw.name || defaultGw.host || 'Gateway') : (prev.destination || 'Outbound Gateway')
                      }));
                    } else {
                      setEditFormData(prev => ({
                        ...prev,
                        route_type: 'inbound_did',
                        destination_type: 'queue',
                        gateway_id: ''
                      }));
                    }
                  }}
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
                    required
                  >
                    <option value="">-- Select Assigned DID --</option>
                    {editFilteredDids.map((d: any) => {
                      const isUsedByOther = usedDidNumbers.has(d.did_number) && d.did_number !== editFormData.did_number;
                      return (
                        <option
                          key={d.id}
                          value={d.did_number}
                          disabled={isUsedByOther}
                        >
                          {d.did_number} {isUsedByOther ? '(Already used by another routing rule)' : ''}
                        </option>
                      );
                    })}
                  </Select>
                ) : (
                  <Input
                    value={editFormData.did_number}
                    onChange={e => setEditFormData({ ...editFormData, did_number: e.target.value })}
                    required
                  />
                )}
              </FormField>

              <FormField label="Destination Type">
                <Select
                  value={editFormData.destination_type}
                  onChange={e => handleEditDestTypeChange(e.target.value)}
                >
                  {editFormData.route_type === 'outbound' ? (
                    <option value="gateway">SIP Gateway / Trunk (Outbound Only)</option>
                  ) : (
                    <>
                      <option value="queue">Call Queue</option>
                      <option value="extension">Extension</option>
                      <option value="ivr">IVR Menu Flow</option>
                      <option value="voicemail">Voicemail Box</option>
                    </>
                  )}
                </Select>
              </FormField>
            </Grid>

            {editFormData.route_type === 'outbound' || editFormData.destination_type === 'gateway' ? (
              <FormField label="Outbound Gateway / Trunk" required hint="Carrier gateway or trunk for routing outbound calls">
                <Select
                  value={editFormData.gateway_id || (combinedGateways.find(g => g.name === editFormData.destination)?.id || '')}
                  onChange={e => {
                    const selectedGw = combinedGateways.find(g => g.id === e.target.value);
                    setEditFormData(prev => ({
                      ...prev,
                      gateway_id: selectedGw && selectedGw.is_real_gateway ? selectedGw.id : '',
                      destination: selectedGw ? (selectedGw.name || selectedGw.host || 'Gateway') : 'Outbound Gateway'
                    }));
                  }}
                  required
                >
                  <option value="">-- Select Outbound Gateway / Trunk --</option>
                  {combinedGateways.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.host || g.proxy || 'Gateway'})
                    </option>
                  ))}
                </Select>
              </FormField>
            ) : (
              <FormField label="Destination Target" required>
                {editDestinationOptions.length > 0 ? (
                  <Select
                    value={editFormData.destination}
                    onChange={e => setEditFormData({ ...editFormData, destination: e.target.value })}
                    required
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
                    required
                  />
                )}
              </FormField>
            )}
          </Stack>
        </form>
      </Modal>
    </ListPageLayout>
  );
};
