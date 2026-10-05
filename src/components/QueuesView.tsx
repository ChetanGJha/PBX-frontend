import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import { Users, Plus, Edit2, Trash2 } from 'lucide-react';
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

interface QueuesViewProps {
  token: string;
  user?: User | null;
}

export const QueuesView: React.FC<QueuesViewProps> = ({ token, user }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [queues, setQueues] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingQueue, setEditingQueue] = useState<any>(null);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [agentSearch, setAgentSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    queue_number: '',
    strategy: 'round_robin',
    agent_timeout: 30,
    wrap_up_time: 10,
    max_wait_time: 300,
    tenant_id: user?.tenant_id || ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [qData, tData, extData] = await Promise.allSettled([
        apiService.getQueues(token),
        apiService.getTenants(token),
        apiService.getExtensions(token)
      ]);
      if (qData.status === 'fulfilled') setQueues(qData.value);
      if (tData.status === 'fulfilled') setTenants(tData.value);
      if (extData.status === 'fulfilled') setExtensions(extData.value);
    } catch (err) {
      console.error('Failed to load queues data:', err);
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
    setEditingQueue(null);
    setSelectedAgents([]);
    setAgentSearch('');
    setFormData({
      name: '',
      queue_number: '',
      strategy: 'round_robin',
      agent_timeout: 30,
      wrap_up_time: 10,
      max_wait_time: 300,
      tenant_id: user?.tenant_id || ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (q: any) => {
    setEditingQueue(q);
    const existing = q.agents
      ? q.agents.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];
    setSelectedAgents(existing);
    setAgentSearch('');
    setFormData({
      name: q.name,
      queue_number: q.queue_number,
      strategy: q.strategy || 'round_robin',
      agent_timeout: q.agent_timeout || 30,
      wrap_up_time: q.wrap_up_time || 10,
      max_wait_time: q.max_wait_time || 300,
      tenant_id: q.tenant_id || user?.tenant_id || ''
    });
    setShowModal(true);
  };

  const toggleAgent = (extNum: string) => {
    setSelectedAgents(prev =>
      prev.includes(extNum) ? prev.filter(x => x !== extNum) : [...prev, extNum]
    );
  };

  const handleSelectAllAgents = () => {
    const all = tenantExtensions.map(e => e.extension_number);
    setSelectedAgents(all);
  };

  const handleClearAllAgents = () => {
    setSelectedAgents([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        ...formData,
        agents: selectedAgents.join(', ')
      };

      if (user?.role !== 'SUPER_ADMIN' && user?.tenant_id) {
        payload.tenant_id = user.tenant_id;
      } else if (!payload.tenant_id) {
        delete payload.tenant_id;
      }

      if (editingQueue) {
        await apiService.updateQueue(token, editingQueue.id, payload);
        showSuccessModal(
          'Queue Updated Successfully',
          `Call queue "${formData.name}" (ext/${formData.queue_number}) has been updated.`
        );
      } else {
        await apiService.createQueue(token, payload);
        showSuccessModal(
          'Queue Created Successfully',
          `Call queue "${formData.name}" (ext/${formData.queue_number}) has been configured with ${selectedAgents.length} assigned member agent(s).`
        );
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      showErrorModal('Queue Operation Failed', err.message || 'Failed to save call queue');
    }
  };

  const handleDelete = async (q: any) => {
    if (!window.confirm(`Delete call queue "${q.name}" (${q.queue_number})?`)) return;
    try {
      await apiService.deleteQueue(token, q.id);
      showSuccessModal(
        'Queue Deleted',
        `Call queue "${q.name}" has been deleted.`
      );
      loadData();
    } catch (err: any) {
      showErrorModal('Failed to Delete Queue', err.message || 'Could not delete queue');
    }
  };

  const filtered = queues.filter(q =>
    (q.name && q.name.toLowerCase().includes(search.toLowerCase())) ||
    (q.queue_number && q.queue_number.includes(search))
  );

  const filteredExtensions = tenantExtensions.filter(ext =>
    ext.extension_number.includes(agentSearch) ||
    (ext.display_name && ext.display_name.toLowerCase().includes(agentSearch.toLowerCase()))
  );

  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'TENANT_ADMIN';

  const columns = [
    {
      key: 'name',
      header: 'Queue Name',
      sortable: true,
      render: (q: any) => (
        <Inline gap="2">
          <Users size={16} />
          <strong>{q.name}</strong>
        </Inline>
      ),
    },
    {
      key: 'queue_number',
      header: 'Queue Number',
      render: (q: any) => <code>{q.queue_number}</code>,
    },
    {
      key: 'strategy',
      header: 'Ring Strategy',
      render: (q: any) => <Badge variant="warning">{q.strategy.replace('_', ' ').toUpperCase()}</Badge>,
    },
    {
      key: 'agents',
      header: 'Assigned Agent Members',
      render: (q: any) => {
        const agentList = q.agents
          ? q.agents.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [];
        if (agentList.length === 0) return 'No members';
        return (
          <Inline gap="1">
            <Badge variant="neutral">{agentList.length} Agents</Badge>
            {agentList.slice(0, 3).map((ag: string) => (
              <Badge key={ag} variant="neutral">{ag}</Badge>
            ))}
          </Inline>
        );
      },
    },
    {
      key: 'timeouts',
      header: 'Timeouts (Ring/Wait)',
      render: (q: any) => `Ring: ${q.agent_timeout}s / Max Wait: ${q.max_wait_time}s`,
    },
    ...(user?.role === 'SUPER_ADMIN' ? [{
      key: 'tenant_name',
      header: 'Tenant',
      render: (q: any) => <Badge variant="success">{q.tenant_name || 'Global'}</Badge>,
    }] : []),
  ];

  return (
    <ListPageLayout
      title="Call Queues"
      subtitle="Configure call distribution tiers, ring strategies, and multi-select agent extensions"
      eyebrow="AUTOMATIC CALL DISTRIBUTION (ACD)"
      actions={
        canManage ? (
          <Button variant="primary" onClick={handleOpenCreate} leftIcon={<Plus size={16} />}>
            Add Call Queue
          </Button>
        ) : undefined
      }
      filterBar={
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search queues..."
        />
      }
    >

        <DataTable
          columns={columns}
          data={filtered}
          isLoading={loading}
          emptyTitle="No call queues configured"
          actions={canManage ? (q: any) => (
            <Inline gap="2" justify="flex-end">
              <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(q)} leftIcon={<Edit2 size={12} />}>
                Edit
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(q)} leftIcon={<Trash2 size={12} />}>
                Delete
              </Button>
            </Inline>
          ) : undefined}
        />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingQueue ? 'Edit Call Queue' : 'Create Call Queue'}
        subtitle="Configure queue number, ring strategy, and multi-select member extensions"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editingQueue ? 'Update Queue' : 'Create Queue'}
            </Button>
          </>
        }
      >
        <Stack gap="4">
          <Grid cols={2} gap="4">
            <FormField label="Queue Name" required>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sales Tier 1 Queue"
              />
            </FormField>
            <FormField label="Queue Extension Number" required>
              <Input
                value={formData.queue_number}
                onChange={e => setFormData({ ...formData, queue_number: e.target.value })}
                placeholder="e.g. 7001"
              />
            </FormField>
            <FormField label="Ring Strategy" required>
              <Select
                value={formData.strategy}
                onChange={e => setFormData({ ...formData, strategy: e.target.value })}
              >
                <option value="round_robin">Round Robin (Sequential)</option>
                <option value="ring_all">Ring All Available</option>
                <option value="longest_idle_agent">Longest Idle Agent</option>
                <option value="least_talk_time">Least Talk Time</option>
              </Select>
            </FormField>
            <FormField label="Agent Ring Timeout (sec)">
              <Input
                type="number"
                value={String(formData.agent_timeout)}
                onChange={e => setFormData({ ...formData, agent_timeout: parseInt(e.target.value) || 30 })}
              />
            </FormField>
            <FormField label="Max Queue Wait Time (sec)">
              <Input
                type="number"
                value={String(formData.max_wait_time)}
                onChange={e => setFormData({ ...formData, max_wait_time: parseInt(e.target.value) || 300 })}
              />
            </FormField>
            <FormField label="Wrap-Up Time (sec)">
              <Input
                type="number"
                value={String(formData.wrap_up_time)}
                onChange={e => setFormData({ ...formData, wrap_up_time: parseInt(e.target.value) || 10 })}
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

          <FormField label={`Assigned Member Extensions (${selectedAgents.length} selected)`}>
            <Stack gap="3">
              <Inline gap="2">
                <Button variant="ghost" size="sm" onClick={handleSelectAllAgents}>Select All</Button>
                <Button variant="ghost" size="sm" onClick={handleClearAllAgents}>Clear</Button>
                <Input
                  value={agentSearch}
                  onChange={e => setAgentSearch(e.target.value)}
                  placeholder="Filter extensions..."
                />
              </Inline>
              <Grid cols={2} gap="2">
                {filteredExtensions.map(ext => {
                  const isChecked = selectedAgents.includes(ext.extension_number);
                  return (
                    <Checkbox
                      key={ext.id || ext.extension_number}
                      label={`ext/${ext.extension_number} ${ext.display_name ? `(${ext.display_name})` : ''}`}
                      checked={isChecked}
                      onChange={() => toggleAgent(ext.extension_number)}
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
