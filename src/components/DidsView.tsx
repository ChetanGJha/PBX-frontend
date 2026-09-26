import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Hash, Plus, Link2, Unlink, Search, CheckCircle2 } from 'lucide-react';

interface DidsViewProps {
  token: string;
  user?: User | null;
}

export const DidsView: React.FC<DidsViewProps> = ({ token, user }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [dids, setDids] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [trunks, setTrunks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ did_number: '', trunk_id: '', destination_type: 'extension', destination: '' });

  const [didToAssign, setDidToAssign] = useState<any>(null);
  const [selectedTenantId, setSelectedTenantId] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [dData, tData, sData] = await Promise.all([
        apiService.getDids(token),
        apiService.getTenants(token),
        apiService.getTrunks(token)
      ]);
      setDids(dData);
      setTenants(tData);
      setTrunks(sData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleAddDid = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createDid(token, addForm);
      const num = addForm.did_number;
      setShowAddModal(false);
      setAddForm({ did_number: '', trunk_id: '', destination_type: 'extension', destination: '' });
      showSuccessModal('DID Added to Inventory', `DID ${num} has been created and added to inventory.`);
      loadData();
    } catch (err: any) {
      showErrorModal('Failed to Add DID', err.message || 'Failed to add DID');
    }
  };

  const handleAssignDid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!didToAssign || !selectedTenantId) return;
    try {
      await apiService.assignDid(token, didToAssign.id, selectedTenantId);
      const num = didToAssign.did_number;
      setDidToAssign(null);
      setSelectedTenantId('');
      showSuccessModal('DID Assigned', `DID ${num} has been successfully assigned to tenant.`);
      loadData();
    } catch (err: any) {
      showErrorModal('Failed to Assign DID', err.message || 'Failed to assign DID');
    }
  };

  const handleUnassignDid = async (didId: string) => {
    try {
      await apiService.unassignDid(token, didId);
      showSuccessModal('DID Unassigned', 'DID returned to unallocated pool.');
      loadData();
    } catch (err: any) {
      showErrorModal('Failed to Unassign DID', err.message || 'Failed to unassign DID');
    }
  };

  const filtered = dids.filter(d => d.did_number.includes(search));

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Telephony Inventory</div>
          <h1 className="page-title">{user?.role === 'SUPER_ADMIN' ? 'DID Number Inventory' : 'Assigned DIDs'}</h1>
          <p className="page-sub">{user?.role === 'SUPER_ADMIN' ? 'Manage global DID phone numbers provider-wise and allocate free numbers to tenants' : 'Manage inbound routing and view allocated DID phone numbers for your organization'}</p>
        </div>
        <div>
          {user?.role === 'SUPER_ADMIN' && (
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> Add DID to Inventory
            </button>
          )}
        </div>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              className="form-control"
              style={{ paddingLeft: '36px', height: '38px', fontSize: '12px' }}
              placeholder="Search DID numbers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>DID Number</th>
                <th>Provider SIP Trunk / Gateway</th>
                <th>Assigned Tenant</th>
                <th>Destination Target</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-4">Loading DIDs...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-4 text-muted">No DIDs in inventory</td></tr>
              ) : (
                filtered.map(d => (
                  <tr key={d.id}>
                    <td><strong style={{ fontSize: '13px', color: '#111827' }}>{d.did_number}</strong></td>
                    <td><span className="terrix-badge grey">{d.trunk_name || 'Global Provider'}</span></td>
                    <td>
                      {d.tenant_name ? (
                        <span className="terrix-badge orange">{d.tenant_name} ({d.tenant_domain})</span>
                      ) : (
                        <span className="terrix-badge green"><CheckCircle2 size={10} style={{ marginRight: '4px' }} /> FREE / UNALLOCATED</span>
                      )}
                    </td>
                    <td>{d.destination_type}: {d.destination || 'Default Route'}</td>
                    <td><span className="terrix-badge green">ACTIVE</span></td>
                    <td className="text-right">
                      {user?.role === 'SUPER_ADMIN' ? (
                        d.tenant_id ? (
                          <button className="btn-secondary text-amber-600" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleUnassignDid(d.id)}>
                            <Unlink size={13} style={{ marginRight: '4px' }} /> Unassign
                          </button>
                        ) : (
                          <button className="btn-primary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => setDidToAssign(d)}>
                            <Link2 size={13} style={{ marginRight: '4px' }} /> Assign to Tenant
                          </button>
                        )
                      ) : (
                        <span className="terrix-badge green">Provisioned</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD DID MODAL */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="terrix-modal">
            <div className="modal-head">
              <div className="modal-icon"><Hash size={20} /></div>
              <div>
                <h3>Add DID Number to Inventory</h3>
                <p>Import DID from carrier SIP trunk into global pool</p>
              </div>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddDid}>
              <div className="modal-body">
                <div className="form-group mb-3">
                  <label className="form-label">DID Phone Number</label>
                  <input required className="form-control" value={addForm.did_number} onChange={e => setAddForm({...addForm, did_number: e.target.value})} placeholder="e.g. +18005550199" />
                </div>
                <div className="form-group mb-3">
                  <label className="form-label">Provider SIP Trunk / Gateway</label>
                  <select className="form-control" value={addForm.trunk_id} onChange={e => setAddForm({...addForm, trunk_id: e.target.value})}>
                    <option value="">-- Select Host SIP Trunk --</option>
                    {trunks.map(t => <option key={t.id} value={t.id}>{t.name} ({t.host})</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add DID</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN DID MODAL */}
      {didToAssign && (
        <div className="modal-backdrop">
          <div className="terrix-modal" style={{ maxWidth: '440px' }}>
            <div className="modal-head">
              <div className="modal-icon"><Link2 size={20} /></div>
              <div>
                <h3>Assign DID to Tenant</h3>
                <p>Assign DID <strong>{didToAssign.did_number}</strong> to a customer domain</p>
              </div>
              <button className="modal-close" onClick={() => setDidToAssign(null)}>×</button>
            </div>
            <form onSubmit={handleAssignDid}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Target Tenant</label>
                  <select required className="form-control" value={selectedTenantId} onChange={e => setSelectedTenantId(e.target.value)}>
                    <option value="">-- Select Tenant --</option>
                    {tenants.map(t => <option key={t.id} value={t.id}>{t.name} ({t.domain})</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setDidToAssign(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Assign Number</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
