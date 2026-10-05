import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Plus, Link2, Unlink, Edit2, Trash2 } from 'lucide-react';
import { ListPageLayout } from './layout';
import { Stack, Inline } from './layout/Stack';
import {
  Button,
  Input,
  Select,
  FormField,
  Modal,
  Badge,
} from './ui';
import { DataTable, FilterBar } from './patterns';

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

  const columns = [
    {
      key: 'did_number',
      header: 'DID Number',
      sortable: true,
      render: (d: any) => <strong>{d.did_number}</strong>,
    },
    {
      key: 'trunk_name',
      header: 'Provider SIP Trunk / Gateway',
      render: (d: any) => <Badge variant="neutral">{d.trunk_name || 'Global Provider'}</Badge>,
    },
    {
      key: 'tenant_name',
      header: 'Assigned Tenant',
      render: (d: any) => (
        d.tenant_name ? (
          <Badge variant="warning">{d.tenant_name} ({d.tenant_domain})</Badge>
        ) : (
          <Badge variant="success">FREE / UNALLOCATED</Badge>
        )
      ),
    },
    {
      key: 'destination',
      header: 'Destination Target',
      render: (d: any) => `${d.destination_type}: ${d.destination || 'Default Route'}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: () => <Badge variant="success">ACTIVE</Badge>,
    },
  ];

  return (
    <ListPageLayout
      title={user?.role === 'SUPER_ADMIN' ? 'DID Number Inventory' : 'Assigned DIDs'}
      subtitle={user?.role === 'SUPER_ADMIN' ? 'Manage global DID phone numbers provider-wise and allocate free numbers to tenants' : 'Manage inbound routing and view allocated DID phone numbers for your organization'}
      eyebrow="TELEPHONY INVENTORY"
      actions={
        user?.role === 'SUPER_ADMIN' ? (
          <Button variant="primary" onClick={() => setShowAddModal(true)} leftIcon={<Plus size={16} />}>
            Add DID to Inventory
          </Button>
        ) : undefined
      }
      filterBar={
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search DID numbers, host or tenant..."
        />
      }
    >
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={loading}
        emptyTitle="No DIDs in inventory"
        actions={(d: any) => (
          user?.role === 'SUPER_ADMIN' ? (
            <Inline gap="2" justify="center" wrap={false}>
              <Button variant="secondary" size="sm" onClick={() => handleEditClick(d)} title="Edit">
                <Edit2 size={14} />
              </Button>
              {d.tenant_id ? (
                <Button variant="secondary" size="sm" onClick={() => handleUnassignDid(d.id)} title="Unassign">
                  <Unlink size={14} />
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={() => setDidToAssign(d)} title="Assign">
                  <Link2 size={14} />
                </Button>
              )}
              <Button variant="danger" size="sm" onClick={() => setDeleteDidId(d.id)} title="Delete">
                <Trash2 size={14} />
              </Button>
            </Inline>
          ) : (
            <Badge variant="success">Provisioned</Badge>
          )
        )}
      />

      {/* ADD DID MODAL */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add DID Number to Inventory"
        subtitle="Import DID from carrier SIP trunk into global pool"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddDid}>Add DID</Button>
          </>
        }
      >
        <Stack gap="4">
          <FormField label="DID Phone Number" required>
            <Input
              value={addForm.did_number}
              onChange={e => setAddForm({...addForm, did_number: e.target.value})}
              placeholder="e.g. +18005550199"
            />
          </FormField>
          <FormField label="Provider SIP Trunk / Gateway">
            <Select
              value={addForm.trunk_id}
              onChange={e => setAddForm({ ...addForm, trunk_id: e.target.value })}
            >
              <option value="">-- Select Host SIP Trunk --</option>
              {trunks.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.host})</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Assign to Tenant (Optional)">
            <Select
              value={addForm.tenant_id}
              onChange={e => setAddForm({ ...addForm, tenant_id: e.target.value })}
            >
              <option value="">-- Free / Unallocated --</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.domain})</option>
              ))}
            </Select>
          </FormField>
        </Stack>
      </Modal>

      {/* EDIT DID MODAL */}
      <Modal
        isOpen={!!editDid}
        onClose={() => setEditDid(null)}
        title="Edit DID & Provider Gateway"
        subtitle="Modify DID properties, change host gateway or tenant allocation"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditDid(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleEditSubmit}>Update DID</Button>
          </>
        }
      >
        <Stack gap="4">
          <FormField label="DID Phone Number" required>
            <Input
              value={editForm.did_number}
              onChange={e => setEditForm({...editForm, did_number: e.target.value})}
            />
          </FormField>
          <FormField label="Provider SIP Trunk / Gateway">
            <Select
              value={editForm.trunk_id}
              onChange={e => setEditForm({ ...editForm, trunk_id: e.target.value })}
            >
              <option value="">-- Select Host SIP Trunk --</option>
              {trunks.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.host})</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Assign to Tenant (Optional)">
            <Select
              value={editForm.tenant_id}
              onChange={e => setEditForm({ ...editForm, tenant_id: e.target.value })}
            >
              <option value="">-- Free / Unallocated --</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.domain})</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Inbound Destination Target">
            <Input
              placeholder="e.g. 1001 or Main IVR"
              value={editForm.destination}
              onChange={e => setEditForm({...editForm, destination: e.target.value})}
            />
          </FormField>
        </Stack>
      </Modal>

      {/* DELETE DID MODAL */}
      <Modal
        isOpen={!!deleteDidId}
        onClose={() => setDeleteDidId(null)}
        title="Delete DID Number"
        subtitle="Are you sure you want to delete this DID from inventory?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteDidId(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>Delete DID</Button>
          </>
        }
      >
        <p>
          Removing this DID will revoke incoming call routing for this number across all tenants.
        </p>
      </Modal>

      {/* ASSIGN DID MODAL */}
      <Modal
        isOpen={!!didToAssign}
        onClose={() => setDidToAssign(null)}
        title="Assign DID to Tenant"
        subtitle={`Assign DID ${didToAssign?.did_number || ''} to a customer domain`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDidToAssign(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleAssignDid}>Assign Number</Button>
          </>
        }
      >
        <FormField label="Target Tenant">
          <Select
            value={selectedTenantId}
            onChange={e => setSelectedTenantId(e.target.value)}
          >
            <option value="">-- Select Tenant --</option>
            {tenants.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.domain})</option>
            ))}
          </Select>
        </FormField>
      </Modal>
    </ListPageLayout>
  );
};
