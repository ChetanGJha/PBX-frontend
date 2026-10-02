import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Users2, Plus, Edit2, Trash2, Lock, Mic, CheckCircle2 } from 'lucide-react';
import { PageContainer } from './layout/PageContainer';
import { Stack, Inline, Grid } from './layout/Stack';
import {
  Button,
  Card,
  Input,
  FormField,
  Badge,
  Modal,
  Checkbox
} from './ui';
import { DataTable, FilterBar } from './patterns';

interface ConferencesViewProps {
  token: string;
  user?: User | null;
}

export const ConferencesView: React.FC<ConferencesViewProps> = ({ token, user }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [conferences, setConferences] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingConf, setEditingConf] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    extension_number: '',
    pin: '',
    moderator_pin: '',
    max_members: 50,
    record_conference: false,
    wait_for_moderator: false,
    announce_join_leave: true,
    enabled: true,
    tenant_id: user?.tenant_id || ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [cData, tData] = await Promise.allSettled([
        apiService.getConferences(token),
        apiService.getTenants(token)
      ]);
      if (cData.status === 'fulfilled') setConferences(cData.value);
      if (tData.status === 'fulfilled') setTenants(tData.value);
    } catch (err) {
      console.error('Failed to load conferences:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleOpenCreate = () => {
    setEditingConf(null);
    setFormData({
      name: '',
      extension_number: '3001',
      pin: '',
      moderator_pin: '',
      max_members: 50,
      record_conference: false,
      wait_for_moderator: false,
      announce_join_leave: true,
      enabled: true,
      tenant_id: user?.tenant_id || (tenants[0]?.id || '')
    });
    setShowModal(true);
  };

  const handleOpenEdit = (c: any) => {
    setEditingConf(c);
    setFormData({
      name: c.name || '',
      extension_number: c.extension_number || '',
      pin: c.pin || '',
      moderator_pin: c.moderator_pin || '',
      max_members: c.max_members || 50,
      record_conference: !!c.record_conference,
      wait_for_moderator: !!c.wait_for_moderator,
      announce_join_leave: !!c.announce_join_leave,
      enabled: c.enabled !== false,
      tenant_id: c.tenant_id || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        max_members: Number(formData.max_members) || 50,
        tenant_id: formData.tenant_id || null,
        pin: formData.pin || null,
        moderator_pin: formData.moderator_pin || null,
      };

      if (editingConf) {
        await apiService.updateConference(token, editingConf.id, payload);
        showSuccessModal('Conference Updated', `Room ${payload.extension_number} updated successfully`);
      } else {
        await apiService.createConference(token, payload);
        showSuccessModal('Conference Created', `Room ${payload.extension_number} created successfully`);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      showErrorModal('Error', err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete conference room "${name}"?`)) return;
    try {
      await apiService.deleteConference(token, id);
      showSuccessModal('Conference Deleted', `Room "${name}" removed successfully`);
      loadData();
    } catch (err: any) {
      showErrorModal('Delete Failed', err.message || 'Could not delete room');
    }
  };

  const filtered = conferences.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.extension_number || '').includes(search)
  );

  const columns = [
    {
      key: 'name',
      header: 'Room Name',
      sortable: true,
      render: (c: any) => (
        <Inline gap="3" align="center">
          <div className="w-8 h-8 rounded-lg bg-[var(--pbx-accent-light)] text-[var(--pbx-accent-primary)] flex items-center justify-center">
            <Users2 size={16} />
          </div>
          <div>
            <div className="font-bold text-[var(--pbx-text-primary)]">{c.name}</div>
            {c.tenant_name && <div className="text-xs text-[var(--pbx-text-muted)]">{c.tenant_name}</div>}
          </div>
        </Inline>
      ),
    },
    {
      key: 'extension_number',
      header: 'Extension',
      render: (c: any) => <span className="font-mono font-bold text-[var(--pbx-accent-primary)]">{c.extension_number}</span>,
    },
    {
      key: 'pin',
      header: 'PIN Security',
      render: (c: any) => (
        c.pin ? (
          <Badge variant="warning">
            <Lock size={12} /> PIN: {c.pin}
          </Badge>
        ) : (
          <span className="text-xs text-[var(--pbx-text-muted)]">Open (No PIN)</span>
        )
      ),
    },
    {
      key: 'max_members',
      header: 'Max Members',
      render: (c: any) => `${c.max_members} max`,
    },
    {
      key: 'record_conference',
      header: 'Recording',
      render: (c: any) => (
        c.record_conference ? (
          <Badge variant="danger">Enabled</Badge>
        ) : (
          <span className="text-xs text-[var(--pbx-text-muted)]">Disabled</span>
        )
      ),
    },
    {
      key: 'enabled',
      header: 'Status',
      render: (c: any) => (
        <Badge variant={c.enabled ? 'success' : 'neutral'}>
          {c.enabled ? 'Active' : 'Disabled'}
        </Badge>
      ),
    },
  ];

  return (
    <PageContainer
      title="Conference Rooms"
      subtitle="Host HD multi-party audio conferences with PIN security, recording, and moderation."
      eyebrow="Conferencing & Collaboration"
      actions={
        <Button variant="primary" onClick={handleOpenCreate} leftIcon={<Plus size={16} />}>
          Create Conference Room
        </Button>
      }
    >
      <Stack gap="6">
        {/* Stats */}
        <Grid cols={3} gap="4">
          <Card>
            <Inline gap="4" align="center">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users2 size={22} />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-[var(--pbx-text-primary)]">{conferences.length}</div>
                <div className="text-xs text-[var(--pbx-text-muted)]">Total Conference Rooms</div>
              </div>
            </Inline>
          </Card>

          <Card>
            <Inline gap="4" align="center">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-[var(--pbx-text-primary)]">{conferences.filter(c => c.enabled).length}</div>
                <div className="text-xs text-[var(--pbx-text-muted)]">Active Rooms</div>
              </div>
            </Inline>
          </Card>

          <Card>
            <Inline gap="4" align="center">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Mic size={22} />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-[var(--pbx-text-primary)]">{conferences.filter(c => c.record_conference).length}</div>
                <div className="text-xs text-[var(--pbx-text-muted)]">Auto-Recorded Rooms</div>
              </div>
            </Inline>
          </Card>
        </Grid>

        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search conference rooms or extension..."
          actions={
            <div className="text-xs text-[var(--pbx-text-muted)]">
              Dial <span className="font-mono font-bold text-[var(--pbx-text-primary)]">3000-3999</span> from any extension to join
            </div>
          }
        />

        <DataTable
          columns={columns}
          data={filtered}
          isLoading={loading}
          emptyTitle="No conference rooms configured"
          emptyDescription='Click "Create Conference Room" to set up your first room.'
          actions={(c: any) => (
            <Inline gap="2" justify="center" wrap={false}>
              <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(c)} title="Edit">
                <Edit2 size={14} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id, c.name)} title="Delete">
                <Trash2 size={14} className="text-rose-600" />
              </Button>
            </Inline>
          )}
        />
      </Stack>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingConf ? 'Edit Conference Room' : 'Create Conference Room'}
        subtitle="Configure extension number, access PINs, and audio settings"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit}>{editingConf ? 'Update Room' : 'Create Room'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="4">
            <FormField label="Room Name" required>
              <Input
                required
                placeholder="e.g. Sales Team Conference"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </FormField>

            <Grid cols={2} gap="4">
              <FormField label="Extension Number (3000-3999)" required>
                <Input
                  required
                  placeholder="3001"
                  value={formData.extension_number}
                  onChange={e => setFormData({ ...formData, extension_number: e.target.value })}
                />
              </FormField>
              <FormField label="Max Members">
                <Input
                  type="number"
                  min={2}
                  max={300}
                  value={String(formData.max_members)}
                  onChange={e => setFormData({ ...formData, max_members: Number(e.target.value) })}
                />
              </FormField>
            </Grid>

            <Grid cols={2} gap="4">
              <FormField label="Participant PIN (Optional)">
                <Input
                  placeholder="e.g. 1234"
                  value={formData.pin}
                  onChange={e => setFormData({ ...formData, pin: e.target.value })}
                />
              </FormField>
              <FormField label="Moderator PIN (Optional)">
                <Input
                  placeholder="e.g. 9876"
                  value={formData.moderator_pin}
                  onChange={e => setFormData({ ...formData, moderator_pin: e.target.value })}
                />
              </FormField>
            </Grid>

            <Stack gap="3" className="pt-3 border-t border-[var(--pbx-border)]">
              <Checkbox
                label="Automatically record this conference"
                checked={formData.record_conference}
                onChange={e => setFormData({ ...formData, record_conference: e.target.checked })}
              />
              <Checkbox
                label="Play chime when participants join or leave"
                checked={formData.announce_join_leave}
                onChange={e => setFormData({ ...formData, announce_join_leave: e.target.checked })}
              />
            </Stack>
          </Stack>
        </form>
      </Modal>
    </PageContainer>
  );
};
