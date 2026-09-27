import { useToast } from './ToastProvider';
import React, { useState, useEffect, useMemo } from 'react';
import { PhoneForwarded, RefreshCw, Edit2, Plus, Search } from 'lucide-react';
import { apiService } from '../services/api';
import type { User } from '../types';

interface CallForwardingViewProps {
  token: string | null;
  user?: User | null;
}

interface ForwardingRuleItem {
  extension_id: string;
  extension_number: string;
  display_name: string;
  forward_always_enabled: boolean;
  forward_always_destination?: string;
  forward_busy_enabled: boolean;
  forward_busy_destination?: string;
  forward_no_answer_enabled: boolean;
  forward_no_answer_destination?: string;
  forward_no_answer_timeout: number;
  updated_at?: string;
}

export const CallForwardingView: React.FC<CallForwardingViewProps> = ({ token, user }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [rules, setRules] = useState<ForwardingRuleItem[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedExtId, setSelectedExtId] = useState('');
  const [alwaysEnabled, setAlwaysEnabled] = useState(false);
  const [alwaysDest, setAlwaysDest] = useState('');
  const [busyEnabled, setBusyEnabled] = useState(false);
  const [busyDest, setBusyDest] = useState('');
  const [noAnswerEnabled, setNoAnswerEnabled] = useState(false);
  const [noAnswerDest, setNoAnswerDest] = useState('');
  const [noAnswerTimeout, setNoAnswerTimeout] = useState(20);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [fData, extData] = await Promise.allSettled([
        apiService.getCallForwardingAll(token),
        apiService.getExtensions(token)
      ]);
      if (fData.status === 'fulfilled') setRules(fData.value);
      if (extData.status === 'fulfilled') setExtensions(extData.value);
    } catch (err: any) {
      console.error('Failed to load forwarding data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Tenant-scoped extensions
  const tenantExtensions = useMemo(() => {
    if (user?.role === 'SUPER_ADMIN') return extensions;
    return extensions.filter(e => e.tenant_id === user?.tenant_id || !e.tenant_id);
  }, [extensions, user]);

  const openCreateModal = () => {
    const firstExt = tenantExtensions.length > 0 ? tenantExtensions[0] : null;
    if (!firstExt) {
      showErrorModal('No Extensions Found', 'Please provision an extension before configuring call forwarding.');
      return;
    }
    handleExtensionSelect(firstExt.id || '');
    setShowModal(true);
  };

  const openEditModal = (rule: ForwardingRuleItem) => {
    setSelectedExtId(rule.extension_id);
    setAlwaysEnabled(rule.forward_always_enabled);
    setAlwaysDest(rule.forward_always_destination || '');
    setBusyEnabled(rule.forward_busy_enabled);
    setBusyDest(rule.forward_busy_destination || '');
    setNoAnswerEnabled(rule.forward_no_answer_enabled);
    setNoAnswerDest(rule.forward_no_answer_destination || '');
    setNoAnswerTimeout(rule.forward_no_answer_timeout || 20);
    setShowModal(true);
  };

  const handleExtensionSelect = (extId: string) => {
    setSelectedExtId(extId);
    const existingRule = rules.find(r => r.extension_id === extId);
    if (existingRule) {
      setAlwaysEnabled(existingRule.forward_always_enabled);
      setAlwaysDest(existingRule.forward_always_destination || '');
      setBusyEnabled(existingRule.forward_busy_enabled);
      setBusyDest(existingRule.forward_busy_destination || '');
      setNoAnswerEnabled(existingRule.forward_no_answer_enabled);
      setNoAnswerDest(existingRule.forward_no_answer_destination || '');
      setNoAnswerTimeout(existingRule.forward_no_answer_timeout || 20);
    } else {
      setAlwaysEnabled(false);
      setAlwaysDest('');
      setBusyEnabled(false);
      setBusyDest('');
      setNoAnswerEnabled(false);
      setNoAnswerDest('');
      setNoAnswerTimeout(20);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedExtId) {
      showErrorModal('Extension Required', 'Please select an extension to configure forwarding.');
      return;
    }

    setSaving(true);
    try {
      const ext = tenantExtensions.find(e => e.id === selectedExtId);

      await apiService.updateExtensionForwarding(token, selectedExtId, {
        forward_always_enabled: alwaysEnabled,
        forward_always_destination: alwaysDest || null,
        forward_busy_enabled: busyEnabled,
        forward_busy_destination: busyDest || null,
        forward_no_answer_enabled: noAnswerEnabled,
        forward_no_answer_destination: noAnswerDest || null,
        forward_no_answer_timeout: Number(noAnswerTimeout) || 20,
      });

      showSuccessModal(
        'Forwarding Settings Saved',
        `Call forwarding policies for ext/${ext?.extension_number || 'selected'} have been updated.`
      );
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      showErrorModal('Update Failed', err.message || 'Failed to update forwarding settings');
    } finally {
      setSaving(false);
    }
  };

  const filtered = rules.filter(r =>
    r.extension_number.includes(search) ||
    (r.display_name && r.display_name.toLowerCase().includes(search.toLowerCase())) ||
    (r.forward_always_destination && r.forward_always_destination.includes(search))
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Call Routing Rules</div>
          <h1 className="page-title">Call Forwarding & Follow-Me</h1>
          <p className="page-sub">Configure unconditional forward, busy forward, and no-answer reroute policies</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchData} className="btn-secondary" title="Refresh">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={openCreateModal} className="btn-primary">
            <Plus size={16} /> Configure Forwarding Rule
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
              placeholder="Search extensions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#6B7280' }}>
            Total <strong>{filtered.length}</strong> extension{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Extension</th>
                <th>Forward Always</th>
                <th>Forward on Busy</th>
                <th>No-Answer Forward</th>
                <th>Timeout</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-4">Loading forwarding rules...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-4 text-muted">No forwarding rules configured yet</td></tr>
              ) : (
                filtered.map(r => (
                  <tr key={r.extension_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#FFF0EC', color: '#FF5430', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <PhoneForwarded size={14} />
                        </div>
                        <div>
                          <strong style={{ color: '#111827', fontSize: '13px' }}>ext/{r.extension_number}</strong>
                          {r.display_name && <div style={{ fontSize: '11px', color: '#6B7280' }}>{r.display_name}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      {r.forward_always_enabled && r.forward_always_destination ? (
                        <span className="terrix-badge green" style={{ fontFamily: 'monospace' }}>
                          → {r.forward_always_destination}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Off</span>
                      )}
                    </td>
                    <td>
                      {r.forward_busy_enabled && r.forward_busy_destination ? (
                        <span className="terrix-badge orange" style={{ fontFamily: 'monospace' }}>
                          → {r.forward_busy_destination}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Off</span>
                      )}
                    </td>
                    <td>
                      {r.forward_no_answer_enabled && r.forward_no_answer_destination ? (
                        <span className="terrix-badge grey" style={{ fontFamily: 'monospace' }}>
                          → {r.forward_no_answer_destination}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Off</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#4B5563' }}>
                        {r.forward_no_answer_timeout || 20}s
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '5px 10px', fontSize: '11px' }}
                        onClick={() => openEditModal(r)}
                      >
                        <Edit2 size={13} style={{ marginRight: '4px' }} /> Configure
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="terrix-modal" style={{ maxWidth: '580px' }}>
            <div className="modal-head">
              <div className="modal-icon"><PhoneForwarded size={20} /></div>
              <div>
                <h3>Configure Call Forwarding</h3>
                <p>Set up unconditional, busy, and no-answer forwarding rules</p>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label required">Select Extension</label>
                    <select
                      className="form-control"
                      value={selectedExtId}
                      onChange={e => handleExtensionSelect(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Extension --</option>
                      {tenantExtensions.map(e => (
                        <option key={e.id} value={e.id}>
                          ext/{e.extension_number} — {e.display_name || 'Extension'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 1. Forward Always */}
                  <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: alwaysEnabled ? '10px' : '0' }}>
                      <div>
                        <strong style={{ fontSize: '13px', color: '#111827' }}>Forward Always (Unconditional)</strong>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>Instantly reroutes all calls without ringing deskphone</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={alwaysEnabled}
                        onChange={e => setAlwaysEnabled(e.target.checked)}
                        style={{ accentColor: '#FF5430', width: '16px', height: '16px' }}
                      />
                    </label>
                    {alwaysEnabled && (
                      <div className="form-group" style={{ marginTop: '8px', marginBottom: 0 }}>
                        <label className="form-label required">Forward Destination Number / Extension</label>
                        <input
                          required={alwaysEnabled}
                          className="form-control"
                          value={alwaysDest}
                          onChange={e => setAlwaysDest(e.target.value)}
                          placeholder="e.g. 1002 or +15551234567"
                        />
                      </div>
                    )}
                  </div>

                  {/* 2. Forward on Busy */}
                  <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: busyEnabled ? '10px' : '0' }}>
                      <div>
                        <strong style={{ fontSize: '13px', color: '#111827' }}>Forward on Busy (DND / In-Call)</strong>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>Reroute calls when agent line is engaged or DND active</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={busyEnabled}
                        onChange={e => setBusyEnabled(e.target.checked)}
                        style={{ accentColor: '#FF5430', width: '16px', height: '16px' }}
                      />
                    </label>
                    {busyEnabled && (
                      <div className="form-group" style={{ marginTop: '8px', marginBottom: 0 }}>
                        <label className="form-label required">Busy Destination Number / Extension</label>
                        <input
                          required={busyEnabled}
                          className="form-control"
                          value={busyDest}
                          onChange={e => setBusyDest(e.target.value)}
                          placeholder="e.g. 1003 or mobile number"
                        />
                      </div>
                    )}
                  </div>

                  {/* 3. Forward on No Answer */}
                  <div style={{ padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: noAnswerEnabled ? '10px' : '0' }}>
                      <div>
                        <strong style={{ fontSize: '13px', color: '#111827' }}>Forward on No Answer (Timeout)</strong>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>Reroute after ringing deskphone without answer</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={noAnswerEnabled}
                        onChange={e => setNoAnswerEnabled(e.target.checked)}
                        style={{ accentColor: '#FF5430', width: '16px', height: '16px' }}
                      />
                    </label>
                    {noAnswerEnabled && (
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginTop: '8px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label required">No Answer Destination</label>
                          <input
                            required={noAnswerEnabled}
                            className="form-control"
                            value={noAnswerDest}
                            onChange={e => setNoAnswerDest(e.target.value)}
                            placeholder="e.g. 7001 or mobile number"
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Ring Timeout (sec)</label>
                          <input
                            type="number"
                            min={5}
                            max={120}
                            className="form-control"
                            value={noAnswerTimeout}
                            onChange={e => setNoAnswerTimeout(parseInt(e.target.value) || 20)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Forwarding Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
