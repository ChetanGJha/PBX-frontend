import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Hash, Plus, Link2, Unlink, Search, CheckCircle2, Edit2, Trash2 } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

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

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    did_number: '',
    trunk_id: '',
    tenant_id: '',
    destination_type: 'extension',
    destination: ''
  });

  // Edit Modal State
  const [editDid, setEditDid] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    did_number: '',
    trunk_id: '',
    tenant_id: '',
    destination_type: 'extension',
    destination: ''
  });

  // Delete Modal State
  const [deleteDidId, setDeleteDidId] = useState<string | null>(null);

  // Assign Modal State
  const [didToAssign, setDidToAssign] = useState<any>(null);
  const [selectedTenantId, setSelectedTenantId] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [dData, tData, sData] = await Promise.all([
        apiService.getDids(token),
        user?.role === 'SUPER_ADMIN' ? apiService.getTenants(token).catch(() => []) : Promise.resolve([]),
        apiService.getTrunks(token).catch(() => [])
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
      const payload = {
        ...addForm,
        tenant_id: addForm.tenant_id && addForm.tenant_id.trim() !== '' ? addForm.tenant_id : null
      };
      await apiService.createDid(token, payload);
      const num = addForm.did_number;
      setShowAddModal(false);
      setAddForm({ did_number: '', trunk_id: '', tenant_id: '', destination_type: 'extension', destination: '' });
      showSuccessModal('DID Added to Inventory', `DID ${num} has been created and added to inventory.`);
      loadData();
    } catch (err: any) {
      showErrorModal('Failed to Add DID', err.message || 'Failed to add DID');
    }
  };

  const handleEditClick = (did: any) => {
    setEditDid(did);
    setEditForm({
      did_number: did.did_number || '',
      trunk_id: did.trunk_id || '',
      tenant_id: did.tenant_id || '',
      destination_type: did.destination_type || 'extension',
      destination: did.destination || ''
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDid) return;
    try {
      const payload = {
        ...editForm,
        tenant_id: editForm.tenant_id && editForm.tenant_id.trim() !== '' ? editForm.tenant_id : null
      };
      await apiService.updateDid(token, editDid.id, payload);
      setEditDid(null);
      showSuccessModal('DID Updated', `DID ${editForm.did_number} configuration updated successfully.`);
      loadData();
    } catch (err: any) {
      showErrorModal('Failed to Update DID', err.message || 'Failed to update DID');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDidId) return;
    try {
      await apiService.deleteDid(token, deleteDidId);
      setDeleteDidId(null);
      showSuccessModal('DID Deleted', 'The DID number has been removed from inventory.');
      loadData();
    } catch (err: any) {
      showErrorModal('Failed to Delete DID', err.message || 'Failed to delete DID');
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

  const filtered = dids.filter(d => 
    d.did_number.includes(search) ||
    (d.tenant_name && d.tenant_name.toLowerCase().includes(search.toLowerCase())) ||
    (d.trunk_name && d.trunk_name.toLowerCase().includes(search.toLowerCase()))
  );

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
          <div className="search-input-wrap" style={{ width: '280px' }}>
            <Search size={16} className="search-icon" />
            <input
              className="form-control"
              style={{ height: '38px', fontSize: '12px' }}
              placeholder="Search DID numbers, host or tenant..."
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
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => handleEditClick(d)}
                            className="btn-secondary !h-8 !px-2.5 text-xs"
                            title="Edit DID & Host Gateway"
                          >
                            <Edit2 size={13} className="text-slate-600" />
                            <span>Edit</span>
                          </button>
                          {d.tenant_id ? (
                            <button className="btn-secondary text-amber-600 !h-8 !px-2.5 text-xs" onClick={() => handleUnassignDid(d.id)} title="Unassign Tenant">
                              <Unlink size={13} style={{ marginRight: '2px' }} /> Unassign
                            </button>
                          ) : (
                            <button className="btn-primary !h-8 !px-2.5 text-xs" onClick={() => setDidToAssign(d)} title="Assign to Tenant">
                              <Link2 size={13} style={{ marginRight: '2px' }} /> Assign
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteDidId(d.id)}
                            className="btn-secondary !h-8 !px-2.5 text-xs text-rose-600 hover:bg-rose-50"
                            title="Delete DID"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
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
              <div className="modal-body space-y-3">
                <div className="form-group">
                  <label className="form-label">DID Phone Number</label>
                  <input required className="form-control" value={addForm.did_number} onChange={e => setAddForm({...addForm, did_number: e.target.value})} placeholder="e.g. +18005550199" />
                </div>
                <div className="form-group">
                  <label className="form-label">Provider SIP Trunk / Gateway</label>
                  <CustomSelect
                    options={[
                      { value: '', label: '-- Select Host SIP Trunk --' },
                      ...trunks.map(t => ({ value: t.id, label: `${t.name} (${t.host})` }))
                    ]}
                    value={addForm.trunk_id}
                    onChange={(val) => setAddForm({ ...addForm, trunk_id: val })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Assign to Tenant (Optional)</label>
                  <CustomSelect
                    options={[
                      { value: '', label: '-- Free / Unallocated --' },
                      ...tenants.map(t => ({ value: t.id, label: `${t.name} (${t.domain})` }))
                    ]}
                    value={addForm.tenant_id}
                    onChange={(val) => setAddForm({ ...addForm, tenant_id: val })}
                  />
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

      {/* EDIT DID MODAL */}
      {editDid && (
        <div className="modal-backdrop">
          <div className="terrix-modal">
            <div className="modal-head">
              <div className="modal-icon orange"><Edit2 size={20} /></div>
              <div>
                <h3>Edit DID & Provider Gateway</h3>
                <p>Modify DID properties, change host gateway or tenant allocation</p>
              </div>
              <button className="modal-close" onClick={() => setEditDid(null)}>×</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body space-y-3">
                <div className="form-group">
                  <label className="form-label">DID Phone Number</label>
                  <input required className="form-control" value={editForm.did_number} onChange={e => setEditForm({...editForm, did_number: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Provider SIP Trunk / Gateway</label>
                  <CustomSelect
                    options={[
                      { value: '', label: '-- Select Host SIP Trunk --' },
                      ...trunks.map(t => ({ value: t.id, label: `${t.name} (${t.host})` }))
                    ]}
                    value={editForm.trunk_id}
                    onChange={(val) => setEditForm({ ...editForm, trunk_id: val })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Assign to Tenant (Optional)</label>
                  <CustomSelect
                    options={[
                      { value: '', label: '-- Free / Unallocated --' },
                      ...tenants.map(t => ({ value: t.id, label: `${t.name} (${t.domain})` }))
                    ]}
                    value={editForm.tenant_id}
                    onChange={(val) => setEditForm({ ...editForm, tenant_id: val })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Inbound Destination Target</label>
                  <input className="form-control" placeholder="e.g. 1001 or Main IVR" value={editForm.destination} onChange={e => setEditForm({...editForm, destination: e.target.value})} />
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setEditDid(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Update DID</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE DID MODAL */}
      {deleteDidId && (
        <div className="modal-backdrop">
          <div className="terrix-modal" style={{ maxWidth: '420px' }}>
            <div className="modal-head">
              <div className="modal-icon red"><Trash2 size={20} /></div>
              <div>
                <h3>Delete DID Number</h3>
                <p>Are you sure you want to delete this DID from inventory?</p>
              </div>
              <button className="modal-close" onClick={() => setDeleteDidId(null)}>×</button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-slate-600">
                Removing this DID will revoke incoming call routing for this number across all tenants.
              </p>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn-secondary" onClick={() => setDeleteDidId(null)}>Cancel</button>
              <button type="button" className="btn-danger" onClick={handleDeleteConfirm}>Delete DID</button>
            </div>
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
                  <CustomSelect
                    options={[
                      { value: '', label: '-- Select Tenant --' },
                      ...tenants.map(t => ({ value: t.id, label: `${t.name} (${t.domain})` }))
                    ]}
                    value={selectedTenantId}
                    onChange={(val) => setSelectedTenantId(val)}
                  />
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
