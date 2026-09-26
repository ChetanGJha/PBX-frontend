import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { Tenant } from '../types';
import { Building2, Plus, RefreshCw, Trash2, Search, AlertCircle, Power } from 'lucide-react';

interface TenantsViewProps {
  token: string;
}

export const TenantsView: React.FC<TenantsViewProps> = ({ token }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Requirement 2: Delete Confirmation Modal & Error Safeguard State
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    sip_domain: '',
  });

  const loadTenants = async () => {
    try {
      setLoading(true);
      const data = await apiService.getTenants(token);
      setTenants(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createTenant(token, formData);
      setShowCreateModal(false);
      setFormData({ name: '', domain: '', sip_domain: '' });
      loadTenants();
    } catch (err: any) {
      alert(err.message || 'Failed to create tenant');
    }
  };

  // Requirement 3: Disable / Enable Tenants Option
  const handleToggleStatus = async (tenant: Tenant) => {
    try {
      await apiService.toggleTenantStatus(token, tenant.id, !tenant.enabled);
      loadTenants();
    } catch (err: any) {
      alert(err.message || 'Failed to update tenant status');
    }
  };

  // Requirement 2: Delete with Confirmation Modal & Safeguards
  const confirmDeleteTenant = async () => {
    if (!tenantToDelete) return;
    setDeleteError(null);
    try {
      await apiService.deleteTenant(token, tenantToDelete.id);
      setTenantToDelete(null);
      loadTenants();
    } catch (err: any) {
      setDeleteError(err.message);
    }
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.domain.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Multi-Tenant Core</div>
          <h1 className="page-title">Tenant Organizations</h1>
          <p className="page-sub">Isolated customer domains, maximum extensions, and status controls</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={loadTenants}><RefreshCw size={16} /></button>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}><Plus size={16} /> Create Tenant</button>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              className="form-control"
              style={{ paddingLeft: '36px', height: '38px', fontSize: '12px' }}
              placeholder="Search tenants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tenant Name</th>
                <th>Domain</th>
                <th>SIP Domain</th>
                <th>Timezone</th>
                <th>Limits</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-4">Loading tenants...</td></tr>
              ) : filteredTenants.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-4 text-muted">No tenants found</td></tr>
              ) : (
                filteredTenants.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#111827' }}>{t.name}</div>
                      <div style={{ fontSize: '10px', color: '#9CA3AF' }}>ID: {t.id.slice(0, 8)}...</div>
                    </td>
                    <td><code className="code-box" style={{ padding: '4px 8px', fontSize: '11px' }}>{t.domain}</code></td>
                    <td><code className="code-box" style={{ padding: '4px 8px', fontSize: '11px' }}>{t.sip_domain}</code></td>
                    <td>{t.timezone}</td>
                    <td>{t.max_extensions} Exts / {t.max_concurrent_calls} Calls</td>
                    <td>
                      {t.enabled ? (
                        <span className="terrix-badge green">ACTIVE</span>
                      ) : (
                        <span className="terrix-badge orange">DISABLED</span>
                      )}
                    </td>
                    <td className="text-right">
                      {/* Requirement 3: Disable/Enable Toggle */}
                      <button
                        className={`btn-secondary ${t.enabled ? 'text-amber-600' : 'text-emerald-600'}`}
                        style={{ padding: '6px 10px', fontSize: '11px', marginRight: '6px' }}
                        onClick={() => handleToggleStatus(t)}
                        title={t.enabled ? 'Disable Tenant' : 'Enable Tenant'}
                      >
                        <Power size={14} style={{ marginRight: '4px' }} />
                        {t.enabled ? 'Disable' : 'Enable'}
                      </button>

                      {/* Requirement 2: Delete with Confirmation Modal */}
                      <button
                        className="btn-secondary text-rose-600"
                        style={{ padding: '6px 10px', fontSize: '11px' }}
                        onClick={() => { setTenantToDelete(t); setDeleteError(null); }}
                        title="Delete Tenant"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE TENANT MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="terrix-modal">
            <div className="modal-head">
              <div className="modal-icon"><Building2 size={20} /></div>
              <div>
                <h3>Create New Tenant</h3>
                <p>Provision a new isolated domain and PBX context</p>
              </div>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group mb-3">
                  <label className="form-label">Tenant Name</label>
                  <input required className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Acme Corp" />
                </div>
                <div className="form-group mb-3">
                  <label className="form-label">Domain Name</label>
                  <input required className="form-control" value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })} placeholder="e.g. acme.pbx.com" />
                </div>
                <div className="form-group mb-3">
                  <label className="form-label">SIP Domain</label>
                  <input className="form-control" value={formData.sip_domain} onChange={(e) => setFormData({ ...formData, sip_domain: e.target.value })} placeholder="e.g. acme.local (Optional)" />
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Tenant</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUIREMENT 2: DELETE CONFIRMATION & SAFEGUARD ERROR MODAL */}
      {tenantToDelete && (
        <div className="modal-backdrop">
          <div className="terrix-modal" style={{ maxWidth: '480px' }}>
            <div className="modal-head">
              <div className="modal-icon text-rose-600 bg-rose-50"><AlertCircle size={20} /></div>
              <div>
                <h3>Confirm Tenant Deletion</h3>
                <p>Are you sure you want to delete <strong>{tenantToDelete.name}</strong>?</p>
              </div>
              <button className="modal-close" onClick={() => setTenantToDelete(null)}>×</button>
            </div>
            <div className="modal-body">
              {deleteError ? (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold leading-relaxed">
                  <div className="font-extrabold mb-1">Cannot Delete Tenant!</div>
                  {deleteError}
                </div>
              ) : (
                <p className="text-xs text-slate-600">
                  This action will soft-delete tenant <strong>{tenantToDelete.domain}</strong>. Ensure all allocated extensions, DIDs, and gateways have been unassigned first.
                </p>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn-secondary" onClick={() => setTenantToDelete(null)}>Cancel</button>
              {!deleteError && (
                <button className="btn-primary bg-rose-600 border-rose-600 hover:bg-rose-700" onClick={confirmDeleteTenant}>
                  Yes, Delete Tenant
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
