import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import { Route as RouteIcon, Plus, Search, Trash2 } from 'lucide-react';

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

  const filtered = routes.filter(r =>
    (r.name && r.name.toLowerCase().includes(search.toLowerCase())) ||
    (r.did_number && r.did_number.includes(search)) ||
    (r.destination && r.destination.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Dialplan Engine</div>
          <h1 className="page-title">Call Routing Rules</h1>
          <p className="page-sub">Configure tenant-wise inbound DID routing and outbound pattern matching</p>
        </div>
        <div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Routing Rule
          </button>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              className="form-control"
              style={{ paddingLeft: '36px', height: '38px', fontSize: '12px' }}
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
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={user?.role === 'SUPER_ADMIN' ? 8 : 7} className="text-center py-4">Loading routing rules...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={user?.role === 'SUPER_ADMIN' ? 8 : 7} className="text-center py-4 text-muted">No routing rules configured yet</td></tr>
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
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn-secondary text-rose-600"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        onClick={() => handleDelete(r.id)}
                        title="Delete Route"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
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
                    <select
                      className="form-control"
                      value={formData.route_type}
                      onChange={e => setFormData({ ...formData, route_type: e.target.value })}
                    >
                      <option value="inbound_did">Inbound DID Route</option>
                      <option value="outbound">Outbound Dialplan Rule</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label required">
                      {formData.route_type === 'inbound_did' ? 'Assigned DID Number' : 'Regex / Match Pattern'}
                    </label>
                    {formData.route_type === 'inbound_did' ? (
                      <select
                        required
                        className="form-control"
                        value={formData.did_number}
                        onChange={e => setFormData({ ...formData, did_number: e.target.value })}
                      >
                        <option value="">-- Select Assigned DID --</option>
                        {assignedDids.map((d: any) => (
                          <option key={d.id} value={d.did_number}>
                            {d.did_number} {d.tenant_name ? '(' + d.tenant_name + ')' : '(Assigned)'}
                          </option>
                        ))}
                        {assignedDids.length === 0 && (
                          <option disabled value="">No DIDs assigned to this tenant</option>
                        )}
                      </select>
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
                    <select
                      className="form-control"
                      value={formData.destination_type}
                      onChange={e => handleDestTypeChange(e.target.value)}
                    >
                      <option value="queue">Call Queue</option>
                      <option value="extension">Extension</option>
                      <option value="ivr">IVR Menu Flow</option>
                      <option value="voicemail">Voicemail Box</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label required">
                      Destination Target
                      <small style={{ color: '#6B7280', fontWeight: 400, marginLeft: '8px' }}>
                        ({formData.destination_type === 'queue' ? queues.length + ' queue(s)' : formData.destination_type === 'ivr' ? ivrs.length + ' IVR flow(s)' : extensions.length + ' extension(s)'} available)
                      </small>
                    </label>
                    {destinationOptions.length > 0 ? (
                      <select
                        required
                        className="form-control"
                        value={formData.destination}
                        onChange={e => setFormData({ ...formData, destination: e.target.value })}
                      >
                        <option value="">
                          -- Select {formData.destination_type === 'queue' ? 'Call Queue' : formData.destination_type === 'ivr' ? 'IVR Flow' : 'Extension'} --
                        </option>
                        {destinationOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
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
                      <select
                        className="form-control"
                        value={formData.tenant_id}
                        onChange={e => setFormData({ ...formData, tenant_id: e.target.value })}
                      >
                        <option value="">-- Global / Select Tenant --</option>
                        {tenants.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.domain})</option>
                        ))}
                      </select>
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
    </div>
  );
};
