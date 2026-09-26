import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Route as RouteIcon, Plus, Search, Trash2 } from 'lucide-react';

interface RoutingViewProps {
  token: string;
}

export const RoutingView: React.FC<RoutingViewProps> = ({ token }) => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    did_number: '',
    route_type: 'inbound_did',
    destination_type: 'queue',
    destination: '7001',
    priority: 1,
    gateway_id: '',
    tenant_id: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [rData, tData] = await Promise.allSettled([
        apiService.getRoutes(token),
        apiService.getTenants(token)
      ]);
      if (rData.status === 'fulfilled') setRoutes(rData.value);
      if (tData.status === 'fulfilled') setTenants(tData.value);
          } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { ...formData };
      if (!payload.gateway_id) delete payload.gateway_id;
      if (!payload.tenant_id) delete payload.tenant_id;
      await apiService.createRoute(token, payload);
      setShowModal(false);
      setFormData({ name: '', did_number: '', route_type: 'inbound_did', destination_type: 'queue', destination: '7001', priority: 1, gateway_id: '', tenant_id: '' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create route');
    }
  };

  const handleDelete = async (routeId: string) => {
    if (!window.confirm('Are you sure you want to delete this routing rule?')) return;
    try {
      await apiService.deleteRoute(token, routeId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete route');
    }
  };

  const filtered = routes.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.did_number && r.did_number.includes(search))
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Dialplan Engine</div>
          <h1 className="page-title">Call Routing Rules</h1>
          <p className="page-sub">Configure tenant-wise inbound DID routing and outbound pattern matching linked with mod_xml_curl</p>
        </div>
        <div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Routing Rule
          </button>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px' }}>
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
                <th>Tenant</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-4">Loading call routes...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-4 text-muted">No routing rules match your search</td></tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id}>
                    <td><div style={{ fontWeight: 700, color: '#111827' }}>{r.name}</div></td>
                    <td><code className="code-box" style={{ padding: '4px 8px', fontSize: '11px' }}>{r.did_number || r.regex_pattern || '*'}</code></td>
                    <td>
                      {r.route_type === 'inbound_did' ? (
                        <span className="terrix-badge green">INBOUND</span>
                      ) : (
                        <span className="terrix-badge orange">OUTBOUND</span>
                      )}
                    </td>
                    <td><span className="terrix-badge grey">{r.destination_type.toUpperCase()}</span></td>
                    <td><strong style={{ color: '#111827' }}>{r.destination}</strong></td>
                    <td><span style={{ fontWeight: 700 }}>P{r.priority}</span></td>
                    <td><span className="terrix-badge orange">{r.tenant_name || 'Global'}</span></td>
                    <td className="text-right">
                      <button className="btn-secondary text-rose-600" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleDelete(r.id)}>
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
          <div className="terrix-modal">
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
                    <label className="form-label">Route Name</label>
                    <input required className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Sales DID Route" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target Tenant (Optional)</label>
                    <select className="form-control" value={formData.tenant_id} onChange={e => setFormData({...formData, tenant_id: e.target.value})}>
                      <option value="">-- Global / Select Tenant --</option>
                      {tenants.map(t => <option key={t.id} value={t.id}>{t.name} ({t.domain})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Route Type</label>
                    <select className="form-control" value={formData.route_type} onChange={e => setFormData({...formData, route_type: e.target.value})}>
                      <option value="inbound_did">Inbound DID Route</option>
                      <option value="outbound">Outbound Dialplan Rule</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">DID Number / Regex Pattern</label>
                    <input className="form-control" value={formData.did_number} onChange={e => setFormData({...formData, did_number: e.target.value})} placeholder="e.g. +18005550199" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Destination Type</label>
                    <select className="form-control" value={formData.destination_type} onChange={e => setFormData({...formData, destination_type: e.target.value})}>
                      <option value="queue">Call Queue</option>
                      <option value="extension">Extension</option>
                      <option value="ivr">IVR Menu Flow</option>
                      <option value="voicemail">Voicemail Box</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Destination Target</label>
                    <input required className="form-control" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} placeholder="e.g. 7001 or 1001" />
                  </div>
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
