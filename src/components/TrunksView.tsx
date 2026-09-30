import { useToast } from './ToastProvider';
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Network, Plus, Search, Server, ShieldCheck, Activity, CheckCircle2, Edit2, Trash2, Info, ArrowLeftRight, Building2 } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

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
        tenant_id: formData.tenant_id && formData.tenant_id.trim() !== '' ? formData.tenant_id : null
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
        register: true,
        srtp: false
      });
      loadData();
    } catch (err: any) {
      showErrorModal('Failed to Create Trunk', err.message || 'Failed to create SIP trunk');
    }
  };

  const handleEditClick = (trunk: any) => {
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
      tenant_id: trunk.tenant_id || '',
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
        tenant_id: editFormData.tenant_id && editFormData.tenant_id.trim() !== '' ? editFormData.tenant_id : null
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

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">{isReadOnly ? 'Tenant Telephony' : 'Telephony Infrastructure'}</div>
          <h1 className="page-title">{isReadOnly ? 'Assigned SIP Trunks & Gateways' : 'SIP Trunks & Gateways'}</h1>
          <p className="page-sub">
            {isReadOnly 
              ? 'View active carrier SIP trunk connections and FreeSWITCH gateways allocated to your tenant.' 
              : 'Configure carrier SIP trunk connections, proxies, tenant allocations and gateway routes'}
          </p>
        </div>
        {!isReadOnly && (
          <div>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Add SIP Trunk
            </button>
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Active Routes</span>
            <div style={{ background: '#FFF0EC', padding: '6px', borderRadius: '8px', color: 'var(--orange)' }}><Network size={18} /></div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{trunks.length}</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Registered</span>
            <div style={{ background: '#ECFDF5', padding: '6px', borderRadius: '8px', color: '#047857' }}><CheckCircle2 size={18} /></div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{trunks.filter(t => t.register !== false).length}</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Active Channels</span>
            <div style={{ background: '#EFF6FF', padding: '6px', borderRadius: '8px', color: '#2563EB' }}><Activity size={18} /></div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{trunks.filter(t => t.enabled !== false).length * 30}</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Security (SRTP)</span>
            <div style={{ background: '#F3E8FF', padding: '6px', borderRadius: '8px', color: '#9333EA' }}><ShieldCheck size={18} /></div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{trunks.filter(t => t.srtp).length} Enabled</div>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="search-input-wrap" style={{ width: '280px' }}>
            <Search size={16} className="search-icon" />
            <input 
              className="form-control"
              style={{ height: '38px', fontSize: '12px' }}
              placeholder="Search gateways by name, host or tenant..."
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
                <th>Type</th>
                <th>SIP Host / Proxy</th>
                <th>Transport</th>
                <th>Assigned Tenant</th>
                <th>Auth Username</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-4">Loading gateways & trunks...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-4 text-muted">No assigned gateways or SIP trunks found</td></tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#111827' }}>{t.name}</div>
                    </td>
                    <td>
                      <span className={`terrix-badge ${t.itemType === 'Sofia Gateway' ? 'purple' : 'blue'}`}>
                        {t.itemType}
                      </span>
                    </td>
                    <td><code className="code-box" style={{ padding: '4px 8px', fontSize: '11px' }}>{t.host}</code></td>
                    <td><span className="terrix-badge grey">{t.transport}</span></td>
                    <td>
                      {t.tenant_name ? (
                        <span className="terrix-badge green" style={{ fontWeight: 700 }}>
                          {t.tenant_name} ({t.tenant_domain})
                        </span>
                      ) : (
                        <span className="terrix-badge blue" style={{ background: '#E0F2FE', color: '#0369A1', borderColor: '#BAE6FD', fontWeight: 700 }}>
                          Shared (All Tenants)
                        </span>
                      )}
                    </td>
                    <td>{t.username || <span style={{ color: '#9CA3AF' }}>IP Auth</span>}</td>
                    <td>
                      {t.enabled !== false ? (
                        <span className="terrix-badge green">ACTIVE</span>
                      ) : (
                        <span className="terrix-badge orange">DISABLED</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => setViewInfoItem(t)}
                          className="btn-secondary !h-8 !px-2.5 text-xs flex items-center gap-1"
                          title="View Gateway Details"
                        >
                          <Info size={13} className="text-slate-600" />
                          <span>View Info</span>
                        </button>
                        {!isReadOnly && (
                          <>
                            <button
                              onClick={() => handleEditClick(t)}
                              className="btn-secondary !h-8 !px-2.5 text-xs"
                              title="Edit Trunk & Tenant Assignment"
                            >
                              <Edit2 size={13} className="text-slate-600" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setDeleteTrunkId(t.id)}
                              className="btn-secondary !h-8 !px-2.5 text-xs text-rose-600 hover:bg-rose-50"
                              title="Delete SIP Trunk"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW INFO MODAL (READ ONLY) */}
      {viewInfoItem && (
        <div className="modal-backdrop">
          <div className="terrix-modal" style={{ maxWidth: '540px' }}>
            <div className="modal-head">
              <div className="modal-icon text-[#7C3AED] bg-purple-50"><ArrowLeftRight size={20} /></div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{viewInfoItem.name}</h3>
                <p className="text-xs text-slate-500">Gateway Information & Configuration Overview</p>
              </div>
              <button className="modal-close" onClick={() => setViewInfoItem(null)}>×</button>
            </div>

            <div className="modal-body space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Route Type</span>
                  <span className="font-bold text-slate-800">{viewInfoItem.itemType}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Status</span>
                  <span className="font-bold text-emerald-600">{viewInfoItem.enabled !== false ? 'ACTIVE' : 'DISABLED'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Host / Proxy Address</span>
                  <code className="text-xs font-mono font-bold text-slate-800 bg-slate-200/60 px-1.5 py-0.5 rounded">{viewInfoItem.host}</code>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Port & Transport</span>
                  <span className="font-bold text-slate-800">{viewInfoItem.port || 5060} ({viewInfoItem.transport || 'UDP'})</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Auth Username</span>
                  <span className="font-bold text-slate-800">{viewInfoItem.username || 'IP / Passwordless Auth'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">SIP Realm</span>
                  <span className="font-bold text-slate-800">{viewInfoItem.realm || 'Default Domain'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 col-span-2">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Allocated Tenant</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Building2 size={14} className="text-[#FF5430]" />
                    <span>{viewInfoItem.tenant_name ? `${viewInfoItem.tenant_name} (${viewInfoItem.tenant_domain})` : 'Shared (Available to All Tenants)'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button type="button" className="btn-secondary" onClick={() => setViewInfoItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showModal && !isReadOnly && (
        <div className="modal-backdrop">
          <div className="terrix-modal">
            <div className="modal-head">
              <div className="modal-icon"><Server size={20} /></div>
              <div>
                <h3>Register SIP Trunk Connection</h3>
                <p>Add a new carrier SIP proxy or gateway route</p>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Trunk Name</label>
                    <input required className="form-control" placeholder="e.g. Tata Telecommunications" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SIP Host / Proxy IP</label>
                    <input required className="form-control" placeholder="e.g. sip.tata.com" value={formData.host} onChange={e => setFormData({...formData, host: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SIP Port</label>
                    <input type="number" className="form-control" value={formData.port} onChange={e => setFormData({...formData, port: parseInt(e.target.value) || 5060})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Transport Protocol</label>
                    <CustomSelect
                      options={[
                        { value: 'UDP', label: 'UDP (Standard)' },
                        { value: 'TCP', label: 'TCP' },
                        { value: 'TLS', label: 'TLS (Encrypted)' },
                      ]}
                      value={formData.transport}
                      onChange={(val) => setFormData({ ...formData, transport: val })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assign to Tenant (Optional)</label>
                    <CustomSelect
                      options={[
                        { value: '', label: '-- Shared (Global / All Tenants) --' },
                        ...tenants.map(t => ({ value: t.id, label: `${t.name} (${t.domain})` }))
                      ]}
                      value={formData.tenant_id}
                      onChange={(val) => setFormData({ ...formData, tenant_id: val })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority Level</label>
                    <input type="number" min="1" max="10" className="form-control" value={formData.priority} onChange={e => setFormData({...formData, priority: parseInt(e.target.value) || 1})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Auth Username (Optional)</label>
                    <input className="form-control" placeholder="Digest auth user" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Auth Password (Optional)</label>
                    <input type="password" className="form-control" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Register Trunk</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editTrunk && !isReadOnly && (
        <div className="modal-backdrop">
          <div className="terrix-modal">
            <div className="modal-head">
              <div className="modal-icon"><Server size={20} /></div>
              <div>
                <h3>Edit {editTrunk.itemType || 'SIP Trunk'}</h3>
                <p>Update trunk host settings and tenant assignments</p>
              </div>
              <button className="modal-close" onClick={() => setEditTrunk(null)}>×</button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Trunk Name</label>
                    <input required className="form-control" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SIP Host / Proxy</label>
                    <input required className="form-control" value={editFormData.host} onChange={e => setEditFormData({...editFormData, host: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SIP Port</label>
                    <input type="number" className="form-control" value={editFormData.port} onChange={e => setEditFormData({...editFormData, port: parseInt(e.target.value) || 5060})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Transport Protocol</label>
                    <CustomSelect
                      options={[
                        { value: 'UDP', label: 'UDP (Standard)' },
                        { value: 'TCP', label: 'TCP' },
                        { value: 'TLS', label: 'TLS (Encrypted)' },
                      ]}
                      value={editFormData.transport}
                      onChange={(val) => setEditFormData({ ...editFormData, transport: val })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assign to Tenant (Optional)</label>
                    <CustomSelect
                      options={[
                        { value: '', label: '-- Shared (Global / All Tenants) --' },
                        ...tenants.map(t => ({ value: t.id, label: `${t.name} (${t.domain})` }))
                      ]}
                      value={editFormData.tenant_id}
                      onChange={(val) => setEditFormData({ ...editFormData, tenant_id: val })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority Level</label>
                    <input type="number" min="1" max="10" className="form-control" value={editFormData.priority} onChange={e => setEditFormData({...editFormData, priority: parseInt(e.target.value) || 1})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Auth Username</label>
                    <input className="form-control" value={editFormData.username} onChange={e => setEditFormData({...editFormData, username: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Auth Password</label>
                    <input type="password" className="form-control" value={editFormData.password} onChange={e => setEditFormData({...editFormData, password: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setEditTrunk(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Update Trunk</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteTrunkId && !isReadOnly && (
        <div className="modal-backdrop">
          <div className="terrix-modal" style={{ maxWidth: '420px' }}>
            <div className="modal-head">
              <div className="modal-icon red"><Trash2 size={20} /></div>
              <div>
                <h3>Delete Gateway / Trunk</h3>
                <p>Are you sure you want to remove this route?</p>
              </div>
              <button className="modal-close" onClick={() => setDeleteTrunkId(null)}>×</button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-slate-600">
                Deleting this route will disable inbound/outbound call routing for numbers relying on this connection.
              </p>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn-secondary" onClick={() => setDeleteTrunkId(null)}>Cancel</button>
              <button type="button" className="btn-danger" onClick={handleDeleteConfirm}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
