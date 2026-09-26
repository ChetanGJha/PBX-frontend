import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Network, Plus, Search, Server, ShieldCheck, Activity, CheckCircle2 } from 'lucide-react';

interface TrunksViewProps {
  token: string;
}

export const TrunksView: React.FC<TrunksViewProps> = ({ token }) => {
  const [trunks, setTrunks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 5060,
    transport: 'UDP',
    username: '',
    password: '',
    realm: '',
    priority: 1,
    register: true,
    srtp: false
  });

  const loadTrunks = async () => {
    try {
      setLoading(true);
      const data = await apiService.getTrunks(token);
      setTrunks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load SIP trunks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrunks();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createTrunk(token, formData);
      setShowModal(false);
      setFormData({
        name: '',
        host: '',
        port: 5060,
        transport: 'UDP',
        username: '',
        password: '',
        realm: '',
        priority: 1,
        register: true,
        srtp: false
      });
      loadTrunks();
    } catch (err: any) {
      alert(err.message || 'Failed to create SIP trunk');
    }
  };

  const filtered = trunks.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.host.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Telephony Infrastructure</div>
          <h1 className="page-title">SIP Trunks</h1>
          <p className="page-sub">Configure carrier SIP trunk connections, proxies and gateway routes</p>
        </div>
        <div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add SIP Trunk
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Total Trunks</span>
            <div style={{ background: '#FFF0EC', padding: '6px', borderRadius: '8px', color: 'var(--orange)' }}><Network size={18} /></div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{trunks.length}</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Registered</span>
            <div style={{ background: '#ECFDF5', padding: '6px', borderRadius: '8px', color: '#047857' }}><CheckCircle2 size={18} /></div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{trunks.filter(t => t.register).length}</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Active Channels</span>
            <div style={{ background: '#EFF6FF', padding: '6px', borderRadius: '8px', color: '#2563EB' }}><Activity size={18} /></div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{trunks.filter(t => t.enabled).length * 30}</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Security (SRTP)</span>
            <div style={{ background: '#F3E8FF', padding: '6px', borderRadius: '8px', color: '#9333EA' }}><ShieldCheck size={18} /></div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{trunks.filter(t => t.srtp).length} Enabled</div>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input 
              className="form-control"
              style={{ paddingLeft: '36px', height: '38px', fontSize: '12px' }}
              placeholder="Search SIP trunks by name or host..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Trunk Name</th>
                <th>SIP Host / Proxy</th>
                <th>Port</th>
                <th>Transport</th>
                <th>Auth Username</th>
                <th>Priority</th>
                <th>Registration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-4">Loading SIP trunks...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-4 text-muted">No SIP trunks match your search</td></tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#111827' }}>{t.name}</div>
                    </td>
                    <td><code className="code-box" style={{ padding: '4px 8px', fontSize: '11px' }}>{t.host}</code></td>
                    <td>{t.port}</td>
                    <td><span className="terrix-badge grey">{t.transport}</span></td>
                    <td>{t.username || <span style={{ color: '#9CA3AF' }}>IP Auth</span>}</td>
                    <td><span style={{ fontWeight: 700 }}>P{t.priority}</span></td>
                    <td>
                      {t.register ? (
                        <span className="terrix-badge green"><CheckCircle2 size={10} style={{ marginRight: '4px' }} /> REGISTERED</span>
                      ) : (
                        <span className="terrix-badge grey">STATIC IP</span>
                      )}
                    </td>
                    <td>
                      {t.enabled ? (
                        <span className="terrix-badge green">ACTIVE</span>
                      ) : (
                        <span className="terrix-badge orange">DISABLED</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="terrix-modal">
            <div className="modal-head">
              <div className="modal-icon"><Server size={20} /></div>
              <div>
                <h3>Create New SIP Trunk</h3>
                <p>Configure carrier proxy settings, port & auth credentials</p>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Trunk Name</label>
                    <input required className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Twilio Primary Gateway" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SIP Host / Proxy</label>
                    <input required className="form-control" value={formData.host} onChange={e => setFormData({...formData, host: e.target.value})} placeholder="e.g. sip.twilio.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SIP Port</label>
                    <input type="number" className="form-control" value={formData.port} onChange={e => setFormData({...formData, port: parseInt(e.target.value) || 5060})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Transport Protocol</label>
                    <select className="form-control" value={formData.transport} onChange={e => setFormData({...formData, transport: e.target.value})}>
                      <option value="UDP">UDP (Standard)</option>
                      <option value="TCP">TCP</option>
                      <option value="TLS">TLS (Encrypted)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Auth Username</label>
                    <input className="form-control" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="Optional for IP authentication" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Auth Password</label>
                    <input type="password" className="form-control" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Optional" />
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Trunk</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
