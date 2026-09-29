import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Users2, Plus, Edit2, Trash2, Search, X, Lock, Mic, CheckCircle2 } from 'lucide-react';

interface ConferencesViewProps {
  token: string;
  user?: User | null;
}

export const ConferencesView: React.FC<ConferencesViewProps> = ({ token, user }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [conferences, setConferences] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingConf, setEditingConf] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    extension_number: '',
    pin: '',
    moderator_pin: '',
    max_members: 50,
    record_conference: false,
    wait_for_moderator: false,
    announce_join_leave: true,
    enabled: true,
    tenant_id: user?.tenant_id || ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [cData, tData] = await Promise.allSettled([
        apiService.getConferences(token),
        apiService.getTenants(token)
      ]);
      if (cData.status === 'fulfilled') setConferences(cData.value);
      if (tData.status === 'fulfilled') setTenants(tData.value);
    } catch (err) {
      console.error('Failed to load conferences:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleOpenCreate = () => {
    setEditingConf(null);
    setFormData({
      name: '',
      extension_number: '3001',
      pin: '',
      moderator_pin: '',
      max_members: 50,
      record_conference: false,
      wait_for_moderator: false,
      announce_join_leave: true,
      enabled: true,
      tenant_id: user?.tenant_id || (tenants[0]?.id || '')
    });
    setShowModal(true);
  };

  const handleOpenEdit = (c: any) => {
    setEditingConf(c);
    setFormData({
      name: c.name || '',
      extension_number: c.extension_number || '',
      pin: c.pin || '',
      moderator_pin: c.moderator_pin || '',
      max_members: c.max_members || 50,
      record_conference: !!c.record_conference,
      wait_for_moderator: !!c.wait_for_moderator,
      announce_join_leave: !!c.announce_join_leave,
      enabled: c.enabled !== false,
      tenant_id: c.tenant_id || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        max_members: Number(formData.max_members) || 50,
        tenant_id: formData.tenant_id || null,
        pin: formData.pin || null,
        moderator_pin: formData.moderator_pin || null,
      };

      if (editingConf) {
        await apiService.updateConference(token, editingConf.id, payload);
        showSuccessModal('Conference Updated', `Room ${payload.extension_number} updated successfully`);
      } else {
        await apiService.createConference(token, payload);
        showSuccessModal('Conference Created', `Room ${payload.extension_number} created successfully`);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      showErrorModal('Error', err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete conference room "${name}"?`)) return;
    try {
      await apiService.deleteConference(token, id);
      showSuccessModal('Conference Deleted', `Room "${name}" removed successfully`);
      loadData();
    } catch (err: any) {
      showErrorModal('Delete Failed', err.message || 'Could not delete room');
    }
  };

  const filtered = conferences.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.extension_number || '').includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <div className="eyebrow">Conferencing & Collaboration</div>
          <h1 className="page-title">Conference Rooms</h1>
          <p className="page-sub">Host HD multi-party audio conferences with PIN security, recording, and moderation.</p>
        </div>
        <button onClick={handleOpenCreate} className="btn-primary">
          <Plus size={16} /> Create Conference Room
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="card p-5" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users2 style={{ width: 22, height: 22, color: '#6366F1' }} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>{conferences.length}</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>Total Conference Rooms</div>
          </div>
        </div>

        <div className="card p-5" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 style={{ width: 22, height: 22, color: '#10B981' }} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>{conferences.filter(c => c.enabled).length}</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>Active Rooms</div>
          </div>
        </div>

        <div className="card p-5" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mic style={{ width: 22, height: 22, color: '#F59E0B' }} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>{conferences.filter(c => c.record_conference).length}</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>Auto-Recorded Rooms</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card p-4 flex items-center justify-between gap-4">
        <div style={{ position: 'relative', width: 320 }}>
          <Search style={{ width: 14, height: 14, color: '#94A3B8', position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search conference rooms or extension..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-control"
            style={{ paddingLeft: 34 }}
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold">
          Dial <span className="text-slate-900 font-mono">3000-3999</span> from any extension to join a conference
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Room Name</th>
                <th>Extension</th>
                <th>PIN Security</th>
                <th>Max Members</th>
                <th>Recording</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users2 style={{ width: 16, height: 16, color: '#6366F1' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{c.name}</div>
                        {c.tenant_name && <div style={{ fontSize: 11, color: '#94A3B8' }}>{c.tenant_name}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: 'var(--orange, #FF5430)' }}>
                      {c.extension_number}
                    </span>
                  </td>
                  <td>
                    {c.pin ? (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: '#FEF3C7', color: '#B45309', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Lock size={12} /> PIN: {c.pin}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>Open (No PIN)</span>
                    )}
                  </td>
                  <td><span style={{ fontSize: 12, color: '#475569' }}>{c.max_members} max</span></td>
                  <td>
                    {c.record_conference ? (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: '#FEE2E2', color: '#DC2626', fontWeight: 600 }}>Enabled</span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>Disabled</span>
                    )}
                  </td>
                  <td>
                    <span className={`terrix-badge ${c.enabled ? 'green' : 'red'}`}>
                      {c.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleOpenEdit(c)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDelete(c.id, c.name)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 0', color: '#94A3B8' }}>
                    No conference rooms configured. Click "Create Conference Room" to set up your first room.
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
          <div className="terrix-modal" style={{ maxWidth: 540 }}>
            <div className="modal-head">
              <div className="modal-icon"><Users2 size={20} /></div>
              <div>
                <h3>{editingConf ? 'Edit Conference Room' : 'Create Conference Room'}</h3>
                <p>Configure extension number, access PINs, and audio settings</p>
              </div>
              <button onClick={() => setShowModal(false)} className="modal-close"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="form-label">Room Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sales Team Conference"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Extension Number (3000-3999) *</label>
                    <input
                      type="text"
                      required
                      placeholder="3001"
                      value={formData.extension_number}
                      onChange={e => setFormData({ ...formData, extension_number: e.target.value })}
                      className="form-control"
                    />
                  </div>
                  <div>
                    <label className="form-label">Max Members</label>
                    <input
                      type="number"
                      min={2}
                      max={300}
                      value={formData.max_members}
                      onChange={e => setFormData({ ...formData, max_members: Number(e.target.value) })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Participant PIN (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 1234"
                      value={formData.pin}
                      onChange={e => setFormData({ ...formData, pin: e.target.value })}
                      className="form-control"
                    />
                  </div>
                  <div>
                    <label className="form-label">Moderator PIN (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 9876"
                      value={formData.moderator_pin}
                      onChange={e => setFormData({ ...formData, moderator_pin: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16 }} className="space-y-3">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.record_conference}
                      onChange={e => setFormData({ ...formData, record_conference: e.target.checked })}
                    />
                    <span>Automatically record this conference</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.announce_join_leave}
                      onChange={e => setFormData({ ...formData, announce_join_leave: e.target.checked })}
                    />
                    <span>Play chime when participants join or leave</span>
                  </label>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingConf ? 'Update Room' : 'Create Room'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
