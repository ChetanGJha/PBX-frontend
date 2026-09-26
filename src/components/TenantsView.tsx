import { useToast } from './ToastProvider';
import React, { useState, useEffect } from 'react';
import { Building2, Plus, RefreshCw, Trash2, Search, X, AlertCircle } from 'lucide-react';

import { apiService } from '../services/api';
import type { Tenant } from '../types';

interface TenantsViewProps {
  token: string | null;
}

export const TenantsView: React.FC<TenantsViewProps> = ({ token }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [sipDomain, setSipDomain] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchTenants = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getTenants(token);
      setTenants(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchTenants();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setModalError(null);
    try {
      await apiService.createTenant(token, { name, domain, sip_domain: sipDomain });
      setShowModal(false);
      showSuccessModal(
        'Tenant Domain Created',
        `Tenant "${name}" (${domain}) has been registered with SIP domain ${sipDomain || domain}.`
      );
      setName('');
      setDomain('');
      setSipDomain('');
      fetchTenants();
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err.message || JSON.stringify(err);
      setModalError(msg);
      showErrorModal('Failed to Create Tenant', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm('Are you sure you want to delete this tenant?')) return;
    try {
      await apiService.deleteTenant(token, id);
      showSuccessModal('Tenant Deleted', 'Tenant domain has been deleted successfully.');
      fetchTenants();
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err.message || JSON.stringify(err);
      setError(msg);
      showErrorModal('Failed to Delete Tenant', msg);
    }
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.sip_domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <div className="eyebrow">Domain Registry</div>
          <h1 className="page-title">Tenants Registry</h1>
          <p className="page-sub">Isolated multi-tenant domain mapping for PBX routing (`/api/v1/tenants`).</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchTenants} className="btn-secondary">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            <span>Add New Tenant</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Toolbar & Filter */}
      <div className="card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tenant name or domain..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control pl-9"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold">
          Total Registered Tenants: <span className="text-slate-900">{tenants.length}</span>
        </div>
      </div>

      {/* Data Table */}
      <div className="card overflow-hidden">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tenant Name</th>
                <th>Web Domain</th>
                <th>SIP Domain</th>
                <th>Timezone</th>
                <th>Max Ext</th>
                <th>Max Calls</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((t: Tenant) => (
                <tr key={t.id}>
                  <td className="font-bold text-slate-900">{t.name}</td>
                  <td className="font-mono text-slate-600">{t.domain}</td>
                  <td className="font-mono text-slate-600">{t.sip_domain}</td>
                  <td className="text-slate-600">{t.timezone}</td>
                  <td className="font-semibold text-slate-800">{t.max_extensions}</td>
                  <td className="font-semibold text-slate-800">{t.max_concurrent_calls}</td>
                  <td>
                    <span className="terrix-badge green">Active</span>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Tenant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                    No tenants found. Click "Add New Tenant" to provision a tenant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Tenant Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="terrix-modal">
            <div className="modal-head">
              <div className="modal-icon">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3>Provision New Tenant</h3>
                <p>Add a new isolated tenant entity to the PBX platform</p>
              </div>
              <button onClick={() => setShowModal(false)} className="modal-close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body space-y-4">
                {modalError && (
                  <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}
                <div>
                  <label className="form-label">Tenant Name</label>
                  <input
                    type="text"
                    placeholder="Acme Corporation"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Web Domain</label>
                  <input
                    type="text"
                    placeholder="acme.pbx.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">SIP Domain (FreeSWITCH)</label>
                  <input
                    type="text"
                    placeholder="acme.local"
                    value={sipDomain}
                    onChange={(e) => setSipDomain(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <div className="modal-foot">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Creating...' : 'Provision Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
