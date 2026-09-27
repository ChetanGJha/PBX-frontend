import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import { Users, Plus, Edit2, Trash2, Search, X } from 'lucide-react';

interface QueuesViewProps {
  token: string;
  user?: User | null;
}

export const QueuesView: React.FC<QueuesViewProps> = ({ token, user }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [queues, setQueues] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingQueue, setEditingQueue] = useState<any>(null);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [agentSearch, setAgentSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    queue_number: '',
    strategy: 'round_robin',
    agent_timeout: 30,
    wrap_up_time: 10,
    max_wait_time: 300,
    tenant_id: user?.tenant_id || ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [qData, tData, extData] = await Promise.allSettled([
        apiService.getQueues(token),
        apiService.getTenants(token),
        apiService.getExtensions(token)
      ]);
      if (qData.status === 'fulfilled') setQueues(qData.value);
      if (tData.status === 'fulfilled') setTenants(tData.value);
      if (extData.status === 'fulfilled') setExtensions(extData.value);
    } catch (err) {
      console.error('Failed to load queues data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Extensions filtered by current tenant context
  const tenantExtensions = useMemo(() => {
    if (user?.role === 'SUPER_ADMIN') {
      if (formData.tenant_id) {
        return extensions.filter(e => e.tenant_id === formData.tenant_id);
      }
      return extensions;
    }
    return extensions.filter(e => e.tenant_id === user?.tenant_id || !e.tenant_id);
  }, [extensions, user, formData.tenant_id]);

  const handleOpenCreate = () => {
    setEditingQueue(null);
    setSelectedAgents([]);
    setAgentSearch('');
    setFormData({
      name: '',
      queue_number: '',
      strategy: 'round_robin',
      agent_timeout: 30,
      wrap_up_time: 10,
      max_wait_time: 300,
      tenant_id: user?.tenant_id || ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (q: any) => {
    setEditingQueue(q);
    const existing = q.agents
      ? q.agents.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];
    setSelectedAgents(existing);
    setAgentSearch('');
    setFormData({
      name: q.name,
      queue_number: q.queue_number,
      strategy: q.strategy || 'round_robin',
      agent_timeout: q.agent_timeout || 30,
      wrap_up_time: q.wrap_up_time || 10,
      max_wait_time: q.max_wait_time || 300,
      tenant_id: q.tenant_id || user?.tenant_id || ''
    });
    setShowModal(true);
  };

  const toggleAgent = (extNum: string) => {
    setSelectedAgents(prev =>
      prev.includes(extNum) ? prev.filter(x => x !== extNum) : [...prev, extNum]
    );
  };

  const handleSelectAllAgents = () => {
    const all = tenantExtensions.map(e => e.extension_number);
    setSelectedAgents(all);
  };

  const handleClearAllAgents = () => {
    setSelectedAgents([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        ...formData,
        agents: selectedAgents.join(', ')
      };

      if (user?.role !== 'SUPER_ADMIN' && user?.tenant_id) {
        payload.tenant_id = user.tenant_id;
      } else if (!payload.tenant_id) {
        delete payload.tenant_id;
      }

      if (editingQueue) {
        await apiService.updateQueue(token, editingQueue.id, payload);
        showSuccessModal(
          'Queue Updated Successfully',
          `Call queue "${formData.name}" (ext/${formData.queue_number}) has been updated.`
        );
      } else {
        await apiService.createQueue(token, payload);
        showSuccessModal(
          'Queue Created Successfully',
          `Call queue "${formData.name}" (ext/${formData.queue_number}) has been configured with ${selectedAgents.length} assigned member agent(s).`
        );
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      showErrorModal('Queue Operation Failed', err.message || 'Failed to save call queue');
    }
  };

  const handleDelete = async (q: any) => {
    if (!window.confirm(`Delete call queue "${q.name}" (${q.queue_number})?`)) return;
    try {
      await apiService.deleteQueue(token, q.id);
      showSuccessModal(
        'Queue Deleted',
        `Call queue "${q.name}" has been deleted.`
      );
      loadData();
    } catch (err: any) {
      showErrorModal('Failed to Delete Queue', err.message || 'Could not delete queue');
    }
  };

  const filtered = queues.filter(q =>
    (q.name && q.name.toLowerCase().includes(search.toLowerCase())) ||
    (q.queue_number && q.queue_number.includes(search))
  );

  const filteredExtensions = tenantExtensions.filter(ext =>
    ext.extension_number.includes(agentSearch) ||
    (ext.display_name && ext.display_name.toLowerCase().includes(agentSearch.toLowerCase()))
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Automatic Call Distribution (ACD)</div>
          <h1 className="page-title">Call Queues</h1>
          <p className="page-sub">Configure call distribution tiers, ring strategies, and multi-select agent extensions</p>
        </div>
        <div>
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Add Call Queue
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
              placeholder="Search queues..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#6B7280' }}>
            Total <strong>{filtered.length}</strong> active queue{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Queue Name</th>
                <th>Queue Number</th>
                <th>Ring Strategy</th>
                <th>Assigned Agent Members</th>
                <th>Timeouts (Ring/Wait)</th>
                {user?.role === 'SUPER_ADMIN' && <th>Tenant</th>}
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={user?.role === 'SUPER_ADMIN' ? 7 : 6} className="text-center py-4">Loading call queues...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={user?.role === 'SUPER_ADMIN' ? 7 : 6} className="text-center py-4 text-muted">No call queues configured</td></tr>
              ) : (
                filtered.map(q => {
                  const agentList = q.agents
                    ? q.agents.split(',').map((s: string) => s.trim()).filter(Boolean)
                    : [];
                  return (
                    <tr key={q.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#FFF0EC', color: '#FF5430', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={14} />
                          </div>
                          <strong style={{ color: '#111827', fontSize: '13px' }}>{q.name}</strong>
                        </div>
                      </td>
                      <td>
                        <code className="code-box" style={{ padding: '3px 8px', fontSize: '11px', fontWeight: 700 }}>
                          {q.queue_number}
                        </code>
                      </td>
                      <td>
                        <span className="terrix-badge orange">{q.strategy.replace('_', ' ').toUpperCase()}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                          {agentList.length === 0 ? (
                            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>No members</span>
                          ) : (
                            <>
                              <span className="terrix-badge grey" style={{ fontWeight: 700 }}>
                                {agentList.length} Agent{agentList.length !== 1 ? 's' : ''}
                              </span>
                              {agentList.slice(0, 3).map((ag: string) => (
                                <span key={ag} style={{ fontSize: '11px', background: '#F1F5F9', color: '#334155', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                                  {ag}
                                </span>
                              ))}
                              {agentList.length > 3 && (
                                <span style={{ fontSize: '10.5px', color: '#6B7280' }}>+{agentList.length - 3} more</span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '11.5px', color: '#4B5563' }}>
                          Ring: <strong>{q.agent_timeout}s</strong> / Max Wait: <strong>{q.max_wait_time}s</strong>
                        </div>
                      </td>
                      {user?.role === 'SUPER_ADMIN' && (
                        <td>
                          <span className="terrix-badge green">{q.tenant_name || 'Global'}</span>
                        </td>
                      )}
                      <td className="text-right">
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '5px 8px', fontSize: '11px' }}
                            onClick={() => handleOpenEdit(q)}
                            title="Edit Queue"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn-secondary text-rose-600"
                            style={{ padding: '5px 8px', fontSize: '11px' }}
                            onClick={() => handleDelete(q)}
                            title="Delete Queue"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="terrix-modal" style={{ maxWidth: '640px' }}>
            <div className="modal-head">
              <div className="modal-icon"><Users size={20} /></div>
              <div>
                <h3>{editingQueue ? 'Edit Call Queue' : 'Create Call Queue'}</h3>
                <p>Configure queue number, ring strategy, and multi-select member extensions</p>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label required">Queue Name</label>
                    <input
                      required
                      className="form-control"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Sales Tier 1 Queue"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Queue Extension Number</label>
                    <input
                      required
                      className="form-control"
                      value={formData.queue_number}
                      onChange={e => setFormData({ ...formData, queue_number: e.target.value })}
                      placeholder="e.g. 7001"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Ring Strategy</label>
                    <select
                      className="form-control"
                      value={formData.strategy}
                      onChange={e => setFormData({ ...formData, strategy: e.target.value })}
                    >
                      <option value="round_robin">Round Robin (Sequential)</option>
                      <option value="ring_all">Ring All Available</option>
                      <option value="longest_idle_agent">Longest Idle Agent</option>
                      <option value="least_talk_time">Least Talk Time</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Agent Ring Timeout (sec)</label>
                    <input
                      type="number"
                      min={5}
                      max={120}
                      className="form-control"
                      value={formData.agent_timeout}
                      onChange={e => setFormData({ ...formData, agent_timeout: parseInt(e.target.value) || 30 })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Max Queue Wait Time (sec)</label>
                    <input
                      type="number"
                      min={10}
                      max={1800}
                      className="form-control"
                      value={formData.max_wait_time}
                      onChange={e => setFormData({ ...formData, max_wait_time: parseInt(e.target.value) || 300 })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Wrap-Up Time (sec)</label>
                    <input
                      type="number"
                      min={0}
                      max={300}
                      className="form-control"
                      value={formData.wrap_up_time}
                      onChange={e => setFormData({ ...formData, wrap_up_time: parseInt(e.target.value) || 10 })}
                    />
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

                  {/* Multi-Select Assigned Member Extensions */}
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="form-label required" style={{ marginBottom: 0 }}>
                        Assigned Member Extensions ({selectedAgents.length} selected)
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={handleSelectAllAgents}
                          style={{ background: 'none', border: 'none', color: '#FF5430', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Select All
                        </button>
                        <span style={{ color: '#D1D5DB' }}>|</span>
                        <button
                          type="button"
                          onClick={handleClearAllAgents}
                          style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Selected Agents Pills */}
                    {selectedAgents.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px', padding: '8px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        {selectedAgents.map(extNum => {
                          const extObj = tenantExtensions.find(e => e.extension_number === extNum);
                          return (
                            <span
                              key={extNum}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#FFF0EC',
                                border: '1px solid #FFCCBC',
                                color: '#D84315',
                                borderRadius: '6px',
                                padding: '3px 8px',
                                fontSize: '11.5px',
                                fontWeight: 600
                              }}
                            >
                              ext/{extNum} {extObj?.display_name ? `(${extObj.display_name})` : ''}
                              <button
                                type="button"
                                onClick={() => toggleAgent(extNum)}
                                style={{ background: 'none', border: 'none', color: '#D84315', cursor: 'pointer', padding: 0, display: 'flex' }}
                              >
                                <X size={13} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Extensions Search & Checklist Box */}
                    <div style={{ border: '1px solid #D1D5DB', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ padding: '6px 10px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                        <input
                          type="text"
                          placeholder="Filter extensions by number or name..."
                          value={agentSearch}
                          onChange={e => setAgentSearch(e.target.value)}
                          style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '11.5px', outline: 'none' }}
                        />
                      </div>
                      <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '6px' }}>
                        {filteredExtensions.length === 0 ? (
                          <div style={{ padding: '12px', textAlign: 'center', color: '#9CA3AF', fontSize: '12px' }}>
                            {tenantExtensions.length === 0 ? 'No extensions provisioned for this tenant' : 'No matching extensions found'}
                          </div>
                        ) : (
                          filteredExtensions.map(ext => {
                            const isChecked = selectedAgents.includes(ext.extension_number);
                            return (
                              <label
                                key={ext.id || ext.extension_number}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '7px 10px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  marginBottom: '2px',
                                  background: isChecked ? '#FFF3E0' : '#FFFFFF',
                                  border: `1px solid ${isChecked ? '#FFB74D' : 'transparent'}`,
                                  transition: 'background 0.15s ease'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleAgent(ext.extension_number)}
                                  style={{ accentColor: '#FF5430', width: '15px', height: '15px' }}
                                />
                                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>
                                    <strong style={{ fontSize: '12.5px', color: '#111827' }}>ext/{ext.extension_number}</strong>
                                    {ext.display_name && (
                                      <span style={{ marginLeft: '6px', color: '#4B5563', fontSize: '12px' }}>
                                        — {ext.display_name}
                                      </span>
                                    )}
                                  </div>
                                  <span style={{ fontSize: '10.5px', color: '#9CA3AF' }}>{ext.status || 'SIP'}</span>
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingQueue ? 'Update Queue' : 'Create Queue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
