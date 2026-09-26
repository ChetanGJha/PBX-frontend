import React, { useState, useEffect } from 'react';
import { Phone, Plus, RefreshCw, KeyRound, Mail, ShieldCheck, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';
import type { Extension, Tenant } from '../types';



interface ExtensionsViewProps {
  token: string | null;
}

export const ExtensionsView: React.FC<ExtensionsViewProps> = ({ token }) => {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedExtId, setSelectedExtId] = useState<string | null>(null);

  // Create Form
  const [tenantId, setTenantId] = useState('');
  const [extNumber, setExtNumber] = useState('1001');
  const [displayName, setDisplayName] = useState('Alice Smith');
  const [email, setEmail] = useState('alice@acme.com');
  const [sipPassword, setSipPassword] = useState('SIPPassword123!');
  const [voicemailPin, setVoicemailPin] = useState('1234');

  // Reset Form
  const [newSipPwd, setNewSipPwd] = useState('');
  const [newVmPin, setNewVmPin] = useState('');

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [exts, tnts] = await Promise.all([
        apiService.getExtensions(token),
        apiService.getTenants(token),
      ]);
      setExtensions(exts);
      setTenants(tnts);
      if (tnts.length > 0 && !tenantId) {
        setTenantId(tnts[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      await apiService.createExtension(token, {
        tenant_id: tenantId || undefined,
        extension_number: extNumber,
        display_name: displayName,
        email,
        sip_password: sipPassword,
        voicemail_pin: voicemailPin,
      });
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedExtId) return;
    setLoading(true);
    try {
      await apiService.resetPassword(token, selectedExtId, {
        new_sip_password: newSipPwd || undefined,
        new_voicemail_pin: newVmPin || undefined,
      });
      setShowResetModal(false);
      setSelectedExtId(null);
      setNewSipPwd('');
      setNewVmPin('');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="glass-panel p-8 text-center text-slate-400">
        <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-amber-400 opacity-80" />
        <h3 className="text-lg font-bold text-white mb-1">Authentication Required</h3>
        <p className="text-sm">Please log in using the "Authentication & Seeding" tab first to access Extension Management APIs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Phone className="w-6 h-6 text-cyan-400" />
            <span>Extension Provisioning</span>
          </h2>
          <p className="text-xs text-slate-400">Manage SIP & WebRTC softphone endpoints (`/api/v1/extensions`)</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn-secondary" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            <span>Create Extension</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Extensions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {extensions.map((ext: Extension) => (

          <div key={ext.id} className="glass-card p-5 border border-slate-800 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl font-mono text-lg font-bold">
                  {ext.extension_number}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{ext.display_name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{ext.email || 'No email registered'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300 bg-slate-900/40 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">WebRTC Enabled:</span>
                <span className={`badge ${ext.webrtc_enabled ? 'badge-success' : 'badge-warning'}`}>
                  {ext.webrtc_enabled ? 'Yes (WSS/TLS)' : 'No'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">No-Answer Timeout:</span>
                <span className="font-mono text-indigo-300">{ext.no_answer_timeout}s</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedExtId(ext.id);
                  setShowResetModal(true);
                }}
                className="btn-secondary text-xs py-1.5 px-2.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                <span>Reset SIP Password</span>
              </button>
            </div>
          </div>
        ))}

        {extensions.length === 0 && !loading && (
          <div className="col-span-full text-center p-12 glass-panel text-slate-400">
            No extensions provisioned yet. Click "Create Extension" above to add your first extension.
          </div>
        )}
      </div>

      {/* Create Extension Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-md w-full border border-cyan-500/40">
            <h3 className="text-lg font-bold text-white mb-4">Provision New SIP Extension</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              {tenants.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tenant Target</label>
                  <select
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    className="input-field"
                  >
                    {tenants.map((t: Tenant) => (

                      <option key={t.id} value={t.id}>
                        {t.name} ({t.sip_domain})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Extension Number</label>
                <input
                  type="text"
                  placeholder="1001"
                  value={extNumber}
                  onChange={(e) => setExtNumber(e.target.value)}
                  className="input-field font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
                <input
                  type="text"
                  placeholder="Alice Smith"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">User Email</label>
                <input
                  type="email"
                  placeholder="alice@acme.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">SIP Password</label>
                <input
                  type="password"
                  placeholder="SIPPassword123!"
                  value={sipPassword}
                  onChange={(e) => setSipPassword(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Voicemail PIN</label>
                <input
                  type="text"
                  placeholder="1234"
                  value={voicemailPin}
                  onChange={(e) => setVoicemailPin(e.target.value)}
                  className="input-field font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Creating...' : 'Provision Extension'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-md w-full border border-indigo-500/40">
            <h3 className="text-lg font-bold text-white mb-4">Reset Extension Credentials</h3>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New SIP Password</label>
                <input
                  type="password"
                  placeholder="Leave empty to keep unchanged"
                  value={newSipPwd}
                  onChange={(e) => setNewSipPwd(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Voicemail PIN</label>
                <input
                  type="text"
                  placeholder="Leave empty to keep unchanged"
                  value={newVmPin}
                  onChange={(e) => setNewVmPin(e.target.value)}
                  className="input-field font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowResetModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Updating...' : 'Save New Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
