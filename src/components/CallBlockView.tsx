import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { ShieldAlert, Plus, Edit2, Trash2, Ban, PhoneOff, CheckCircle2 } from 'lucide-react';
import { ListPageLayout } from './layout';
import { Stack, Inline, Grid } from './layout/Stack';
import {
  Button,
  Card,
  Input,
  Select,
  FormField,
  Badge,
  Modal,
  Checkbox,
  Divider,
} from './ui';
import { DataTable, FilterBar } from './patterns';

interface CallBlockViewProps {
  token: string;
  user?: User | null;
}

export const CallBlockView: React.FC<CallBlockViewProps> = ({ token, user }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [blocks, setBlocks] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<any>(null);

  const [formData, setFormData] = useState({
    number: '',
    description: '',
    action: 'reject',
    enabled: true,
    tenant_id: user?.tenant_id || ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [bData, tData] = await Promise.allSettled([
        apiService.getCallBlocks(token),
        apiService.getTenants(token)
      ]);
      if (bData.status === 'fulfilled') setBlocks(bData.value);
      if (tData.status === 'fulfilled') setTenants(tData.value);
    } catch (err) {
      console.error('Failed to load call block list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleOpenCreate = () => {
    setEditingBlock(null);
    setFormData({
      number: '',
      description: '',
      action: 'reject',
      enabled: true,
      tenant_id: user?.tenant_id || (tenants[0]?.id || '')
    });
    setShowModal(true);
  };

  const handleOpenEdit = (b: any) => {
    setEditingBlock(b);
    setFormData({
      number: b.number || '',
      description: b.description || '',
      action: b.action || 'reject',
      enabled: b.enabled !== false,
      tenant_id: b.tenant_id || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        tenant_id: formData.tenant_id || null
      };

      if (editingBlock) {
        await apiService.updateCallBlock(token, editingBlock.id, payload);
        showSuccessModal('Updated', `Rule for ${payload.number} updated`);
      } else {
        await apiService.createCallBlock(token, payload);
        showSuccessModal('Number Blocked', `Added ${payload.number} to blocklist`);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      showErrorModal('Error', err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string, number: string) => {
    if (!confirm(`Remove "${number}" from call block list?`)) return;
    try {
      await apiService.deleteCallBlock(token, id);
      showSuccessModal('Removed', `Unblocked ${number}`);
      loadData();
    } catch (err: any) {
      showErrorModal('Failed', err.message || 'Could not delete entry');
    }
  };

  const filtered = blocks.filter(b =>
    (b.number || '').includes(search) ||
    (b.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      key: 'number',
      header: 'Caller ID Number',
      sortable: true,
      render: (b: any) => (
        <Inline gap="3" align="center">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <Ban size={16} />
          </div>
          <span className="font-mono font-bold text-[var(--pbx-text-primary)]">{b.number}</span>
        </Inline>
      ),
    },
    {
      key: 'description',
      header: 'Description / Reason',
      render: (b: any) => b.description || '—',
    },
    {
      key: 'action',
      header: 'Action on Match',
      render: (b: any) => (
        <Badge variant={b.action === 'reject' ? 'danger' : b.action === 'busy' ? 'warning' : 'neutral'}>
          {b.action === 'reject' ? '603 Decline' : b.action === 'busy' ? '486 Busy' : 'Send Voicemail'}
        </Badge>
      ),
    },
    {
      key: 'enabled',
      header: 'Filter Status',
      render: (b: any) => (
        <Badge variant={b.enabled ? 'success' : 'neutral'}>
          {b.enabled ? 'Active' : 'Disabled'}
        </Badge>
      ),
    },
  ];

  return (
    <ListPageLayout
      title="Call Block (Blacklist)"
      subtitle="Prevent spam, robocalls, and abusive callers from reaching your extensions, queues, or IVR."
      eyebrow="SECURITY & FRAUD PREVENTION"
      actions={
        <Button variant="primary" onClick={handleOpenCreate} leftIcon={<Plus size={16} />}>
          Block Caller ID
        </Button>
      }
      alert={
        <Grid cols={3} gap="4">
          <Card>
            <Inline gap="4" align="center">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <ShieldAlert size={22} />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-[var(--pbx-text-primary)]">{blocks.length}</div>
                <div className="text-xs text-[var(--pbx-text-muted)]">Total Blocked Numbers</div>
              </div>
            </Inline>
          </Card>

          <Card>
            <Inline gap="4" align="center">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-[var(--pbx-text-primary)]">{blocks.filter(b => b.enabled).length}</div>
                <div className="text-xs text-[var(--pbx-text-muted)]">Active Filters</div>
              </div>
            </Inline>
          </Card>

          <Card>
            <Inline gap="4" align="center">
              <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <PhoneOff size={22} />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-[var(--pbx-text-primary)]">{blocks.filter(b => b.action === 'reject').length}</div>
                <div className="text-xs text-[var(--pbx-text-muted)]">Direct Rejection Rules</div>
              </div>
            </Inline>
          </Card>
        </Grid>
      }
      filterBar={
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search number or description..."
          actions={
            <div className="text-xs text-[var(--pbx-text-muted)]">
              Incoming calls matching any blocked number are intercepted before routing
            </div>
          }
        />
      }
    >
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={loading}
        emptyTitle="No blocked caller IDs"
        emptyDescription='Click "Block Caller ID" to blacklist unwanted callers.'
        actions={(b: any) => (
          <Inline gap="2" justify="center" wrap={false}>
            <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(b)} title="Edit">
              <Edit2 size={14} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id, b.number)} title="Delete">
              <Trash2 size={14} className="text-rose-600" />
            </Button>
          </Inline>
        )}
      />

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingBlock ? 'Edit Block Rule' : 'Block Caller ID'}
        subtitle="Prevent incoming calls from specific numbers"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit}>{editingBlock ? 'Update Rule' : 'Save Rule'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="4">
            <FormField label="Phone Number / Caller ID" required>
              <Input
                required
                placeholder="e.g. +18005550199 or 9876543210"
                value={formData.number}
                onChange={e => setFormData({ ...formData, number: e.target.value })}
              />
            </FormField>

            <FormField label="Reason / Description">
              <Input
                placeholder="e.g. Telemarketer spam / robocall"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </FormField>

            <FormField label="Action When Call Received">
              <Select
                value={formData.action}
                onChange={e => setFormData({ ...formData, action: e.target.value })}
              >
                <option value="reject">Decline Immediately (SIP 603)</option>
                <option value="busy">Play Busy Tone (SIP 486)</option>
                <option value="voicemail">Send to General Voicemail</option>
              </Select>
            </FormField>

            <Stack gap="3">
              <Divider />
              <Checkbox
                label="Enable this blocking rule"
                checked={formData.enabled}
                onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
              />
            </Stack>
          </Stack>
        </form>
      </Modal>
    </ListPageLayout>
  );
};
