import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect, useMemo } from 'react';
import { CustomSelect } from './CustomSelect';
import { apiService } from '../services/api';
import { PhoneForwarded, Plus, Edit2, Trash2, Search, X } from 'lucide-react';

interface HuntGroupsViewProps {
  token: string;
  user?: User | null;
}

export const HuntGroupsView: React.FC<HuntGroupsViewProps> = ({ token, user }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [huntGroups, setHuntGroups] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    extension_number: '',
    strategy: 'sequential',
    timeout: 20,
    tenant_id: user?.tenant_id || ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [hData, tData, extData] = await Promise.allSettled([
        apiService.getHuntGroups(token),
        apiService.getTenants(token),
        apiService.getExtensions(token)
      ]);
      if (hData.status === 'fulfilled') setHuntGroups(hData.value);
      if (tData.status === 'fulfilled') setTenants(tData.value);
      if (extData.status === 'fulfilled') setExtensions(extData.value);
    } catch (err) {
      console.error('Failed to load hunt groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Extensions filtered by tenant
  const tenantExtensions = useMemo(() => {
    if (user?.role === 'SUPER_ADMIN') {
      if (formData.tenant_id) {
        return extensions.filter(e => e.tenant_id === formData.tenant_id);
      }
      return extensions;
    }
    return extensions.filter(e => e.tenant_id === user?.tenant_id || !e.tenant_id);
  }, [extensions, user, formData.tenant_id]);

  const handleOpenCreate = () => {
    setEditingGroup(null);
    setSelectedMembers([]);
    setMemberSearch('');
    setFormData({
      name: '',
      extension_number: '',
      strategy: 'sequential',
      timeout: 20,
      tenant_id: user?.tenant_id || ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (hg: any) => {
    setEditingGroup(hg);
    const existing = hg.members
      ? hg.members.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];
    setSelectedMembers(existing);
    setMemberSearch('');
    setFormData({
      name: hg.name,
      extension_number: hg.extension_number,
      strategy: hg.strategy || 'sequential',
      timeout: hg.timeout || 20,
      tenant_id: hg.tenant_id || user?.tenant_id || ''
    });
    setShowModal(true);
  };

  const toggleMember = (extNum: string) => {
    setSelectedMembers(prev =>
      prev.includes(extNum) ? prev.filter(x => x !== extNum) : [...prev, extNum]
    );
  };

  const handleSelectAll = () => {
    setSelectedMembers(tenantExtensions.map(e => e.extension_number));
  };

  const handleClearAll = () => {
    setSelectedMembers([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMembers.length === 0) {
      showErrorModal('Members Required', 'Please select at least one member extension for this hunt group.');
      return;
    }

    try {
      const payload: any = {
        ...formData,
        members: selectedMembers.join(', ')
      };

      if (user?.role !== 'SUPER_ADMIN' && user?.tenant_id) {
        payload.tenant_id = user.tenant_id;
      } else if (!payload.tenant_id) {
        delete payload.tenant_id;
      }

      if (editingGroup) {
        await apiService.updateHuntGroup(token, editingGroup.id, payload);
        showSuccessModal(
          'Hunt Group Updated',
          `Hunt group "${formData.name}" (ext/${formData.extension_number}) was updated.`
        );
      } else {
        await apiService.createHuntGroup(token, payload);
        showSuccessModal(
          'Hunt Group Created',
          `Hunt group "${formData.name}" (ext/${formData.extension_number}) was created with ${selectedMembers.length} member extension(s).`
        );
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      showErrorModal('Hunt Group Operation Failed', err.message || 'Failed to save hunt group');
    }
  };

  const handleDelete = async (hg: any) => {
    if (!window.confirm(`Delete hunt group "${hg.name}" (${hg.extension_number})?`)) return;
    try {
      await apiService.deleteHuntGroup(token, hg.id);
      showSuccessModal(
        'Hunt Group Deleted',
        `Hunt group "${hg.name}" was removed.`
      );
      loadData();
    } catch (err: any) {
      showErrorModal('Failed to Delete', err.message || 'Could not delete hunt group');
    }
  };

  const filtered = huntGroups.filter(hg =>
    (hg.name && hg.name.toLowerCase().includes(search.toLowerCase())) ||
    (hg.extension_number && hg.extension_number.includes(search))
  );

  const filteredExtensions = tenantExtensions.filter(ext =>
    ext.extension_number.includes(memberSearch) ||
    (ext.display_name && ext.display_name.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'TENANT_ADMIN';

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">mod_huntgroup</div>
          <h1 className="page-title">Hunt Groups</h1>
          <p className="page-sub">Configure sequential, simultaneous, and circular ring hunting groups</p>
        </div>
        {canManage && (
          <div>
            <button className="btn-primary" onClick={handleOpenCreate}>
              <Plus size={16} /> Create Hunt Group
            </button>
          </div>
        )}
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="search-input-wrap" style={{ width: '280px' }}>
            <Search size={16} className="search-icon" />
            <input
              className="form-control"
              style={{ height: '38px', fontSize: '12px' }}
              placeholder="Search hunt groups..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#6B7280' }}>
            Total <strong>{filtered.length}</strong> active hunt group{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Group Name</th>
                <th>Extension</th>
                <th>Hunt Strategy</th>
                <th>Timeout</th>
                <th>Member Extensions</th>
                {user?.role === 'SUPER_ADMIN' && <th>Tenant</th>}
                {canManage && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={(user?.role === 'SUPER_ADMIN' ? 6 : 5) + (canManage ? 1 : 0)} className="text-center py-4">Loading hunt groups...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={(user?.role === 'SUPER_ADMIN' ? 6 : 5) + (canManage ? 1 : 0)} className="text-center py-4 text-muted">No hunt groups configured yet</td></tr>
              ) : (
                filtered.map(hg => {
                  const memberList = hg.members
                    ? hg.members.split(',').map((s: string) => s.trim()).filter(Boolean)
                    : [];
                  return (
                    <tr key={hg.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#FFF0EC', color: '#FF5430', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <PhoneForwarded size={14} />
                          </div>
                          <strong style={{ color: '#111827', fontSize: '13px' }}>{hg.name}</strong>
                        </div>
                      </td>
                      <td>
                        <code className="code-box" style={{ padding: '3px 8px', fontSize: '11px', fontWeight: 700 }}>
                          {hg.extension_number}
                        </code>
                      </td>
                      <td>
                        <span className="terrix-badge orange">{hg.strategy.toUpperCase()}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: '#4B5563' }}>{hg.timeout}s</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                          {memberList.length === 0 ? (
                            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>No members</span>
                          ) : (
                            <>
                              <span className="terrix-badge grey" style={{ fontWeight: 700 }}>
                                {memberList.length} Member{memberList.length !== 1 ? 's' : ''}
                              </span>
                              {memberList.slice(0, 3).map((m: string) => (
                                <span key={m} style={{ fontSize: '11px', background: '#F1F5F9', color: '#334155', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                                  {m}
                                </span>
                              ))}
                              {memberList.length > 3 && (
                                <span style={{ fontSize: '10.5px', color: '#6B7280' }}>+{memberList.length - 3} more</span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      {user?.role === 'SUPER_ADMIN' && (
                        <td>
                          <span className="terrix-badge green">{hg.tenant_name || 'Global'}</span>
                        </td>
                      )}
                      {canManage && (
                        <td className="text-right">
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '5px 8px', fontSize: '11px' }}
                              onClick={() => handleOpenEdit(hg)}
                              title="Edit Hunt Group"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn-secondary text-rose-600"
                              style={{ padding: '5px 8px', fontSize: '11px' }}
                              onClick={() => handleDelete(hg)}
                              title="Delete Hunt Group"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="terrix-modal" style={{ maxWidth: '640px' }}>
            <div className="modal-head">
              <div className="modal-icon"><PhoneForwarded size={20} /></div>
              <div>
                <h3>{editingGroup ? 'Edit Hunt Group' : 'Create Hunt Group'}</h3>
                <p>Configure hunting extension, strategy, and multi-select member extensions</p>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label required">Group Name</label>
                    <input
                      required
                      className="form-control"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Sales Ring Group"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Group Extension Number</label>
                    <input
                      required
                      className="form-control"
                      value={formData.extension_number}
                      onChange={e => setFormData({ ...formData, extension_number: e.target.value })}
                      placeholder="e.g. 8001"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Hunting Strategy</label>
                    <CustomSelect
                      options={[
                        { value: 'sequential', label: 'Sequential (Priority Order)' },
                        { value: 'simultaneous', label: 'Simultaneous (Ring All)' },
                        { value: 'circular', label: 'Circular / Round Robin' }
                      ]}
                      value={formData.strategy}
                      onChange={val => setFormData({ ...formData, strategy: val })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ring Timeout per Member (sec)</label>
                    <input
                      type="number"
                      min={5}
                      max={120}
                      className="form-control"
                      value={formData.timeout}
                      onChange={e => setFormData({ ...formData, timeout: parseInt(e.target.value) || 20 })}
                    />
                  </div>

                  {user?.role === 'SUPER_ADMIN' && (
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">Target Tenant (Optional)</label>
                      <CustomSelect
                        options={[
                          { value: '', label: '-- Global / Select Tenant --' },
                          ...tenants.map(t => ({ value: t.id, label: `${t.name} (${t.domain})` }))
                        ]}
                        value={formData.tenant_id}
                        onChange={val => setFormData({ ...formData, tenant_id: val })}
                      />
                    </div>
                  )}

                  {/* Multi-Select Assigned Member Extensions */}
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="form-label required" style={{ marginBottom: 0 }}>
                        Assigned Member Extensions ({selectedMembers.length} selected)
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          style={{ background: 'none', border: 'none', color: '#FF5430', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Select All
                        </button>
                        <span style={{ color: '#D1D5DB' }}>|</span>
                        <button
                          type="button"
                          onClick={handleClearAll}
                          style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Selected Members Pills */}
                    {selectedMembers.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px', padding: '8px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        {selectedMembers.map(extNum => {
                          const extObj = tenantExtensions.find(e => e.extension_number === extNum);
                          return (
                            <span
                              key={extNum}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#FFF0EC',
                                border: '1px solid #FFCCBC',
                                color: '#D84315',
                                borderRadius: '6px',
                                padding: '3px 8px',
                                fontSize: '11.5px',
                                fontWeight: 600
                              }}
                            >
                              ext/{extNum} {extObj?.display_name ? `(${extObj.display_name})` : ''}
                              <button
                                type="button"
                                onClick={() => toggleMember(extNum)}
                                style={{ background: 'none', border: 'none', color: '#D84315', cursor: 'pointer', padding: 0, display: 'flex' }}
                              >
                                <X size={13} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Extension Search & Checklist Box */}
                    <div style={{ border: '1px solid #D1D5DB', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ padding: '6px 10px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                        <input
                          type="text"
                          placeholder="Filter extensions by number or name..."
                          value={memberSearch}
                          onChange={e => setMemberSearch(e.target.value)}
                          style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '11.5px', outline: 'none' }}
                        />
                      </div>
                      <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '6px' }}>
                        {filteredExtensions.length === 0 ? (
                          <div style={{ padding: '12px', textAlign: 'center', color: '#9CA3AF', fontSize: '12px' }}>
                            {tenantExtensions.length === 0 ? 'No extensions provisioned for this tenant' : 'No matching extensions found'}
                          </div>
                        ) : (
                          filteredExtensions.map(ext => {
                            const isChecked = selectedMembers.includes(ext.extension_number);
                            return (
                              <label
                                key={ext.id || ext.extension_number}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '7px 10px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  marginBottom: '2px',
                                  background: isChecked ? '#FFF3E0' : '#FFFFFF',
                                  border: `1px solid ${isChecked ? '#FFB74D' : 'transparent'}`,
                                  transition: 'background 0.15s ease'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleMember(ext.extension_number)}
                                  style={{ accentColor: '#FF5430', width: '15px', height: '15px' }}
                                />
                                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>
                                    <strong style={{ fontSize: '12.5px', color: '#111827' }}>ext/{ext.extension_number}</strong>
                                    {ext.display_name && (
                                      <span style={{ marginLeft: '6px', color: '#4B5563', fontSize: '12px' }}>
                                        — {ext.display_name}
                                      </span>
                                    )}
                                  </div>
                                  <span style={{ fontSize: '10.5px', color: '#9CA3AF' }}>{ext.status || 'SIP'}</span>
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingGroup ? 'Update Hunt Group' : 'Save Hunt Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
