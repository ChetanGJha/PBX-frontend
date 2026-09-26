import { useToast } from './ToastProvider';
import React, { useState, useEffect } from 'react';
import { PhoneForwarded, Clock, RefreshCw, Edit2, AlertCircle, X, Smartphone, ArrowRight, Plus } from 'lucide-react';
import { apiService } from '../services/api';
import type { User } from '../types';

interface CallForwardingViewProps {
  token: string | null;
  user: User | null;
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

export const CallForwardingView: React.FC<CallForwardingViewProps> = ({ token }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [rules, setRules] = useState<ForwardingRuleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  // Edit Modal State
  const [editingRule, setEditingRule] = useState<ForwardingRuleItem | null>(null);
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
    setError(null);
    try {
      const data = await apiService.getCallForwardingAll(token);
      setRules(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load call forwarding rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const openCreateModal = () => {
    const firstRule = rules.length > 0 ? rules[0] : null;
    if (firstRule) {
      openEditModal(firstRule);
    } else {
      showErrorModal('No Extensions Found', 'Please provision a SIP extension first before configuring forwarding.');
    }
  };

  const openEditModal = (rule: ForwardingRuleItem) => {
    setEditingRule(rule);
    setAlwaysEnabled(rule.forward_always_enabled);
    setAlwaysDest(rule.forward_always_destination || '');
    setBusyEnabled(rule.forward_busy_enabled);
    setBusyDest(rule.forward_busy_destination || '');
    setNoAnswerEnabled(rule.forward_no_answer_enabled);
    setNoAnswerDest(rule.forward_no_answer_destination || '');
    setNoAnswerTimeout(rule.forward_no_answer_timeout || 20);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingRule) return;
    setSaving(true);
    setError(null);
    try {
      await apiService.updateExtensionForwarding(token, editingRule.extension_id, {
        forward_always_enabled: alwaysEnabled,
        forward_always_destination: alwaysDest || null,
        forward_busy_enabled: busyEnabled,
        forward_busy_destination: busyDest || null,
        forward_no_answer_enabled: noAnswerEnabled,
        forward_no_answer_destination: noAnswerDest || null,
        forward_no_answer_timeout: Number(noAnswerTimeout) || 20,
      });

      showSuccessModal('Forwarding Settings Updated', `Call forwarding rules for ext/${editingRule.extension_number} have been updated.`);
      setEditingRule(null);
      fetchData();
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err.message || JSON.stringify(err);
      setError(msg);
      showErrorModal('Update Failed', msg);
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <div className="eyebrow">Call Routing Rules</div>
          <h1 className="page-title">Call Forwarding & Follow-Me</h1>
          <p className="page-sub">
            Configure unconditional forwarding (always), busy forward, no-answer timeout routing, and follow-me find-me mobile ring lists.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn-secondary" title="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button onClick={openCreateModal} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} />
            <span>Configure Forwarding Rule</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <PhoneForwarded className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              {rules.filter(r => r.forward_always_enabled).length}
            </div>
            <div className="text-xs text-slate-500 font-medium">Forward Always Active</div>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              {rules.filter(r => r.forward_no_answer_enabled).length}
            </div>
            <div className="text-xs text-slate-500 font-medium">No-Answer Forward Active</div>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              {rules.filter(r => r.forward_busy_enabled).length}
            </div>
            <div className="text-xs text-slate-500 font-medium">Busy Forward Active</div>
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="card overflow-hidden">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Extension</th>
                <th>Display Name</th>
                <th>Forward Always</th>
                <th>Forward on Busy</th>
                <th>Forward on No-Answer</th>
                <th>No-Answer Delay</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.extension_id}>
                  <td className="font-bold text-slate-900">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 font-mono text-xs text-slate-800">
                      ext/{rule.extension_number}
                    </span>
                  </td>
                  <td className="font-medium text-slate-800">{rule.display_name}</td>
                  <td>
                    {rule.forward_always_enabled ? (
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <ArrowRight className="w-3 h-3" />
                        {rule.forward_always_destination || 'Active'}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Disabled</span>
                    )}
                  </td>
                  <td>
                    {rule.forward_busy_enabled ? (
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <ArrowRight className="w-3 h-3" />
                        {rule.forward_busy_destination || 'Active'}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Disabled</span>
                    )}
                  </td>
                  <td>
                    {rule.forward_no_answer_enabled ? (
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        <ArrowRight className="w-3 h-3" />
                        {rule.forward_no_answer_destination || 'Active'}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Disabled</span>
                    )}
                  </td>
                  <td className="font-mono text-xs text-slate-600">
                    {rule.forward_no_answer_enabled ? `${rule.forward_no_answer_timeout}s` : '—'}
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => openEditModal(rule)}
                      className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1 inline-flex"
                      title="Edit Forwarding & Follow-Me"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Rules</span>
                    </button>
                  </td>
                </tr>
              ))}
              {rules.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                    No extensions found for this tenant. Create extensions first to configure call forwarding.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingRule && (
        <div className="modal-backdrop">
          <div className="terrix-modal max-w-lg">
            <div className="modal-head">
              <div className="modal-icon">
                <PhoneForwarded className="w-5 h-5" />
              </div>
              <div>
                <h3>Call Forwarding: ext/{editingRule.extension_number}</h3>
                <p>{editingRule.display_name} — Inbound call reroute policies</p>
              </div>
              <button onClick={() => setEditingRule(null)} className="modal-close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body space-y-4">
                {/* 1. Forward Always */}
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-slate-900">Forward Always (Unconditional)</div>
                      <div className="text-[11px] text-slate-500">Instantly reroute all inbound calls without ringing deskphone</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={alwaysEnabled}
                      onChange={(e) => setAlwaysEnabled(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                    />
                  </div>
                  {alwaysEnabled && (
                    <div>
                      <label className="form-label text-[11px]">Forward Destination (Extension or PSTN Phone Number)</label>
                      <input
                        type="text"
                        placeholder="e.g. 1002 or +15551234567"
                        value={alwaysDest}
                        onChange={(e) => setAlwaysDest(e.target.value)}
                        className="form-control font-mono text-xs"
                        required={alwaysEnabled}
                      />
                    </div>
                  )}
                </div>

                {/* 2. Forward on Busy */}
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-slate-900">Forward on Busy (Call Waiting / DND)</div>
                      <div className="text-[11px] text-slate-500">Reroute call when extension is on another call</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={busyEnabled}
                      onChange={(e) => setBusyEnabled(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                  </div>
                  {busyEnabled && (
                    <div>
                      <label className="form-label text-[11px]">Busy Destination Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 1003 or colleague extension"
                        value={busyDest}
                        onChange={(e) => setBusyDest(e.target.value)}
                        className="form-control font-mono text-xs"
                        required={busyEnabled}
                      />
                    </div>
                  )}
                </div>

                {/* 3. Forward on No Answer / Follow-Me */}
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-slate-900">Forward on No-Answer / Follow-Me</div>
                      <div className="text-[11px] text-slate-500">Ring mobile phone or backup line after timeout</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={noAnswerEnabled}
                      onChange={(e) => setNoAnswerEnabled(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                  </div>
                  {noAnswerEnabled && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="form-label text-[11px]">Follow-Me Destination</label>
                        <input
                          type="text"
                          placeholder="e.g. mobile number"
                          value={noAnswerDest}
                          onChange={(e) => setNoAnswerDest(e.target.value)}
                          className="form-control font-mono text-xs"
                          required={noAnswerEnabled}
                        />
                      </div>
                      <div>
                        <label className="form-label text-[11px]">Ring Timeout (Seconds)</label>
                        <input
                          type="number"
                          min={5}
                          max={60}
                          value={noAnswerTimeout}
                          onChange={(e) => setNoAnswerTimeout(Number(e.target.value))}
                          className="form-control font-mono text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-foot">
                <button type="button" onClick={() => setEditingRule(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : 'Save Forwarding Rules'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
