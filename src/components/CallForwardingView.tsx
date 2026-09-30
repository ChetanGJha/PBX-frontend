import { useToast } from './ToastProvider';
import React, { useState, useEffect, useMemo } from 'react';
import { PhoneForwarded, RefreshCw, Edit2, Plus, Search, Trash2, AlertTriangle, ArrowRight } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
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
  tenant_name?: string;
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

  // Delete Confirmation State
  const [deleteConfirmRule, setDeleteConfirmRule] = useState<ForwardingRuleItem | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    setAlwaysEnabled(Boolean(rule.forward_always_enabled));
    setAlwaysDest(rule.forward_always_destination || '');
    setBusyEnabled(Boolean(rule.forward_busy_enabled));
    setBusyDest(rule.forward_busy_destination || '');
    setNoAnswerEnabled(Boolean(rule.forward_no_answer_enabled));
    setNoAnswerDest(rule.forward_no_answer_destination || '');
    setNoAnswerTimeout(rule.forward_no_answer_timeout || 20);
    setShowModal(true);
  };

  const handleExtensionSelect = (extId: string) => {
    setSelectedExtId(extId);
    const existingRule = rules.find(r => r.extension_id === extId);
    if (existingRule) {
      setAlwaysEnabled(Boolean(existingRule.forward_always_enabled));
      setAlwaysDest(existingRule.forward_always_destination || '');
      setBusyEnabled(Boolean(existingRule.forward_busy_enabled));
      setBusyDest(existingRule.forward_busy_destination || '');
      setNoAnswerEnabled(Boolean(existingRule.forward_no_answer_enabled));
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
        forward_always_destination: alwaysEnabled ? (alwaysDest.trim() || null) : null,
        forward_busy_enabled: busyEnabled,
        forward_busy_destination: busyEnabled ? (busyDest.trim() || null) : null,
        forward_no_answer_enabled: noAnswerEnabled,
        forward_no_answer_destination: noAnswerEnabled ? (noAnswerDest.trim() || null) : null,
        forward_no_answer_timeout: Number(noAnswerTimeout) || 20,
      });

      showSuccessModal(
        'Forwarding Settings Saved',
        `Call forwarding policies for ext/${ext?.extension_number || 'selected'} have been updated successfully.`
      );
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      showErrorModal('Update Failed', err.message || 'Failed to update forwarding settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !deleteConfirmRule) return;
    setDeleting(true);
    try {
      await apiService.deleteExtensionForwarding(token, deleteConfirmRule.extension_id);
      showSuccessModal(
        'Forwarding Cleared',
        `All call forwarding rules for ext/${deleteConfirmRule.extension_number} have been removed.`
      );
      setDeleteConfirmRule(null);
      if (showModal && selectedExtId === deleteConfirmRule.extension_id) {
        setShowModal(false);
      }
      fetchData();
    } catch (err: any) {
      showErrorModal('Delete Failed', err.message || 'Failed to remove call forwarding rules');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = rules.filter(r =>
    r.extension_number.includes(search) ||
    (r.display_name && r.display_name.toLowerCase().includes(search.toLowerCase())) ||
    (r.forward_always_destination && r.forward_always_destination.includes(search))
  );

  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'TENANT_ADMIN';

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
          {canManage && (
            <button onClick={openCreateModal} className="btn-primary">
              <Plus size={16} /> Configure Forwarding Rule
            </button>
          )}
        </div>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="search-input-wrap" style={{ width: '280px' }}>
            <Search size={16} className="search-icon" />
            <input
              className="form-control"
              style={{ height: '38px', fontSize: '12px' }}
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
                {canManage && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={canManage ? 6 : 5} className="text-center py-4">Loading forwarding rules...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={canManage ? 6 : 5} className="text-center py-4 text-muted">No forwarding rules configured yet</td></tr>
              ) : (
                filtered.map(r => {
                  const hasActiveRule = Boolean(
                    (r.forward_always_enabled && r.forward_always_destination) ||
                    (r.forward_busy_enabled && r.forward_busy_destination) ||
                    (r.forward_no_answer_enabled && r.forward_no_answer_destination)
                  );

                  return (
                    <tr key={r.extension_id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: hasActiveRule ? '#FFF0EC' : '#F3F4F6', color: hasActiveRule ? '#FF5430' : '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                          <span className="terrix-badge green" style={{ fontFamily: 'monospace', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <ArrowRight size={12} /> {r.forward_always_destination}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Off</span>
                        )}
                      </td>
                      <td>
                        {r.forward_busy_enabled && r.forward_busy_destination ? (
                          <span className="terrix-badge orange" style={{ fontFamily: 'monospace', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <ArrowRight size={12} /> {r.forward_busy_destination}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Off</span>
                        )}
                      </td>
                      <td>
                        {r.forward_no_answer_enabled && r.forward_no_answer_destination ? (
                          <span className="terrix-badge grey" style={{ fontFamily: 'monospace', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <ArrowRight size={12} /> {r.forward_no_answer_destination}
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
                      {canManage && (
                        <td className="text-right">
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '5px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center' }}
                              onClick={() => openEditModal(r)}
                              title="Configure Forwarding"
                            >
                              <Edit2 size={13} style={{ marginRight: '4px' }} /> Configure
                            </button>
                            {hasActiveRule && (
                              <button
                                type="button"
                                style={{
                                  padding: '5px 8px',
                                  fontSize: '11px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  background: '#FEF2F2',
                                  color: '#DC2626',
                                  border: '1px solid #FECACA',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                onClick={() => setDeleteConfirmRule(r)}
                                title="Delete / Clear Forwarding Rules"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
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
                    <CustomSelect
                      options={[
                        { value: '', label: '-- Choose Extension --' },
                        ...tenantExtensions.map(e => ({
                          value: e.id,
                          label: `ext/${e.extension_number} — ${e.display_name || 'Extension'}`
                        }))
                      ]}
                      value={selectedExtId}
                      onChange={(val) => handleExtensionSelect(val)}
                    />
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
              <div className="modal-foot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {(alwaysEnabled || busyEnabled || noAnswerEnabled) && (
                    <button
                      type="button"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        background: '#FEF2F2',
                        color: '#DC2626',
                        border: '1px solid #FECACA',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        const existingRule = rules.find(r => r.extension_id === selectedExtId);
                        if (existingRule) {
                          setDeleteConfirmRule(existingRule);
                        } else {
                          setAlwaysEnabled(false);
                          setAlwaysDest('');
                          setBusyEnabled(false);
                          setBusyDest('');
                          setNoAnswerEnabled(false);
                          setNoAnswerDest('');
                        }
                      }}
                      disabled={saving}
                    >
                      <Trash2 size={13} style={{ marginRight: '6px' }} /> Clear All Rules
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Forwarding Settings'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmRule && (
        <div className="modal-backdrop">
          <div className="terrix-modal" style={{ maxWidth: '440px' }}>
            <div className="modal-head">
              <div className="modal-icon" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3>Clear Call Forwarding</h3>
                <p>ext/{deleteConfirmRule.extension_number} — {deleteConfirmRule.display_name || 'Extension'}</p>
              </div>
              <button className="modal-close" onClick={() => setDeleteConfirmRule(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: '1.5', margin: 0 }}>
                Are you sure you want to remove and disable all call forwarding rules for extension <strong>ext/{deleteConfirmRule.extension_number}</strong>?
                Incoming calls will directly ring this extension's registered device.
              </p>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn-secondary" onClick={() => setDeleteConfirmRule(null)} disabled={deleting}>
                Cancel
              </button>
              <button
                type="button"
                style={{
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Removing...' : 'Yes, Delete Rules'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
