import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import {
  Users2,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Mic,
  Radio,
  PhoneOff,
  Copy,
  Check,
  RefreshCw,
  UserCheck
} from 'lucide-react';
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

interface ConferencesViewProps {
  token: string;
  user?: User | null;
}

export const ConferencesView: React.FC<ConferencesViewProps> = ({ token, user }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [conferences, setConferences] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [liveConfs, setLiveConfs] = useState<Record<string, any>>({});
  const [selectedTenantFilter, setSelectedTenantFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshingLive, setRefreshingLive] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingConf, setEditingConf] = useState<any>(null);
  const [liveModalConf, setLiveModalConf] = useState<any>(null);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);

  // Email Invitation State
  const [selectedInviteConfId, setSelectedInviteConfId] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    extension_number: '',
    pin: '',
    moderator_pin: '',
    max_members: 50,
    record_conference: false,
    wait_for_moderator: true,
    announce_join_leave: true,
    enabled: true,
    tenant_id: user?.tenant_id || ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [cData, tData, lData] = await Promise.allSettled([
        apiService.getConferences(token),
        apiService.getTenants(token),
        apiService.getLiveConferences(token)
      ]);

      let confList: any[] = [];
      if (cData.status === 'fulfilled') {
        confList = cData.value;
        setConferences(confList);
        if (!selectedInviteConfId && confList.length > 0) {
          setSelectedInviteConfId(confList[0].id);
        }
      }

      if (tData.status === 'fulfilled') {
        setTenants(tData.value);
      }

      if (lData.status === 'fulfilled') {
        const liveMap: Record<string, any> = {};
        for (const item of lData.value) {
          liveMap[item.id] = item.live;
        }
        setLiveConfs(liveMap);
      }
    } catch (err) {
      console.error('Failed to load conferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshLive = async () => {
    try {
      setRefreshingLive(true);
      const liveData = await apiService.getLiveConferences(token);
      const liveMap: Record<string, any> = {};
      for (const item of liveData) {
        liveMap[item.id] = item.live;
      }
      setLiveConfs(liveMap);

      if (liveModalConf && liveMap[liveModalConf.id]) {
        setLiveModalConf((prev: any) => ({
          ...prev,
          live: liveMap[prev.id]
        }));
      }
    } catch (e) {
      console.error('Failed to refresh live conference telemetry', e);
    } finally {
      setRefreshingLive(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Periodic telemetry refresh for live conferences
  useEffect(() => {
    const interval = setInterval(() => {
      refreshLive();
    }, 6000);
    return () => clearInterval(interval);
  }, [token, liveModalConf?.id]);

  const handleOpenCreate = () => {
    setEditingConf(null);
    setFormData({
      name: '',
      extension_number: '3001',
      pin: '',
      moderator_pin: '',
      max_members: 50,
      record_conference: false,
      wait_for_moderator: true,
      announce_join_leave: true,
      enabled: true,
      tenant_id: user?.role === 'SUPER_ADMIN' ? (selectedTenantFilter || (tenants[0]?.id || '')) : (user?.tenant_id || '')
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
      wait_for_moderator: c.wait_for_moderator !== false,
      announce_join_leave: !!c.announce_join_leave,
      enabled: c.enabled !== false,
      tenant_id: c.tenant_id || (user?.role === 'SUPER_ADMIN' ? (tenants[0]?.id || '') : '')
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
        setSelectedInviteConfId(editingConf.id);
      } else {
        const created = await apiService.createConference(token, payload);
        showSuccessModal('Conference Created', `Room ${payload.extension_number} created successfully`);
        if (created?.id) {
          setSelectedInviteConfId(created.id);
        }
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

  const handleTerminateConference = async (conf: any) => {
    if (!confirm(`Are you sure you want to disconnect/cancel conference "${conf.name}"? This will immediately disconnect all active calls in the room.`)) {
      return;
    }
    try {
      setTerminatingId(conf.id);
      await apiService.terminateConference(token, conf.id);
      showSuccessModal('Conference Terminated', `Active calls in "${conf.name}" have been disconnected.`);
      if (liveModalConf?.id === conf.id) {
        setLiveModalConf(null);
      }
      await refreshLive();
    } catch (err: any) {
      showErrorModal('Cancel Failed', err.message || 'Failed to cancel conference');
    } finally {
      setTerminatingId(null);
    }
  };

  const handleKickParticipant = async (confId: string, memberId: string) => {
    if (!confirm(`Disconnect participant #${memberId} from the conference?`)) return;
    try {
      await apiService.kickConferenceMember(token, confId, memberId);
      showSuccessModal('Participant Disconnected', `Participant #${memberId} has been dropped from the call.`);
      await refreshLive();
    } catch (err: any) {
      showErrorModal('Drop Failed', err.message || 'Failed to drop participant');
    }
  };

  const selectedInviteConf = conferences.find(c => c.id === selectedInviteConfId) || conferences[0];

  const getInviteEmailText = (conf: any) => {
    if (!conf) return '';
    const roomName = conf.name || 'Conference Call';
    const ext = conf.extension_number || '3000';
    const partPin = conf.pin ? conf.pin : 'None (Open Bridge)';
    const modPin = conf.moderator_pin ? conf.moderator_pin : 'None';
    const tenantName = conf.tenant_name || user?.tenant_domain || 'PBX Telephony System';

    return `Subject: Invitation: Conference Call - ${roomName}

Dear Participant,

You are invited to join the upcoming conference call for "${roomName}".

CONFERENCE DETAILS
------------------------------------------------------------------------
• Conference Name : ${roomName}
• Extension Number: ${ext}
• Participant PIN : ${partPin}
• Moderator PIN   : ${modPin} (Host Only)
• Security Rule   : Participants will join once the moderator is present.
------------------------------------------------------------------------

HOW TO JOIN
1. Dial your PBX phone access number or extension ${ext}.
2. When prompted, enter your Conference PIN followed by the # key.
3. The system will announce your participant number and connect your audio.

Please join a few minutes early to ensure your audio equipment is configured properly.

Best regards,
${tenantName} Telephony Bridge`;
  };

  const handleCopyInvite = () => {
    if (!selectedInviteConf) return;
    const text = getInviteEmailText(selectedInviteConf);
    navigator.clipboard.writeText(text);
    setCopied(true);
    showSuccessModal('Copied to Clipboard', 'The conference invitation template has been copied to your clipboard.');
    setTimeout(() => setCopied(false), 3000);
  };

  const filtered = conferences.filter(c => {
    const matchesSearch =
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.extension_number || '').includes(search);
    const matchesTenant = !selectedTenantFilter || c.tenant_id === selectedTenantFilter;
    return matchesSearch && matchesTenant;
  });

  const columns = [
    ...(user?.role === 'SUPER_ADMIN' ? [{
      key: 'tenant_name',
      header: 'Tenant Organization',
      render: (c: any) => (
        <Badge variant="neutral">
          {c.tenant_name || tenants.find(t => t.id === c.tenant_id)?.name || 'Default / Global'}
        </Badge>
      )
    }] : []),
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
      key: 'live_status',
      header: 'Live Status',
      render: (c: any) => {
        const live = liveConfs[c.id];
        if (live?.active) {
          return (
            <Inline gap="2" align="center">
              <Badge variant="success">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block mr-1"></span>
                Active ({live.member_count} {live.member_count === 1 ? 'caller' : 'callers'})
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLiveModalConf({ ...c, live })}
                title="View active participants"
              >
                <Radio size={14} className="text-emerald-600 animate-pulse" />
              </Button>
            </Inline>
          );
        }
        return (
          <Badge variant="neutral">
            Idle
          </Badge>
        );
      }
    },
    {
      key: 'pin',
      header: 'Access PINs',
      render: (c: any) => (
        <div className="flex flex-col gap-1">
          {c.pin ? (
            <Badge variant="warning">
              <Lock size={11} className="mr-1" /> Part: {c.pin}
            </Badge>
          ) : (
            <span className="text-xs text-[var(--pbx-text-muted)]">Part: Open</span>
          )}
          {c.moderator_pin && (
            <Badge variant="info">
              <UserCheck size={11} className="mr-1" /> Mod: {c.moderator_pin}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'moderator_rule',
      header: 'Moderator Rule',
      render: (c: any) => (
        c.wait_for_moderator !== false || c.moderator_pin ? (
          <Badge variant="primary">Required to Start</Badge>
        ) : (
          <span className="text-xs text-[var(--pbx-text-muted)]">Open Access</span>
        )
      )
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
    <ListPageLayout
      title="Conference Bridges & Collaboration"
      subtitle="Host HD multi-party audio conferences with live moderator control, participant counting, and instant invitations."
      eyebrow="CONFERENCING & COLLABORATION"
      actions={
        <Inline gap="3">
          <Button
            variant="secondary"
            onClick={refreshLive}
            isLoading={refreshingLive}
            leftIcon={<RefreshCw size={14} />}
          >
            Refresh Telemetry
          </Button>
          <Button variant="primary" onClick={handleOpenCreate} leftIcon={<Plus size={16} />}>
            Create Conference Room
          </Button>
        </Inline>
      }
      alert={
        <Grid cols={3} gap="4">
          <Card>
            <Inline gap="4" align="center">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users2 size={22} />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-[var(--pbx-text-primary)]">{conferences.length}</div>
                <div className="text-xs text-[var(--pbx-text-muted)]">Total Configured Rooms</div>
              </div>
            </Inline>
          </Card>

          <Card>
            <Inline gap="4" align="center">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Radio size={22} className={Object.values(liveConfs).some(l => l?.active) ? "animate-pulse" : ""} />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-[var(--pbx-text-primary)]">
                  {Object.values(liveConfs).filter(l => l?.active).length}
                </div>
                <div className="text-xs text-[var(--pbx-text-muted)]">Conferences in Progress</div>
              </div>
            </Inline>
          </Card>

          <Card>
            <Inline gap="4" align="center">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Mic size={22} />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-[var(--pbx-text-primary)]">
                  {conferences.filter(c => c.record_conference).length}
                </div>
                <div className="text-xs text-[var(--pbx-text-muted)]">Auto-Recorded Rooms</div>
              </div>
            </Inline>
          </Card>
        </Grid>
      }
      filterBar={
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search conference rooms or extension..."
          actions={
            <Inline gap="3" align="center">
              {user?.role === 'SUPER_ADMIN' && tenants.length > 0 && (
                <div className="w-56">
                  <Select
                    value={selectedTenantFilter}
                    onChange={e => setSelectedTenantFilter(e.target.value)}
                  >
                    <option value="">All Tenants</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </Select>
                </div>
              )}
              <div className="text-xs text-[var(--pbx-text-muted)]">
                Dial <span className="font-mono font-bold text-[var(--pbx-text-primary)]">3000-3999</span> to join
              </div>
            </Inline>
          }
        />
      }
    >
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={loading}
        emptyTitle="No conference rooms configured"
        emptyDescription='Click "Create Conference Room" to set up your first room.'
        actions={(c: any) => {
          const live = liveConfs[c.id];
          return (
            <Inline gap="2" justify="center" wrap={false}>
              {live?.active && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleTerminateConference(c)}
                  title="Disconnect & Cancel Live Conference"
                  isLoading={terminatingId === c.id}
                >
                  <PhoneOff size={14} />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(c)} title="Edit">
                <Edit2 size={14} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id, c.name)} title="Delete">
                <Trash2 size={14} className="text-rose-600" />
              </Button>
            </Inline>
          );
        }}
      />

      {/* ── Conference Invitation Division ── */}
      <div className="mt-8">
        <Card>
          <Stack gap="4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--pbx-border-subtle)] pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--pbx-accent-primary)]">
                  PARTICIPANT INVITATION DETAILS
                </span>
                <h3 className="text-lg font-bold text-[var(--pbx-text-primary)]">
                  Conference Email Invitation Template
                </h3>
                <p className="text-xs text-[var(--pbx-text-muted)]">
                  Copy formatted invitation instructions to send via email to meeting attendees.
                </p>
              </div>

              {conferences.length > 0 && (
                <div className="w-72">
                  <FormField label="Selected Conference Room">
                    <Select
                      value={selectedInviteConfId}
                      onChange={e => setSelectedInviteConfId(e.target.value)}
                    >
                      {conferences.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} (Ext {c.extension_number})
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>
              )}
            </div>

            {selectedInviteConf ? (
              <Stack gap="3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[var(--pbx-surface-subtle)] p-3 rounded-lg border border-[var(--pbx-border-subtle)] text-xs">
                  <div>
                    <span className="text-[var(--pbx-text-muted)] block">Conference:</span>
                    <strong className="text-[var(--pbx-text-primary)] font-semibold">{selectedInviteConf.name}</strong>
                  </div>
                  <div>
                    <span className="text-[var(--pbx-text-muted)] block">Extension:</span>
                    <strong className="font-mono text-[var(--pbx-accent-primary)] font-bold">{selectedInviteConf.extension_number}</strong>
                  </div>
                  <div>
                    <span className="text-[var(--pbx-text-muted)] block">Participant PIN:</span>
                    <strong className="font-mono text-[var(--pbx-text-primary)]">{selectedInviteConf.pin || 'None (Open)'}</strong>
                  </div>
                  <div>
                    <span className="text-[var(--pbx-text-muted)] block">Moderator PIN (Host):</span>
                    <strong className="font-mono text-amber-600">{selectedInviteConf.moderator_pin || 'None'}</strong>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    readOnly
                    rows={12}
                    value={getInviteEmailText(selectedInviteConf)}
                    className="w-full font-mono text-xs p-4 rounded-xl border border-[var(--pbx-border-default)] bg-[var(--pbx-surface-card)] text-[var(--pbx-text-primary)] shadow-inner resize-none focus:outline-none focus:ring-1 focus:ring-[var(--pbx-accent-primary)] select-all"
                  />
                  <div className="absolute top-3 right-3">
                    <Button
                      variant={copied ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={handleCopyInvite}
                      leftIcon={copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    >
                      {copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}
                    </Button>
                  </div>
                </div>
              </Stack>
            ) : (
              <div className="text-center py-6 text-xs text-[var(--pbx-text-muted)]">
                Create a conference room above to generate the email invitation template.
              </div>
            )}
          </Stack>
        </Card>
      </div>

      {/* ── Live Call Control Modal ── */}
      <Modal
        isOpen={!!liveModalConf}
        onClose={() => setLiveModalConf(null)}
        title={`Live Conference Room: ${liveModalConf?.name} (Ext ${liveModalConf?.extension_number})`}
        subtitle="Real-time participant directory & tenant admin moderation controls"
        footer={
          <div className="w-full flex items-center justify-between">
            <Button variant="secondary" onClick={() => setLiveModalConf(null)}>
              Close Monitor
            </Button>
            {liveModalConf?.live?.active && (
              <Button
                variant="danger"
                onClick={() => handleTerminateConference(liveModalConf)}
                isLoading={terminatingId === liveModalConf.id}
                leftIcon={<PhoneOff size={16} />}
              >
                Cancel & Disconnect Conference
              </Button>
            )}
          </div>
        }
      >
        <Stack gap="4">
          <div className="grid grid-cols-2 gap-3 bg-[var(--pbx-surface-subtle)] p-3 rounded-lg border border-[var(--pbx-border-subtle)] text-xs">
            <div>
              <span className="text-[var(--pbx-text-muted)] block">Active Callers:</span>
              <strong className="text-emerald-600 font-bold text-sm">
                {liveModalConf?.live?.member_count || 0} participants connected
              </strong>
            </div>
            <div>
              <span className="text-[var(--pbx-text-muted)] block">Moderator Status:</span>
              {liveModalConf?.live?.has_moderator ? (
                <Badge variant="success">Moderator Present</Badge>
              ) : (
                <Badge variant="warning">No Moderator in Room</Badge>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase text-[var(--pbx-text-muted)] mb-2">Connected Participants</h4>
            {liveModalConf?.live?.members && liveModalConf.live.members.length > 0 ? (
              <div className="divide-y divide-[var(--pbx-border-subtle)] border border-[var(--pbx-border-subtle)] rounded-lg overflow-hidden">
                {liveModalConf.live.members.map((m: any) => (
                  <div key={m.id} className="p-3 flex items-center justify-between bg-[var(--pbx-surface-card)]">
                    <Inline gap="3" align="center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        m.is_moderator ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        #{m.id}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-[var(--pbx-text-primary)]">
                          {m.caller_id_number || 'Internal Caller'} {m.caller_id_name ? `(${m.caller_id_name})` : ''}
                        </div>
                        <div className="text-[10px] text-[var(--pbx-text-muted)] font-mono">
                          UUID: {m.uuid ? m.uuid.slice(0, 16) + '...' : 'Active Call'}
                        </div>
                      </div>
                    </Inline>

                    <Inline gap="2" align="center">
                      {m.is_moderator && (
                        <Badge variant="warning">Host / Moderator</Badge>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleKickParticipant(liveModalConf.id, m.id)}
                        title="Disconnect caller"
                      >
                        Drop
                      </Button>
                    </Inline>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[var(--pbx-text-muted)] border border-dashed rounded-lg">
                No active participants connected to this conference bridge right now.
              </div>
            )}
          </div>
        </Stack>
      </Modal>

      {/* ── Create / Edit Conference Modal ── */}
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
            {user?.role === 'SUPER_ADMIN' && (
              <FormField label="Tenant Organization" required hint="Tenant owning this conference room">
                <Select
                  value={formData.tenant_id}
                  onChange={e => setFormData({ ...formData, tenant_id: e.target.value })}
                  required
                >
                  <option value="">-- Select Tenant Organization --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.domain})</option>
                  ))}
                </Select>
              </FormField>
            )}

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
              <FormField label="Participant PIN (Optional)" hint="Leave empty for open room">
                <Input
                  placeholder="e.g. 1234"
                  value={formData.pin}
                  onChange={e => setFormData({ ...formData, pin: e.target.value })}
                />
              </FormField>
              <FormField label="Moderator PIN (Optional)" hint="Required for host entry">
                <Input
                  placeholder="e.g. 9876"
                  value={formData.moderator_pin}
                  onChange={e => setFormData({ ...formData, moderator_pin: e.target.value })}
                />
              </FormField>
            </Grid>

            <Stack gap="3">
              <Divider />
              <Checkbox
                label="Require Moderator present before participants can join"
                checked={formData.wait_for_moderator}
                onChange={e => setFormData({ ...formData, wait_for_moderator: e.target.checked })}
              />
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
    </ListPageLayout>
  );
};
