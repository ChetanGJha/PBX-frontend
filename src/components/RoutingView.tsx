import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import { Route as RouteIcon, Plus, Search, Trash2, Edit2 } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

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

  // Assigned DIDs for the tenant
  const assignedDids = useMemo(() => {
    if (user?.role === 'SUPER_ADMIN') return dids;
    return dids.filter((d: any) => d.tenant_id === user?.tenant_id || !d.tenant_id);
  }, [dids, user]);

  // Destination options based on chosen destination type
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

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Dialplan Engine</div>
          <h1 className="page-title">Call Routing Rules</h1>
          <p className="page-sub">Configure tenant-wise inbound DID routing and outbound pattern matching</p>
        </div>
        {canManage && (
          <div>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Add Routing Rule
            </button>
          </div>
        )}
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="search-input-wrap" style={{ width: '280px' }}>
            <Search size={16} className="search-icon" />
            <input
              className="form-control"
              style={{ height: '38px', fontSize: '12px' }}
              placeholder="Search routes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#6B7280' }}>
            Total <strong>{filtered.length}</strong> routing rule{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Route Name</th>
                <th>DID / Pattern</th>
                <th>Type</th>
                <th>Destination Type</th>
                <th>Target Destination</th>
                <th>Priority</th>
                {user?.role === 'SUPER_ADMIN' && <th>Tenant</th>}
                {canManage && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={(user?.role === 'SUPER_ADMIN' ? 7 : 6) + (canManage ? 1 : 0)} className="text-center py-4">Loading routing rules...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={(user?.role === 'SUPER_ADMIN' ? 7 : 6) + (canManage ? 1 : 0)} className="text-center py-4 text-muted">No routing rules configured yet</td></tr>
              ) : (
                filtered.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#111827' }}>{r.name}</div>
                    </td>
                    <td>
                      <code className="code-box" style={{ padding: '4px 8px', fontSize: '11px' }}>
                        {r.did_number || r.regex_pattern || '*'}
                      </code>
                    </td>
                    <td>
                      {r.route_type === 'inbound_did' ? (
                        <span className="terrix-badge green">INBOUND</span>
                      ) : (
                        <span className="terrix-badge orange">OUTBOUND</span>
                      )}
                    </td>
                    <td>
                      <span className="terrix-badge grey">{r.destination_type ? r.destination_type.toUpperCase() : 'ROUTE'}</span>
                    </td>
                    <td>
                      <strong style={{ color: '#111827' }}>{r.destination}</strong>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>P{r.priority}</span>
                    </td>
                    {user?.role === 'SUPER_ADMIN' && (
                      <td>
                        <span className="terrix-badge orange">{r.tenant_name || 'Global'}</span>
                      </td>
                    )}
                    {canManage && (
                      <td className="text-right">
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => handleOpenEdit(r)}
                            title="Edit Route"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn-secondary text-rose-600"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => handleDelete(r.id)}
                            title="Delete Route"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="terrix-modal" style={{ maxWidth: '580px' }}>
            <div className="modal-head">
              <div className="modal-icon"><RouteIcon size={20} /></div>
              <div>
                <h3>Create Routing Rule</h3>
                <p>Add tenant-wise inbound DID or outbound dialplan rule</p>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label required">Route Name</label>
                    <input
                      required
                      className="form-control"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Sales DID Inbound"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Route Type</label>
                    <CustomSelect
                      options={[
                        { value: 'inbound_did', label: 'Inbound DID Route' },
                        { value: 'outbound', label: 'Outbound Dialplan Rule' }
                      ]}
                      value={formData.route_type}
                      onChange={val => setFormData({ ...formData, route_type: val })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required">
                      {formData.route_type === 'inbound_did' ? 'Assigned DID Number' : 'Regex / Match Pattern'}
                    </label>
                    {formData.route_type === 'inbound_did' ? (
                      <CustomSelect
                        options={[
                          { value: '', label: '-- Select Assigned DID --' },
                          ...assignedDids.map((d: any) => ({
                            value: d.did_number,
                            label: `${d.did_number} ${d.tenant_name ? '(' + d.tenant_name + ')' : '(Assigned)'}`
                          }))
                        ]}
                        value={formData.did_number}
                        onChange={val => setFormData({ ...formData, did_number: val })}
                      />
                    ) : (
                      <input
                        required
                        className="form-control"
                        value={formData.did_number}
                        onChange={e => setFormData({ ...formData, did_number: e.target.value })}
                        placeholder="e.g. ^91\\d{10}$"
                      />
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Destination Type</label>
                    <CustomSelect
                      options={[
                        { value: 'queue', label: 'Call Queue' },
                        { value: 'extension', label: 'Extension' },
                        { value: 'ivr', label: 'IVR Menu Flow' },
                        { value: 'voicemail', label: 'Voicemail Box' }
                      ]}
                      value={formData.destination_type}
                      onChange={handleDestTypeChange}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label required">
                      Destination Target
                      <small style={{ color: '#6B7280', fontWeight: 400, marginLeft: '8px' }}>
                        ({formData.destination_type === 'queue' ? queues.length + ' queue(s)' : formData.destination_type === 'ivr' ? ivrs.length + ' IVR flow(s)' : extensions.length + ' extension(s)'} available)
                      </small>
                    </label>
                    {destinationOptions.length > 0 ? (
                      <CustomSelect
                        options={[
                          { value: '', label: `-- Select ${formData.destination_type === 'queue' ? 'Call Queue' : formData.destination_type === 'ivr' ? 'IVR Flow' : 'Extension'} --` },
                          ...destinationOptions
                        ]}
                        value={formData.destination}
                        onChange={val => setFormData({ ...formData, destination: val })}
                      />
                    ) : (
                      <input
                        required
                        className="form-control"
                        value={formData.destination}
                        onChange={e => setFormData({ ...formData, destination: e.target.value })}
                        placeholder="e.g. 7001 or 1001"
                      />
                    )}
                  </div>

                  {user?.role === 'SUPER_ADMIN' && (
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Target Tenant (Optional)</label>
                      <CustomSelect
                        options={[
                          { value: '', label: '-- Global / Select Tenant --' },
                          ...tenants.map(t => ({ value: t.id, label: `${t.name} (${t.domain})` }))
                        ]}
                        value={formData.tenant_id}
                        onChange={val => setFormData({ ...formData, tenant_id: val })}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Routing Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-backdrop">
          <div className="terrix-modal" style={{ maxWidth: '580px' }}>
            <div className="modal-head">
              <div className="modal-icon"><RouteIcon size={20} /></div>
              <div>
                <h3>Edit Routing Rule</h3>
                <p>Modify route destination, type, pattern or priority</p>
              </div>
              <button className="modal-close" onClick={() => { setShowEditModal(false); setEditingRouteId(null); }}>×</button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label required">Route Name</label>
                    <input
                      required
                      className="form-control"
                      value={editFormData.name}
                      onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                      placeholder="e.g. Sales DID Inbound"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Route Type</label>
                    <CustomSelect
                      options={[
                        { value: 'inbound_did', label: 'Inbound DID Route' },
                        { value: 'outbound', label: 'Outbound Dialplan Rule' }
                      ]}
                      value={editFormData.route_type}
                      onChange={val => setEditFormData({ ...editFormData, route_type: val })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required">
                      {editFormData.route_type === 'inbound_did' ? 'Assigned DID Number' : 'Regex / Match Pattern'}
                    </label>
                    {editFormData.route_type === 'inbound_did' ? (
                      <CustomSelect
                        options={[
                          { value: '', label: '-- Select Assigned DID --' },
                          ...assignedDids.map((d: any) => ({
                            value: d.did_number,
                            label: `${d.did_number} ${d.tenant_name ? '(' + d.tenant_name + ')' : '(Assigned)'}`
                          }))
                        ]}
                        value={editFormData.did_number}
                        onChange={val => setEditFormData({ ...editFormData, did_number: val })}
                      />
                    ) : (
                      <input
                        required
                        className="form-control"
                        value={editFormData.did_number}
                        onChange={e => setEditFormData({ ...editFormData, did_number: e.target.value })}
                        placeholder="e.g. ^91\\d{10}$"
                      />
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Destination Type</label>
                    <CustomSelect
                      options={[
                        { value: 'queue', label: 'Call Queue' },
                        { value: 'extension', label: 'Extension' },
                        { value: 'ivr', label: 'IVR Menu Flow' },
                        { value: 'voicemail', label: 'Voicemail Box' }
                      ]}
                      value={editFormData.destination_type}
                      onChange={handleEditDestTypeChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      className="form-control"
                      value={editFormData.priority}
                      onChange={e => setEditFormData({ ...editFormData, priority: parseInt(e.target.value) || 1 })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <CustomSelect
                      options={[
                        { value: 'true', label: 'Active / Enabled' },
                        { value: 'false', label: 'Disabled' }
                      ]}
                      value={editFormData.enabled ? 'true' : 'false'}
                      onChange={val => setEditFormData({ ...editFormData, enabled: val === 'true' })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label required">
                      Destination Target
                      <small style={{ color: '#6B7280', fontWeight: 400, marginLeft: '8px' }}>
                        ({editFormData.destination_type === 'queue' ? queues.length + ' queue(s)' : editFormData.destination_type === 'ivr' ? ivrs.length + ' IVR flow(s)' : extensions.length + ' extension(s)'} available)
                      </small>
                    </label>
                    {editDestinationOptions.length > 0 ? (
                      <CustomSelect
                        options={[
                          { value: '', label: `-- Select ${editFormData.destination_type === 'queue' ? 'Call Queue' : editFormData.destination_type === 'ivr' ? 'IVR Flow' : 'Extension'} --` },
                          ...editDestinationOptions
                        ]}
                        value={editFormData.destination}
                        onChange={val => setEditFormData({ ...editFormData, destination: val })}
                      />
                    ) : (
                      <input
                        required
                        className="form-control"
                        value={editFormData.destination}
                        onChange={e => setEditFormData({ ...editFormData, destination: e.target.value })}
                        placeholder="e.g. 7001 or 1001"
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => { setShowEditModal(false); setEditingRouteId(null); }}>Cancel</button>
                <button type="submit" className="btn-primary">Update Routing Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
