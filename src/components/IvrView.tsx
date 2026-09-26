import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { GitBranch, Plus, Volume2 } from 'lucide-react';

interface IvrViewProps {
  token: string;
}

export const IvrView: React.FC<IvrViewProps> = ({ token }) => {
  const [ivrs, setIvrs] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    greeting_audio: 'welcome_prompt.wav',
    direct_extension_dial: true,
    timeout: 10,
    tenant_id: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [iData, tData] = await Promise.allSettled([
        apiService.getIvrs(token),
        apiService.getTenants(token)
      ]);
      if (iData.status === 'fulfilled') setIvrs(iData.value);
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
      await apiService.createIvr(token, payload);
      setShowModal(false);
      setFormData({ name: '', greeting_audio: 'welcome_prompt.wav', direct_extension_dial: true, timeout: 10, tenant_id: '' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create IVR flow');
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Auto-Attendant Engine</div>
          <h1 className="page-title">IVR Flow Designer</h1>
          <p className="page-sub">Design multi-level interactive voice response menus and DTMF key actions per tenant</p>
        </div>
        <div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Create IVR Flow
          </button>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>IVR Menu Name</th>
                <th>Greeting Audio Prompt</th>
                <th>Direct Extension Dial</th>
                <th>Digit Timeout</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-4">Loading IVR flows...</td></tr>
              ) : ivrs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-4 text-muted">No IVR menus designed yet</td></tr>
              ) : (
                ivrs.map(i => (
                  <tr key={i.id}>
                    <td><strong style={{ color: '#111827' }}>{i.name}</strong></td>
                    <td><span className="terrix-badge grey"><Volume2 size={10} style={{ marginRight: '4px' }} /> {i.greeting_audio}</span></td>
                    <td>{i.direct_extension_dial ? <span className="terrix-badge green">ENABLED</span> : <span className="terrix-badge grey">DISABLED</span>}</td>
                    <td>{i.timeout} seconds</td>
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
              <div className="modal-icon"><GitBranch size={20} /></div>
              <div>
                <h3>Create IVR Menu Flow</h3>
                <p>Configure audio prompt & DTMF keypad routing rules</p>
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
                  <label className="form-label">IVR Flow Name</label>
                  <input required className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Main Company Welcome IVR" />
                </div>
                <div className="form-group mb-3">
                  <label className="form-label">Greeting Audio File</label>
                  <input className="form-control" value={formData.greeting_audio} onChange={e => setFormData({...formData, greeting_audio: e.target.value})} placeholder="welcome_prompt.wav" />
                </div>
                <div className="form-group mb-3">
                  <label className="form-label">Digit Timeout (seconds)</label>
                  <input type="number" className="form-control" value={formData.timeout} onChange={e => setFormData({...formData, timeout: parseInt(e.target.value) || 10})} />
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save IVR Flow</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
