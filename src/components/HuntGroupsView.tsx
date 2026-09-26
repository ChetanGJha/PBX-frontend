import { useToast } from './ToastProvider';
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { PhoneForwarded, Plus } from 'lucide-react';

interface HuntGroupsViewProps {
  token: string;
}

export const HuntGroupsView: React.FC<HuntGroupsViewProps> = ({ token }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [huntGroups, setHuntGroups] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    extension_number: '',
    strategy: 'sequential',
    members: '1001, 1002',
    timeout: 20,
    tenant_id: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [hData, tData] = await Promise.allSettled([
        apiService.getHuntGroups(token),
        apiService.getTenants(token)
      ]);
      if (hData.status === 'fulfilled') setHuntGroups(hData.value);
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
      if (!payload.tenant_id) delete payload.tenant_id;
      await apiService.createHuntGroup(token, payload);
      setShowModal(false);
      showSuccessModal('Hunt Group Created', `Hunt group "${formData.name}" (ext/${formData.extension_number}) configured.`);
      setFormData({ name: '', extension_number: '', strategy: 'sequential', members: '1001, 1002', timeout: 20, tenant_id: '' });
      loadData();
    } catch (err: any) {
      showErrorModal('Failed to Create Hunt Group', err.message || 'Failed to create hunt group');
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Call Distribution</div>
          <h1 className="page-title">Hunt Groups</h1>
          <p className="page-sub">Configure sequential, simultaneous & circular hunt groups per tenant</p>
        </div>
        <div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Create Hunt Group
          </button>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Hunt Group Name</th>
                <th>Extension Number</th>
                <th>Ring Strategy</th>
                <th>Member Extensions</th>
                <th>Timeout</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-4">Loading hunt groups...</td></tr>
              ) : huntGroups.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-4 text-muted">No hunt groups created</td></tr>
              ) : (
                huntGroups.map(h => (
                  <tr key={h.id}>
                    <td><strong style={{ color: '#111827' }}>{h.name}</strong></td>
                    <td><code className="code-box" style={{ padding: '4px 8px', fontSize: '11px' }}>{h.extension_number}</code></td>
                    <td><span className="terrix-badge grey">{h.strategy.toUpperCase()}</span></td>
                    <td>{h.members}</td>
                    <td>{h.timeout}s</td>
                    <td><span className="terrix-badge green">ACTIVE</span></td>
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
              <div className="modal-icon"><PhoneForwarded size={20} /></div>
              <div>
                <h3>Create Hunt Group</h3>
                <p>Ring extension sequences when receiving calls</p>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group mb-3">
                  <label className="form-label">Target Tenant (Optional)</label>
                  <select className="form-control" value={formData.tenant_id} onChange={e => setFormData({...formData, tenant_id: e.target.value})}>
                    <option value="">-- Global / Select Tenant --</option>
                    {tenants.map(t => <option key={t.id} value={t.id}>{t.name} ({t.domain})</option>)}
                  </select>
                </div>
                <div className="form-group mb-3">
                  <label className="form-label">Hunt Group Name</label>
                  <input required className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Sales Team Hunt Group" />
                </div>
                <div className="form-group mb-3">
                  <label className="form-label">Virtual Extension Number</label>
                  <input required className="form-control" value={formData.extension_number} onChange={e => setFormData({...formData, extension_number: e.target.value})} placeholder="e.g. 8001" />
                </div>
                <div className="form-group mb-3">
                  <label className="form-label">Ring Strategy</label>
                  <select className="form-control" value={formData.strategy} onChange={e => setFormData({...formData, strategy: e.target.value})}>
                    <option value="sequential">Sequential (One by one)</option>
                    <option value="simultaneous">Simultaneous (Ring all)</option>
                    <option value="circular">Circular (Round-robin)</option>
                  </select>
                </div>
                <div className="form-group mb-3">
                  <label className="form-label">Member Extensions (Comma separated)</label>
                  <input required className="form-control" value={formData.members} onChange={e => setFormData({...formData, members: e.target.value})} placeholder="e.g. 1001, 1002, 1003" />
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Hunt Group</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
