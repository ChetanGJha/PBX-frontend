import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Link } from 'lucide-react';

interface GatewaysViewProps {
  token: string;
}

export const GatewaysView: React.FC<GatewaysViewProps> = ({ token }) => {
  const [gateways, setGateways] = useState<any[]>([]);
  const [trunks, setTrunks] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    tenant_id: '',
    gateway_id: '',
    direction: 'inbound_outbound',
    priority: 1,
    caller_id_policy: 'tenant_default',
    allow_outbound: true,
    accept_inbound: true,
    allow_international: false
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [gData, tData, sData] = await Promise.allSettled([
        apiService.getGateways(token),
        apiService.getTenants(token),
        apiService.getTrunks(token)
      ]);
      if (gData.status === 'fulfilled') setGateways(gData.value);
      if (tData.status === 'fulfilled') setTenants(tData.value);
      if (sData.status === 'fulfilled') setTrunks(sData.value);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.assignGateway(token, assignForm);
      setShowAssignModal(false);
      alert('SIP Trunk / Gateway assigned to tenant successfully!');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Assignment failed');
    }
  };

  // Combine Sofia Gateways and Carrier SIP Trunks into unified selector list
  const availableTrunksAndGateways = [
    ...trunks.map(t => ({ id: t.id, name: `${t.name} (${t.host}) [SIP Trunk]` })),
    ...gateways.map(g => ({ id: g.id, name: `${g.name} (${g.proxy}) [Sofia Gateway]` }))
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">FreeSWITCH Sofia Core</div>
          <h1 className="page-title">SIP Trunks & Gateway Assignments</h1>
          <p className="page-sub">Assign carrier SIP trunks to tenants and specify inbound/outbound priority rules</p>
        </div>
        <div>
          <button className="btn-primary" onClick={() => setShowAssignModal(true)}>
            <Link size={16} /> Assign SIP Trunk to Tenant
          </button>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Gateway / Trunk Name</th>
                <th>SIP Proxy / Host</th>
                <th>Assigned Tenant</th>
                <th>Codecs</th>
                <th>Registration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-4">Loading Sofia Gateways...</td></tr>
              ) : gateways.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-4 text-muted">No gateways configured</td></tr>
              ) : (
                gateways.map((g) => (
                  <tr key={g.id}>
                    <td><div style={{ fontWeight: 700, color: '#111827' }}>{g.name}</div></td>
                    <td><code className="code-box" style={{ padding: '4px 8px', fontSize: '11px' }}>{g.proxy}</code></td>
                    <td>
                      {g.tenant_name ? (
                        <span className="terrix-badge orange">{g.tenant_name}</span>
                      ) : (
                        <span className="terrix-badge grey">GLOBAL TRUNK</span>
                      )}
                    </td>
                    <td>{g.codecs}</td>
                    <td>
                      {g.register ? (
                        <span className="terrix-badge green">REGISTERED</span>
                      ) : (
                        <span className="terrix-badge grey">STATIC IP</span>
                      )}
                    </td>
                    <td><span className="terrix-badge green">ONLINE</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAssignModal && (
        <div className="modal-backdrop">
          <div className="terrix-modal">
            <div className="modal-head">
              <div className="modal-icon"><Link size={20} /></div>
              <div>
                <h3>Assign SIP Trunk / Gateway to Tenant</h3>
                <p>Select provider SIP Trunk and configure tenant routing bounds</p>
              </div>
              <button className="modal-close" onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            <form onSubmit={handleAssign}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Target Tenant</label>
                    <select required className="form-control" value={assignForm.tenant_id} onChange={e => setAssignForm({...assignForm, tenant_id: e.target.value})}>
                      <option value="">-- Select Tenant --</option>
                      {tenants.map(t => <option key={t.id} value={t.id}>{t.name} ({t.domain})</option>)}
                    </select>
                  </div>

                  {/* Requirement 3: Shows SIP Trunk Name from SIP Trunks Section */}
                  <div className="form-group">
                    <label className="form-label">SIP Trunk Provider / Gateway</label>
                    <select required className="form-control" value={assignForm.gateway_id} onChange={e => setAssignForm({...assignForm, gateway_id: e.target.value})}>
                      <option value="">-- Select SIP Trunk Provider --</option>
                      {availableTrunksAndGateways.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Call Direction</label>
                    <select className="form-control" value={assignForm.direction} onChange={e => setAssignForm({...assignForm, direction: e.target.value})}>
                      <option value="inbound_outbound">Inbound & Outbound</option>
                      <option value="inbound_only">Inbound Only</option>
                      <option value="outbound_only">Outbound Only</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority Level (1 = Highest)</label>
                    <input type="number" className="form-control" value={assignForm.priority} onChange={e => setAssignForm({...assignForm, priority: parseInt(e.target.value) || 1})} />
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setShowAssignModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
