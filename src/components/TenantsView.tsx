import React, { useState, useEffect } from 'react';
import { Building2, Plus, RefreshCw, Trash2, Globe, PhoneCall, Calendar, ShieldCheck, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';
import type { Tenant } from '../types';

interface TenantsViewProps {
  token: string | null;
}

export const TenantsView: React.FC<TenantsViewProps> = ({ token }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [sipDomain, setSipDomain] = useState('');

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
    try {
      await apiService.createTenant(token, { name, domain, sip_domain: sipDomain });
      setShowModal(false);
      setName('');
      setDomain('');
      setSipDomain('');
      fetchTenants();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm('Are you sure you want to delete this tenant?')) return;
    try {
      await apiService.deleteTenant(token, id);
      fetchTenants();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!token) {
    return (
      <div className="glass-panel p-8 text-center text-slate-400">
        <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-amber-400 opacity-80" />
        <h3 className="text-lg font-bold text-white mb-1">Authentication Required</h3>
        <p className="text-sm">Please log in using the "Authentication & Seeding" tab first to access Tenant Management APIs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-400" />
            <span>Tenant Management</span>
          </h2>
          <p className="text-xs text-slate-400">Multi-Tenant isolation domain registry (`/api/v1/tenants`)</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchTenants} className="btn-secondary" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            <span>Create Tenant</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map((t: Tenant) => (

          <div key={t.id} className="glass-card p-5 border border-slate-800 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{t.name}</h3>
                <span className="badge badge-success mt-1">Active</span>
              </div>
              <button
                onClick={() => handleDelete(t.id)}
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Delete Tenant"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-400">Domain:</span>
                <span className="font-mono text-cyan-200">{t.domain}</span>
              </div>

              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-indigo-400" />
                <span className="text-slate-400">SIP Domain:</span>
                <span className="font-mono text-indigo-200">{t.sip_domain}</span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400">Timezone:</span>
                <span className="font-mono text-emerald-200">{t.timezone}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Max Ext: <strong className="text-slate-200">{t.max_extensions}</strong></span>
              <span>Max Calls: <strong className="text-slate-200">{t.max_concurrent_calls}</strong></span>
            </div>
          </div>
        ))}

        {tenants.length === 0 && !loading && (
          <div className="col-span-full text-center p-12 glass-panel text-slate-400">
            No tenants registered yet. Click "Create Tenant" above to add your first PBX tenant.
          </div>
        )}
      </div>

      {/* Create Tenant Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-md w-full border border-indigo-500/40">
            <h3 className="text-lg font-bold text-white mb-4">Provision New Tenant</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tenant Name</label>
                <input
                  type="text"
                  placeholder="Acme Corporation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Web Domain</label>
                <input
                  type="text"
                  placeholder="acme.pbx.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">SIP Domain (FreeSWITCH)</label>
                <input
                  type="text"
                  placeholder="acme.local"
                  value={sipDomain}
                  onChange={(e) => setSipDomain(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Creating...' : 'Create Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
