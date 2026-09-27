import { useToast } from './ToastProvider';
import React, { useState, useEffect } from 'react';
import { Phone, Plus, RefreshCw, KeyRound, Search, X, AlertCircle } from 'lucide-react';

import { apiService } from '../services/api';
import type { Extension, Tenant } from '../types';
import { CustomSelect } from './CustomSelect';

interface ExtensionsViewProps {
  token: string | null;
  user?: any; // Current logged-in user for tenant scoping
}

export const ExtensionsView: React.FC<ExtensionsViewProps> = ({ token, user }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenantFilter, setSelectedTenantFilter] = useState('');

  // Modals
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
        user?.role === 'SUPER_ADMIN' ? apiService.getTenants(token) : Promise.resolve([]),
      ]);
      setExtensions(exts);
      setTenants(tnts);
      // Auto-select tenant for tenant admin
      if (user?.role !== 'SUPER_ADMIN' && user?.tenant_id) {
        setTenantId(user.tenant_id);
      } else if (tnts.length > 0 && !tenantId) {
        setTenantId(tnts[0].id);
      }
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err.message || JSON.stringify(err);
      setError(msg);
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
      const cleanEmail = email && email.trim() ? email.trim() : undefined;
      await apiService.createExtension(token, {
        tenant_id: tenantId || (user?.tenant_id ?? undefined),
        extension_number: extNumber,
        display_name: displayName,
        email: cleanEmail,
        sip_password: sipPassword,
        voicemail_pin: voicemailPin,
      });
      setShowModal(false);
      showSuccessModal(
        'Extension Provisioned Successfully',
        `Extension ext/${extNumber} (${displayName}) has been created and registered for SIP and WebRTC softphones.`
      );
      fetchData();
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err.message || JSON.stringify(err);
      setError(msg);
      showErrorModal('Failed to Provision Extension', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedExtId) return;
    setLoading(true);
    try {
      await apiService.resetExtensionPassword(token, selectedExtId, {
        new_sip_password: newSipPwd || undefined,
        new_voicemail_pin: newVmPin || undefined,
      });
      setShowResetModal(false);
      setSelectedExtId(null);
      setNewSipPwd('');
      setNewVmPin('');
      showSuccessModal('Credentials Reset', 'SIP authentication password and voicemail PIN have been updated successfully.');
      fetchData();
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err.message || JSON.stringify(err);
      setError(msg);
      showErrorModal('Password Reset Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const filteredExts = extensions.filter((ext: Extension) => {
    const matchesSearch =
      ext.extension_number.includes(searchTerm) ||
      ext.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ext.email && ext.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTenant = selectedTenantFilter ? ext.tenant_id === selectedTenantFilter : true;
    return matchesSearch && matchesTenant;
  });

  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'TENANT_ADMIN';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <div className="eyebrow">Endpoint Provisioning</div>
          <h1 className="page-title">SIP Extensions</h1>
          <p className="page-sub">Manage SIP digest credentials and WebRTC softphone configurations (`/api/v1/extensions`).</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn-secondary">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {canManage && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus className="w-4 h-4" />
              <span>Provision Extension</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="search-input-wrap w-full md:w-72">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search extension or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
            />
          </div>

          {user?.role === 'SUPER_ADMIN' && tenants.length > 0 && (
            <div className="w-48 shrink-0">
              <CustomSelect
                options={[
                  { value: '', label: 'All Tenants' },
                  ...tenants.map((t: Tenant) => ({ value: t.id, label: t.name }))
                ]}
                value={selectedTenantFilter}
                onChange={(val) => setSelectedTenantFilter(val)}
              />
            </div>
          )}
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          Total Provisioned Endpoints: <span className="text-slate-900">{extensions.length}</span>
        </div>
      </div>

      {/* Data Table */}
      <div className="card overflow-hidden">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ext #</th>
                <th>Display Name</th>
                <th>User Email</th>
                <th>Caller ID</th>
                <th>WebRTC Status</th>
                <th>No-Answer Timeout</th>
                {canManage && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredExts.map((ext: Extension) => (
                <tr key={ext.id}>
                  <td className="font-mono font-bold text-[#FF5430]">{ext.extension_number}</td>
                  <td className="font-bold text-slate-900">{ext.display_name}</td>
                  <td className="text-slate-600 font-mono">{ext.email || 'N/A'}</td>
                  <td className="text-slate-600">{ext.caller_id_name || ext.display_name} ({ext.caller_id_number || ext.extension_number})</td>
                  <td>
                    <span className={`terrix-badge ${ext.webrtc_enabled ? 'green' : 'grey'}`}>
                      {ext.webrtc_enabled ? 'WebRTC (WSS)' : 'SIP Only'}
                    </span>
                  </td>
                  <td className="font-mono text-slate-700">{ext.no_answer_timeout}s</td>
                  {canManage && (
                    <td className="text-right">
                      <button
                        onClick={() => {
                          setSelectedExtId(ext.id);
                          setShowResetModal(true);
                        }}
                        className="btn-secondary !h-8 !px-3 !py-0 text-xs"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-[#FF5430]" />
                        <span>Reset Password</span>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredExts.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="text-center py-12 text-slate-400 text-xs">
                    No extensions found.{canManage ? ' Click "Provision Extension" to add your first extension.' : ''}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Extension Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="terrix-modal">
            <div className="modal-head">
              <div className="modal-icon">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h3>Provision New SIP Extension</h3>
                <p>Create a tenant extension endpoint for desktop phones or WebRTC softphones</p>
              </div>
              <button onClick={() => setShowModal(false)} className="modal-close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body space-y-4">
                {user?.role === 'SUPER_ADMIN' && tenants.length > 0 && (
                  <div>
                    <label className="form-label">Target Tenant</label>
                    <CustomSelect
                      options={tenants.map((t: Tenant) => ({
                        value: t.id,
                        label: `${t.name} (${t.sip_domain})`
                      }))}
                      value={tenantId}
                      onChange={(val) => setTenantId(val)}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Extension Number</label>
                    <input
                      type="text"
                      placeholder="1001"
                      value={extNumber}
                      onChange={(e) => setExtNumber(e.target.value)}
                      className="form-control font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Display Name</label>
                    <input
                      type="text"
                      placeholder="Alice Smith"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="form-control"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">User Email Address</label>
                  <input
                    type="email"
                    placeholder="alice@acme.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">SIP Password</label>
                    <input
                      type="password"
                      placeholder="SIPPassword123!"
                      value={sipPassword}
                      onChange={(e) => setSipPassword(e.target.value)}
                      className="form-control"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Voicemail PIN</label>
                    <input
                      type="text"
                      placeholder="1234"
                      value={voicemailPin}
                      onChange={(e) => setVoicemailPin(e.target.value)}
                      className="form-control font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-foot">
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
        <div className="modal-backdrop">
          <div className="terrix-modal max-w-md">
            <div className="modal-head">
              <div className="modal-icon">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3>Reset Credentials</h3>
                <p>Update SIP authentication password or Voicemail PIN</p>
              </div>
              <button onClick={() => setShowResetModal(false)} className="modal-close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label className="form-label">New SIP Password</label>
                  <input
                    type="password"
                    placeholder="Leave empty to keep unchanged"
                    value={newSipPwd}
                    onChange={(e) => setNewSipPwd(e.target.value)}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">New Voicemail PIN</label>
                  <input
                    type="text"
                    placeholder="Leave empty to keep unchanged"
                    value={newVmPin}
                    onChange={(e) => setNewVmPin(e.target.value)}
                    className="form-control font-mono"
                  />
                </div>
              </div>

              <div className="modal-foot">
                <button type="button" onClick={() => setShowResetModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Updating...' : 'Save Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
