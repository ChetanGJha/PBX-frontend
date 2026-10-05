import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import { PhoneForwarded, Plus, Edit2, Trash2 } from 'lucide-react';
import { ListPageLayout } from './layout';
import { Stack, Inline, Grid } from './layout/Stack';
import {
  Button,
  Input,
  Select,
  FormField,
  Modal,
  Badge,
  Checkbox,
} from './ui';
import { DataTable, FilterBar } from './patterns';

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

  const columns = [
    {
      key: 'name',
      header: 'Group Name',
      sortable: true,
      render: (hg: any) => (
        <Inline gap="2">
          <PhoneForwarded size={16} />
          <strong>{hg.name}</strong>
        </Inline>
      ),
    },
    {
      key: 'extension_number',
      header: 'Extension',
      render: (hg: any) => <code>{hg.extension_number}</code>,
    },
    {
      key: 'strategy',
      header: 'Hunt Strategy',
      render: (hg: any) => <Badge variant="warning">{hg.strategy.toUpperCase()}</Badge>,
    },
    {
      key: 'timeout',
      header: 'Timeout',
      render: (hg: any) => `${hg.timeout}s`,
    },
    {
      key: 'members',
      header: 'Member Extensions',
      render: (hg: any) => {
        const memberList = hg.members
          ? hg.members.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [];
        if (memberList.length === 0) return 'No members';
        return (
          <Inline gap="1">
            <Badge variant="neutral">{memberList.length} Members</Badge>
            {memberList.slice(0, 3).map((m: string) => (
              <Badge key={m} variant="neutral">{m}</Badge>
            ))}
          </Inline>
        );
      },
    },
    ...(user?.role === 'SUPER_ADMIN' ? [{
      key: 'tenant_name',
      header: 'Tenant',
      render: (hg: any) => <Badge variant="success">{hg.tenant_name || 'Global'}</Badge>,
    }] : []),
  ];

  return (
    <ListPageLayout
      title="Hunt Groups"
      subtitle="Configure sequential, simultaneous, and circular ring hunting groups"
      eyebrow="MOD_HUNTGROUP"
      actions={
        canManage ? (
          <Button variant="primary" onClick={handleOpenCreate} leftIcon={<Plus size={16} />}>
            Create Hunt Group
          </Button>
        ) : undefined
      }
      filterBar={
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search hunt groups..."
        />
      }
    >

        <DataTable
          columns={columns}
          data={filtered}
          isLoading={loading}
          emptyTitle="No hunt groups configured yet"
          actions={canManage ? (hg: any) => (
            <Inline gap="2" justify="flex-end">
              <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(hg)} leftIcon={<Edit2 size={12} />}>
                Edit
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(hg)} leftIcon={<Trash2 size={12} />}>
                Delete
              </Button>
            </Inline>
          ) : undefined}
        />

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingGroup ? 'Edit Hunt Group' : 'Create Hunt Group'}
        subtitle="Configure hunting extension, strategy, and multi-select member extensions"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editingGroup ? 'Update Hunt Group' : 'Save Hunt Group'}
            </Button>
          </>
        }
      >
        <Stack gap="4">
          <Grid cols={2} gap="4">
            <FormField label="Group Name" required>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sales Ring Group"
              />
            </FormField>
            <FormField label="Group Extension Number" required>
              <Input
                value={formData.extension_number}
                onChange={e => setFormData({ ...formData, extension_number: e.target.value })}
                placeholder="e.g. 8001"
              />
            </FormField>
            <FormField label="Hunting Strategy" required>
              <Select
                value={formData.strategy}
                onChange={e => setFormData({ ...formData, strategy: e.target.value })}
              >
                <option value="sequential">Sequential (Priority Order)</option>
                <option value="simultaneous">Simultaneous (Ring All)</option>
                <option value="circular">Circular / Round Robin</option>
              </Select>
            </FormField>
            <FormField label="Ring Timeout per Member (sec)">
              <Input
                type="number"
                value={String(formData.timeout)}
                onChange={e => setFormData({ ...formData, timeout: parseInt(e.target.value) || 20 })}
              />
            </FormField>
          </Grid>

          {user?.role === 'SUPER_ADMIN' && (
            <FormField label="Target Tenant (Optional)">
              <Select
                value={formData.tenant_id}
                onChange={e => setFormData({ ...formData, tenant_id: e.target.value })}
              >
                <option value="">-- Global / Select Tenant --</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.domain})</option>
                ))}
              </Select>
            </FormField>
          )}

          <FormField label={`Assigned Member Extensions (${selectedMembers.length} selected)`}>
            <Stack gap="3">
              <Inline gap="2">
                <Button variant="ghost" size="sm" onClick={handleSelectAll}>Select All</Button>
                <Button variant="ghost" size="sm" onClick={handleClearAll}>Clear</Button>
                <Input
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  placeholder="Filter extensions..."
                />
              </Inline>
              <Grid cols={2} gap="2">
                {filteredExtensions.map(ext => {
                  const isChecked = selectedMembers.includes(ext.extension_number);
                  return (
                    <Checkbox
                      key={ext.id || ext.extension_number}
                      label={`ext/${ext.extension_number} ${ext.display_name ? `(${ext.display_name})` : ''}`}
                      checked={isChecked}
                      onChange={() => toggleMember(ext.extension_number)}
                    />
                  );
                })}
              </Grid>
            </Stack>
          </FormField>
        </Stack>
      </Modal>
    </ListPageLayout>
  );
};
