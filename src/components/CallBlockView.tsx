import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { ShieldAlert, Plus, Edit2, Trash2, Search, X, Ban, PhoneOff, CheckCircle2 } from 'lucide-react';

interface CallBlockViewProps {
  token: string;
  user?: User | null;
}

export const CallBlockView: React.FC<CallBlockViewProps> = ({ token, user }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [blocks, setBlocks] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<any>(null);

  const [formData, setFormData] = useState({
    number: '',
    description: '',
    action: 'reject',
    enabled: true,
    tenant_id: user?.tenant_id || ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [bData, tData] = await Promise.allSettled([
        apiService.getCallBlocks(token),
        apiService.getTenants(token)
      ]);
      if (bData.status === 'fulfilled') setBlocks(bData.value);
      if (tData.status === 'fulfilled') setTenants(tData.value);
    } catch (err) {
      console.error('Failed to load call block list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleOpenCreate = () => {
    setEditingBlock(null);
    setFormData({
      number: '',
      description: '',
      action: 'reject',
      enabled: true,
      tenant_id: user?.tenant_id || (tenants[0]?.id || '')
    });
    setShowModal(true);
  };

  const handleOpenEdit = (b: any) => {
    setEditingBlock(b);
    setFormData({
      number: b.number || '',
      description: b.description || '',
      action: b.action || 'reject',
      enabled: b.enabled !== false,
      tenant_id: b.tenant_id || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        tenant_id: formData.tenant_id || null
      };

      if (editingBlock) {
        await apiService.updateCallBlock(token, editingBlock.id, payload);
        showSuccessModal('Updated', `Rule for ${payload.number} updated`);
      } else {
        await apiService.createCallBlock(token, payload);
        showSuccessModal('Number Blocked', `Added ${payload.number} to blocklist`);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      showErrorModal('Error', err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string, number: string) => {
    if (!confirm(`Remove "${number}" from call block list?`)) return;
    try {
      await apiService.deleteCallBlock(token, id);
      showSuccessModal('Removed', `Unblocked ${number}`);
      loadData();
    } catch (err: any) {
      showErrorModal('Failed', err.message || 'Could not delete entry');
    }
  };

  const filtered = blocks.filter(b =>
    (b.number || '').includes(search) ||
    (b.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <div className="eyebrow">Security & Fraud Prevention</div>
          <h1 className="page-title">Call Block (Blacklist)</h1>
          <p className="page-sub">Prevent spam, robocalls, and abusive callers from reaching your extensions, queues, or IVR.</p>
        </div>
        <button onClick={handleOpenCreate} className="btn-primary">
          <Plus size={16} /> Block Caller ID
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="card p-5" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert style={{ width: 22, height: 22, color: '#EF4444' }} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>{blocks.length}</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>Total Blocked Numbers</div>
          </div>
        </div>

        <div className="card p-5" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 style={{ width: 22, height: 22, color: '#10B981' }} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>{blocks.filter(b => b.enabled).length}</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>Active Filters</div>
          </div>
        </div>

        <div className="card p-5" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(100, 116, 139, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PhoneOff style={{ width: 22, height: 22, color: '#64748B' }} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>{blocks.filter(b => b.action === 'reject').length}</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>Direct Rejection Rules</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card p-4 flex items-center justify-between gap-4">
        <div style={{ position: 'relative', width: 320 }}>
          <Search style={{ width: 14, height: 14, color: '#94A3B8', position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search number or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-control"
            style={{ paddingLeft: 34 }}
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold">
          Incoming calls matching any blocked number are intercepted before routing
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Caller ID Number</th>
                <th>Description / Reason</th>
                <th>Action on Match</th>
                <th>Filter Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Ban size={16} color="#DC2626" />
                      </div>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#0F172A' }}>
                        {b.number}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 13, color: '#475569' }}>
                      {b.description || '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: b.action === 'reject' ? '#FEE2E2' : b.action === 'busy' ? '#FEF3C7' : '#E0E7FF',
                      color: b.action === 'reject' ? '#DC2626' : b.action === 'busy' ? '#D97706' : '#4338CA',
                      textTransform: 'uppercase'
                    }}>
                      {b.action === 'reject' ? '603 Decline' : b.action === 'busy' ? '486 Busy' : 'Send Voicemail'}
                    </span>
                  </td>
                  <td>
                    <span className={`terrix-badge ${b.enabled ? 'green' : 'red'}`}>
                      {b.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleOpenEdit(b)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDelete(b.id, b.number)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '48px 0', color: '#94A3B8' }}>
                    No blocked caller IDs. Click "Block Caller ID" to blacklist unwanted callers.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="terrix-modal" style={{ maxWidth: 500 }}>
            <div className="modal-head">
              <div className="modal-icon"><Ban size={20} /></div>
              <div>
                <h3>{editingBlock ? 'Edit Block Rule' : 'Block Caller ID'}</h3>
                <p>Prevent incoming calls from specific numbers</p>
              </div>
              <button onClick={() => setShowModal(false)} className="modal-close"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="form-label">Phone Number / Caller ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +18005550199 or 9876543210"
                    value={formData.number}
                    onChange={e => setFormData({ ...formData, number: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="form-label">Reason / Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Telemarketer spam / robocall"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label className="form-label">Action When Call Received</label>
                  <select
                    value={formData.action}
                    onChange={e => setFormData({ ...formData, action: e.target.value })}
                    className="form-control"
                  >
                    <option value="reject">Decline Immediately (SIP 603)</option>
                    <option value="busy">Play Busy Tone (SIP 486)</option>
                    <option value="voicemail">Send to General Voicemail</option>
                  </select>
                </div>

                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.enabled}
                      onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
                    />
                    <span>Enable this blocking rule</span>
                  </label>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingBlock ? 'Update Rule' : 'Save Rule'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
