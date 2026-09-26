import { useToast } from './ToastProvider';
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Users, Plus, Edit2, Trash2 } from 'lucide-react';

interface QueuesViewProps {
  token: string;
}

export const QueuesView: React.FC<QueuesViewProps> = ({ token }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [queues, setQueues] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingQueue, setEditingQueue] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    queue_number: '',
    strategy: 'round_robin',
    agent_timeout: 30,
    wrap_up_time: 10,
    max_wait_time: 300,
    agents: '1001, 1002',
    tenant_id: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [qData, tData] = await Promise.allSettled([
        apiService.getQueues(token),
        apiService.getTenants(token)
      ]);
      if (qData.status === 'fulfilled') setQueues(qData.value);
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

  const handleOpenCreate = () => {
    setEditingQueue(null);
    setFormData({ name: '', queue_number: '', strategy: 'round_robin', agent_timeout: 30, wrap_up_time: 10, max_wait_time: 300, agents: '1001, 1002', tenant_id: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (q: any) => {
    setEditingQueue(q);
    setFormData({
      name: q.name,
      queue_number: q.queue_number,
      strategy: q.strategy,
      agent_timeout: q.agent_timeout,
      wrap_up_time: q.wrap_up_time || 10,
      max_wait_time: q.max_wait_time || 300,
      agents: q.agents || '',
      tenant_id: q.tenant_id || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { ...formData };
      if (!payload.tenant_id) delete payload.tenant_id;

      if (editingQueue) {
        await apiService.updateQueue(token, editingQueue.id, payload);
      } else {
        await apiService.createQueue(token, payload);
      }
      setShowModal(false);
      showSuccessModal('Call Queue Saved', `Queue "${formData.name}" (ext/${formData.queue_number}) has been saved.`);
      loadData();
    } catch (err: any) {
      showErrorModal('Failed to Save Queue', err.message || 'Failed to save call queue');
    }
  };

  const handleDelete = async (queueId: string) => {
    if (!window.confirm('Are you sure you want to delete this queue?')) return;
    try {
      await apiService.deleteQueue(token, queueId);
      showSuccessModal('Queue Deleted', 'Call queue has been removed.');
      loadData();
    } catch (err: any) {
      showErrorModal('Failed to Delete Queue', err.message || 'Failed to delete queue');
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">ACR Queue Engine</div>
          <h1 className="page-title">Call Queues</h1>
          <p className="page-sub">FreeSWITCH mod_callcenter agent queues, distribution strategies and wait timers</p>
        </div>
        <div>
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Create Call Queue
          </button>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Queue Name</th>
                <th>Extension</th>
                <th>Strategy</th>
                <th>Agent Timeout</th>
                <th>Max Wait Time</th>
                <th>Agents</th>
                <th>Tenant</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-4">Loading call queues...</td></tr>
              ) : queues.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-4 text-muted">No call queues configured</td></tr>
              ) : (
                queues.map((q) => (
                  <tr key={q.id}>
                    <td><div style={{ fontWeight: 700, color: '#111827' }}>{q.name}</div></td>
                    <td><code className="code-box" style={{ padding: '4px 8px', fontSize: '11px' }}>{q.queue_number}</code></td>
                    <td><span className="terrix-badge grey">{q.strategy.toUpperCase()}</span></td>
                    <td>{q.agent_timeout}s</td>
                    <td>{q.max_wait_time}s</td>
                    <td>{q.agents || 'All Extensions'}</td>
                    <td><span className="terrix-badge orange">{q.tenant_name || 'Global'}</span></td>
                    <td className="text-right">
                      <button className="btn-secondary text-amber-600" style={{ padding: '4px 8px', fontSize: '11px', marginRight: '6px' }} onClick={() => handleOpenEdit(q)}>
                        <Edit2 size={13} style={{ marginRight: '4px' }} /> Edit
                      </button>
                      <button className="btn-secondary text-rose-600" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleDelete(q.id)}>
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
              <div className="modal-icon"><Users size={20} /></div>
              <div>
                <h3>{editingQueue ? 'Edit Call Queue' : 'Create Call Queue'}</h3>
                <p>Configure mod_callcenter agent distribution strategy</p>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Queue Name</label>
                    <input required className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Support Escalations" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Virtual Extension Number</label>
                    <input required className="form-control" value={formData.queue_number} onChange={e => setFormData({...formData, queue_number: e.target.value})} placeholder="e.g. 7001" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target Tenant (Optional)</label>
                    <select className="form-control" value={formData.tenant_id} onChange={e => setFormData({...formData, tenant_id: e.target.value})}>
                      <option value="">-- Global / Select Tenant --</option>
                      {tenants.map(t => <option key={t.id} value={t.id}>{t.name} ({t.domain})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Distribution Strategy</label>
                    <select className="form-control" value={formData.strategy} onChange={e => setFormData({...formData, strategy: e.target.value})}>
                      <option value="round_robin">Round Robin</option>
                      <option value="longest_idle_agent">Longest Idle Agent</option>
                      <option value="ring_all">Ring All Agents</option>
                      <option value="top_down">Top Down Priority</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Agent Timeout (seconds)</label>
                    <input type="number" className="form-control" value={formData.agent_timeout} onChange={e => setFormData({...formData, agent_timeout: parseInt(e.target.value) || 30})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Queue Wait Time (seconds)</label>
                    <input type="number" className="form-control" value={formData.max_wait_time} onChange={e => setFormData({...formData, max_wait_time: parseInt(e.target.value) || 300})} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Assigned Member Extensions (Comma separated)</label>
                    <input className="form-control" value={formData.agents} onChange={e => setFormData({...formData, agents: e.target.value})} placeholder="e.g. 1001, 1002, 1003" />
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Call Queue</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
