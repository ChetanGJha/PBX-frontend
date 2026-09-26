import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { Extension } from '../types';
import { Phone, Plus, KeyRound, Settings, Search } from 'lucide-react';

interface ExtensionsViewProps {
  token: string;
}

export const ExtensionsView: React.FC<ExtensionsViewProps> = ({ token }) => {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Requirement 1: Password Reset Modal State
  const [resetTarget, setResetTarget] = useState<any>(null);
  const [resetForm, setResetForm] = useState({ new_sip_password: '', new_voicemail_pin: '' });

  // Requirement 7, 11, 12: Extension Settings Modal State (Voicemail-to-Email, Call Forwarding, Follow Me)
  const [settingsTarget, setSettingsTarget] = useState<any>(null);
  const [settingsForm, setSettingsForm] = useState({
    voicemail_email: '',
    voicemail_to_email: false,
    follow_me_enabled: false,
    follow_me_destination: '',
    follow_me_timeout: 20,
    call_forward_enabled: false,
    call_forward_type: 'always',
    call_forward_destination: ''
  });

  const [createForm, setCreateForm] = useState({
    extension_number: '',
    display_name: '',
    email: '',
    sip_password: 'Password123!',
    voicemail_pin: '1234',
    tenant_id: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [extData, tenData] = await Promise.all([
        apiService.getExtensions(token),
        apiService.getTenants(token)
      ]);
      setExtensions(extData);
      setTenants(tenData);
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
      await apiService.createExtension(token, createForm);
      setShowCreateModal(false);
      setCreateForm({ extension_number: '', display_name: '', email: '', sip_password: 'Password123!', voicemail_pin: '1234', tenant_id: '' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create extension');
    }
  };

  // Requirement 1: Handle Reset Password
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    try {
      await apiService.resetExtensionPassword(token, resetTarget.id, resetForm);
      alert('Extension credentials reset successfully!');
      setResetTarget(null);
      setResetForm({ new_sip_password: '', new_voicemail_pin: '' });
    } catch (err: any) {
      alert(err.message || 'Failed to reset credentials');
    }
  };

  // Requirement 7, 11, 12: Handle Extension Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsTarget) return;
    try {
      await apiService.updateExtensionSettings(token, settingsTarget.id, settingsForm);
      alert('Extension settings updated successfully!');
      setSettingsTarget(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    }
  };

  const openSettings = (ext: any) => {
    setSettingsTarget(ext);
    setSettingsForm({
      voicemail_email: ext.voicemail_email || ext.email || '',
      voicemail_to_email: ext.voicemail_to_email || false,
      follow_me_enabled: ext.follow_me_enabled || false,
      follow_me_destination: ext.follow_me_destination || '',
      follow_me_timeout: ext.follow_me_timeout || 20,
      call_forward_enabled: ext.call_forward_enabled || false,
      call_forward_type: ext.call_forward_type || 'always',
      call_forward_destination: ext.call_forward_destination || ''
    });
  };

  const filtered = extensions.filter(e =>
    e.extension_number.includes(search) ||
    e.display_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">SIP Endpoints</div>
          <h1 className="page-title">Extensions Directory</h1>
          <p className="page-sub">SIP endpoints, voicemail-to-email, call forwarding & follow-me routing</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}><Plus size={16} /> Add Extension</button>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
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
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ext #</th>
                <th>Display Name</th>
                <th>Tenant Domain</th>
                <th>Voicemail Email</th>
                <th>Call Forwarding</th>
                <th>Follow Me</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-4">Loading extensions...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-4 text-muted">No extensions found</td></tr>
              ) : (
                filtered.map(e => (
                  <tr key={e.id}>
                    <td><code className="code-box" style={{ padding: '4px 8px', fontSize: '12px', fontWeight: 700 }}>{e.extension_number}</code></td>
                    <td><div style={{ fontWeight: 700, color: '#111827' }}>{e.display_name}</div></td>
                    <td><span className="terrix-badge orange">{(e as any).tenant_domain || 'Global'}</span></td>
                    <td>
                      {(e as any).voicemail_to_email ? (
                        <span className="terrix-badge green">{(e as any).voicemail_email || e.email}</span>
                      ) : (
                        <span className="terrix-badge grey">Disabled</span>
                      )}
                    </td>
                    <td>
                      {(e as any).call_forward_enabled ? (
                        <span className="terrix-badge green">{(e as any).call_forward_type}: {(e as any).call_forward_destination}</span>
                      ) : (
                        <span className="terrix-badge grey">Off</span>
                      )}
                    </td>
                    <td>
                      {(e as any).follow_me_enabled ? (
                        <span className="terrix-badge green">Active ({(e as any).follow_me_destination})</span>
                      ) : (
                        <span className="terrix-badge grey">Off</span>
                      )}
                    </td>
                    <td className="text-right">
                      {/* Requirement 1: Reset Password Button */}
                      <button className="btn-secondary text-amber-600" style={{ padding: '4px 8px', fontSize: '11px', marginRight: '6px' }} onClick={() => setResetTarget(e)}>
                        <KeyRound size={13} style={{ marginRight: '4px' }} /> Reset Password
                      </button>

                      {/* Requirement 7, 11, 12: Config Button */}
                      <button className="btn-primary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => openSettings(e)}>
                        <Settings size={13} style={{ marginRight: '4px' }} /> Features
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE EXTENSION MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="terrix-modal">
            <div className="modal-head">
              <div className="modal-icon"><Phone size={20} /></div>
              <div>
                <h3>Create New Extension</h3>
                <p>Provision a SIP extension for IP phones & softphones</p>
              </div>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group mb-3">
                  <label className="form-label">Target Tenant</label>
                  <select required className="form-control" value={createForm.tenant_id} onChange={e => setCreateForm({...createForm, tenant_id: e.target.value})}>
                    <option value="">-- Select Tenant --</option>
                    {tenants.map(t => <option key={t.id} value={t.id}>{t.name} ({t.domain})</option>)}
                  </select>
                </div>
                <div className="form-group mb-3">
                  <label className="form-label">Extension Number</label>
                  <input required className="form-control" value={createForm.extension_number} onChange={e => setCreateForm({...createForm, extension_number: e.target.value})} placeholder="e.g. 1001" />
                </div>
                <div className="form-group mb-3">
                  <label className="form-label">Display Name</label>
                  <input required className="form-control" value={createForm.display_name} onChange={e => setCreateForm({...createForm, display_name: e.target.value})} placeholder="e.g. John Doe" />
                </div>
                <div className="form-group mb-3">
                  <label className="form-label">SIP Secret Password</label>
                  <input required type="password" className="form-control" value={createForm.sip_password} onChange={e => setCreateForm({...createForm, sip_password: e.target.value})} />
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Extension</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUIREMENT 1: RESET PASSWORD MODAL */}
      {resetTarget && (
        <div className="modal-backdrop">
          <div className="terrix-modal" style={{ maxWidth: '440px' }}>
            <div className="modal-head">
              <div className="modal-icon"><KeyRound size={20} /></div>
              <div>
                <h3>Reset Credentials</h3>
                <p>Update SIP Password / PIN for extension <strong>{resetTarget.extension_number}</strong></p>
              </div>
              <button className="modal-close" onClick={() => setResetTarget(null)}>×</button>
            </div>
            <form onSubmit={handleResetPasswordSubmit}>
              <div className="modal-body">
                <div className="form-group mb-3">
                  <label className="form-label">New SIP Password</label>
                  <input className="form-control" type="password" value={resetForm.new_sip_password} onChange={e => setResetForm({...resetForm, new_sip_password: e.target.value})} placeholder="Min 6 characters" />
                </div>
                <div className="form-group mb-3">
                  <label className="form-label">New Voicemail PIN</label>
                  <input className="form-control" value={resetForm.new_voicemail_pin} onChange={e => setResetForm({...resetForm, new_voicemail_pin: e.target.value})} placeholder="e.g. 1234" />
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setResetTarget(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUIREMENT 7, 11, 12: EXTENSION FEATURES SETTINGS MODAL */}
      {settingsTarget && (
        <div className="modal-backdrop">
          <div className="terrix-modal">
            <div className="modal-head">
              <div className="modal-icon"><Settings size={20} /></div>
              <div>
                <h3>Extension Features & Routing</h3>
                <p>Configure Voicemail-to-Email, Call Forwarding & Follow Me for Ext <strong>{settingsTarget.extension_number}</strong></p>
              </div>
              <button className="modal-close" onClick={() => setSettingsTarget(null)}>×</button>
            </div>
            <form onSubmit={handleSaveSettings}>
              <div className="modal-body">
                {/* REQUIREMENT 7: VOICEMAIL-TO-EMAIL */}
                <div className="p-3.5 mb-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-extrabold text-xs text-slate-800 mb-2 flex items-center gap-2">
                    <span>Voicemail-to-Email Routing</span>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <input type="checkbox" id="vmToEmail" checked={settingsForm.voicemail_to_email} onChange={e => setSettingsForm({...settingsForm, voicemail_to_email: e.target.checked})} />
                    <label htmlFor="vmToEmail" className="text-xs font-bold text-slate-700 cursor-pointer">Route Voicemail Audio Recordings to Email</label>
                  </div>
                  {settingsForm.voicemail_to_email && (
                    <input className="form-control" type="email" value={settingsForm.voicemail_email} onChange={e => setSettingsForm({...settingsForm, voicemail_email: e.target.value})} placeholder="Destination email address" />
                  )}
                </div>

                {/* REQUIREMENT 11: CALL FORWARDING */}
                <div className="p-3.5 mb-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-extrabold text-xs text-slate-800 mb-2">Call Forwarding Options</div>
                  <div className="flex items-center gap-3 mb-2">
                    <input type="checkbox" id="cfEnabled" checked={settingsForm.call_forward_enabled} onChange={e => setSettingsForm({...settingsForm, call_forward_enabled: e.target.checked})} />
                    <label htmlFor="cfEnabled" className="text-xs font-bold text-slate-700 cursor-pointer">Enable Call Forwarding</label>
                  </div>
                  {settingsForm.call_forward_enabled && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="form-label">Condition</label>
                        <select className="form-control" value={settingsForm.call_forward_type} onChange={e => setSettingsForm({...settingsForm, call_forward_type: e.target.value})}>
                          <option value="always">Always Forward</option>
                          <option value="busy">Forward When Busy</option>
                          <option value="no_answer">Forward When No Answer</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Forward Destination Phone #</label>
                        <input className="form-control" value={settingsForm.call_forward_destination} onChange={e => setSettingsForm({...settingsForm, call_forward_destination: e.target.value})} placeholder="e.g. +14155550123" />
                      </div>
                    </div>
                  )}
                </div>

                {/* REQUIREMENT 12: FOLLOW ME */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-extrabold text-xs text-slate-800 mb-2">Follow Me Backup Routing</div>
                  <div className="flex items-center gap-3 mb-2">
                    <input type="checkbox" id="fmEnabled" checked={settingsForm.follow_me_enabled} onChange={e => setSettingsForm({...settingsForm, follow_me_enabled: e.target.checked})} />
                    <label htmlFor="fmEnabled" className="text-xs font-bold text-slate-700 cursor-pointer">Enable Follow Me Backup Ring</label>
                  </div>
                  {settingsForm.follow_me_enabled && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="form-label">Backup Ring Number</label>
                        <input className="form-control" value={settingsForm.follow_me_destination} onChange={e => setSettingsForm({...settingsForm, follow_me_destination: e.target.value})} placeholder="e.g. +14155550999" />
                      </div>
                      <div>
                        <label className="form-label">Primary Timeout (seconds)</label>
                        <input type="number" className="form-control" value={settingsForm.follow_me_timeout} onChange={e => setSettingsForm({...settingsForm, follow_me_timeout: parseInt(e.target.value) || 20})} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setSettingsTarget(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Extension Features</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
