import { useToast } from './ToastProvider';
import React, { useState, useEffect, useMemo } from 'react';
import { PhoneForwarded, RefreshCw, Edit2, Plus, Trash2, ArrowRight } from 'lucide-react';
import { apiService } from '../services/api';
import type { User } from '../types';
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

interface CallForwardingViewProps {
  token: string | null;
  user?: User | null;
}

interface ForwardingRuleItem {
  extension_id: string;
  extension_number: string;
  display_name: string;
  tenant_name?: string;
  forward_always_enabled: boolean;
  forward_always_destination?: string;
  forward_busy_enabled: boolean;
  forward_busy_destination?: string;
  forward_no_answer_enabled: boolean;
  forward_no_answer_destination?: string;
  forward_no_answer_timeout: number;
  updated_at?: string;
}

export const CallForwardingView: React.FC<CallForwardingViewProps> = ({ token, user }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [rules, setRules] = useState<ForwardingRuleItem[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedExtId, setSelectedExtId] = useState('');
  const [alwaysEnabled, setAlwaysEnabled] = useState(false);
  const [alwaysDest, setAlwaysDest] = useState('');
  const [busyEnabled, setBusyEnabled] = useState(false);
  const [busyDest, setBusyDest] = useState('');
  const [noAnswerEnabled, setNoAnswerEnabled] = useState(false);
  const [noAnswerDest, setNoAnswerDest] = useState('');
  const [noAnswerTimeout, setNoAnswerTimeout] = useState(20);
  const [saving, setSaving] = useState(false);

  // Delete Confirmation State
  const [deleteConfirmRule, setDeleteConfirmRule] = useState<ForwardingRuleItem | null>(null);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [fData, extData] = await Promise.allSettled([
        apiService.getCallForwardingAll(token),
        apiService.getExtensions(token)
      ]);
      if (fData.status === 'fulfilled') setRules(fData.value);
      if (extData.status === 'fulfilled') setExtensions(extData.value);
    } catch (err: any) {
      console.error('Failed to load forwarding data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const tenantExtensions = useMemo(() => {
    if (user?.role === 'SUPER_ADMIN') return extensions;
    return extensions.filter(e => e.tenant_id === user?.tenant_id || !e.tenant_id);
  }, [extensions, user]);

  const openCreateModal = () => {
    const firstExt = tenantExtensions.length > 0 ? tenantExtensions[0] : null;
    if (!firstExt) {
      showErrorModal('No Extensions Found', 'Please provision an extension before configuring call forwarding.');
      return;
    }
    handleExtensionSelect(firstExt.id || '');
    setShowModal(true);
  };

  const openEditModal = (rule: ForwardingRuleItem) => {
    setSelectedExtId(rule.extension_id);
    setAlwaysEnabled(Boolean(rule.forward_always_enabled));
    setAlwaysDest(rule.forward_always_destination || '');
    setBusyEnabled(Boolean(rule.forward_busy_enabled));
    setBusyDest(rule.forward_busy_destination || '');
    setNoAnswerEnabled(Boolean(rule.forward_no_answer_enabled));
    setNoAnswerDest(rule.forward_no_answer_destination || '');
    setNoAnswerTimeout(rule.forward_no_answer_timeout || 20);
    setShowModal(true);
  };

  const handleExtensionSelect = (extId: string) => {
    setSelectedExtId(extId);
    const existingRule = rules.find(r => r.extension_id === extId);
    if (existingRule) {
      setAlwaysEnabled(Boolean(existingRule.forward_always_enabled));
      setAlwaysDest(existingRule.forward_always_destination || '');
      setBusyEnabled(Boolean(existingRule.forward_busy_enabled));
      setBusyDest(existingRule.forward_busy_destination || '');
      setNoAnswerEnabled(Boolean(existingRule.forward_no_answer_enabled));
      setNoAnswerDest(existingRule.forward_no_answer_destination || '');
      setNoAnswerTimeout(existingRule.forward_no_answer_timeout || 20);
    } else {
      setAlwaysEnabled(false);
      setAlwaysDest('');
      setBusyEnabled(false);
      setBusyDest('');
      setNoAnswerEnabled(false);
      setNoAnswerDest('');
      setNoAnswerTimeout(20);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedExtId) {
      showErrorModal('Extension Required', 'Please select an extension to configure forwarding.');
      return;
    }

    setSaving(true);
    try {
      const ext = tenantExtensions.find(e => e.id === selectedExtId);

      await apiService.updateExtensionForwarding(token, selectedExtId, {
        forward_always_enabled: alwaysEnabled,
        forward_always_destination: alwaysEnabled ? (alwaysDest.trim() || null) : null,
        forward_busy_enabled: busyEnabled,
        forward_busy_destination: busyEnabled ? (busyDest.trim() || null) : null,
        forward_no_answer_enabled: noAnswerEnabled,
        forward_no_answer_destination: noAnswerEnabled ? (noAnswerDest.trim() || null) : null,
        forward_no_answer_timeout: Number(noAnswerTimeout) || 20,
      });

      showSuccessModal(
        'Forwarding Settings Saved',
        `Call forwarding policies for ext/${ext?.extension_number || 'selected'} have been updated successfully.`
      );
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      showErrorModal('Update Failed', err.message || 'Failed to update forwarding settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !deleteConfirmRule) return;
    setLoading(true);
    try {
      await apiService.deleteExtensionForwarding(token, deleteConfirmRule.extension_id);
      showSuccessModal(
        'Forwarding Cleared',
        `All call forwarding rules for ext/${deleteConfirmRule.extension_number} have been removed.`
      );
      setDeleteConfirmRule(null);
      if (showModal && selectedExtId === deleteConfirmRule.extension_id) {
        setShowModal(false);
      }
      fetchData();
    } catch (err: any) {
      showErrorModal('Delete Failed', err.message || 'Failed to remove call forwarding rules');
    } finally {
      setLoading(false);
    }
  };

  const filtered = rules.filter(r =>
    r.extension_number.includes(search) ||
    (r.display_name && r.display_name.toLowerCase().includes(search.toLowerCase())) ||
    (r.forward_always_destination && r.forward_always_destination.includes(search))
  );

  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'TENANT_ADMIN';

  const columns = [
    {
      key: 'extension_number',
      header: 'Extension',
      sortable: true,
      render: (r: ForwardingRuleItem) => (
        <Inline gap="2">
          <PhoneForwarded size={16} />
          <strong>ext/{r.extension_number}</strong>
          {r.display_name && <Badge variant="neutral">{r.display_name}</Badge>}
        </Inline>
      ),
    },
    {
      key: 'forward_always',
      header: 'Forward Always',
      render: (r: ForwardingRuleItem) => (
        r.forward_always_enabled && r.forward_always_destination ? (
          <Badge variant="success">
            <ArrowRight size={12} /> {r.forward_always_destination}
          </Badge>
        ) : (
          <Badge variant="neutral">Off</Badge>
        )
      ),
    },
    {
      key: 'forward_busy',
      header: 'Forward on Busy',
      render: (r: ForwardingRuleItem) => (
        r.forward_busy_enabled && r.forward_busy_destination ? (
          <Badge variant="warning">
            <ArrowRight size={12} /> {r.forward_busy_destination}
          </Badge>
        ) : (
          <Badge variant="neutral">Off</Badge>
        )
      ),
    },
    {
      key: 'forward_no_answer',
      header: 'No-Answer Forward',
      render: (r: ForwardingRuleItem) => (
        r.forward_no_answer_enabled && r.forward_no_answer_destination ? (
          <Badge variant="neutral">
            <ArrowRight size={12} /> {r.forward_no_answer_destination}
          </Badge>
        ) : (
          <Badge variant="neutral">Off</Badge>
        )
      ),
    },
    {
      key: 'timeout',
      header: 'Timeout',
      render: (r: ForwardingRuleItem) => `${r.forward_no_answer_timeout || 20}s`,
    },
  ];

  return (
    <ListPageLayout
      title="Call Forwarding & Follow-Me"
      subtitle="Configure unconditional forward, busy forward, and no-answer reroute policies"
      eyebrow="CALL ROUTING RULES"
      actions={
        <Inline gap="3">
          <Button variant="secondary" onClick={fetchData} isLoading={loading} leftIcon={<RefreshCw size={14} />}>
            Refresh
          </Button>
          {canManage && (
            <Button variant="primary" onClick={openCreateModal} leftIcon={<Plus size={16} />}>
              Configure Forwarding Rule
            </Button>
          )}
        </Inline>
      }
      filterBar={
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search extensions..."
        />
      }
    >

        <DataTable
          columns={columns}
          data={filtered}
          isLoading={loading}
          emptyTitle="No forwarding rules configured yet"
          actions={canManage ? (r: ForwardingRuleItem) => {
            const hasActiveRule = Boolean(
              (r.forward_always_enabled && r.forward_always_destination) ||
              (r.forward_busy_enabled && r.forward_busy_destination) ||
              (r.forward_no_answer_enabled && r.forward_no_answer_destination)
            );
            return (
              <Inline gap="2" justify="flex-end">
                <Button variant="secondary" size="sm" onClick={() => openEditModal(r)} leftIcon={<Edit2 size={12} />}>
                  Configure
                </Button>
                {hasActiveRule && (
                  <Button variant="danger" size="sm" onClick={() => setDeleteConfirmRule(r)} leftIcon={<Trash2 size={12} />}>
                    Clear
                  </Button>
                )}
              </Inline>
            );
          } : undefined}
        />

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Configure Call Forwarding"
        subtitle="Set up unconditional, busy, and no-answer forwarding rules"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} isLoading={saving}>Save Forwarding Settings</Button>
          </>
        }
      >
        <Stack gap="4">
          <FormField label="Select Extension" required>
            <Select
              value={selectedExtId}
              onChange={e => handleExtensionSelect(e.target.value)}
            >
              <option value="">-- Choose Extension --</option>
              {tenantExtensions.map(e => (
                <option key={e.id} value={e.id}>
                  ext/{e.extension_number} — {e.display_name || 'Extension'}
                </option>
              ))}
            </Select>
          </FormField>

          <Stack gap="3">
            <Checkbox
              label="Forward Always (Unconditional)"
              checked={alwaysEnabled}
              onChange={e => setAlwaysEnabled(e.target.checked)}
            />
            {alwaysEnabled && (
              <FormField label="Forward Destination Number / Extension" required>
                <Input
                  value={alwaysDest}
                  onChange={e => setAlwaysDest(e.target.value)}
                  placeholder="e.g. 1002 or +15551234567"
                />
              </FormField>
            )}

            <Checkbox
              label="Forward on Busy (DND / In-Call)"
              checked={busyEnabled}
              onChange={e => setBusyEnabled(e.target.checked)}
            />
            {busyEnabled && (
              <FormField label="Busy Destination Number / Extension" required>
                <Input
                  value={busyDest}
                  onChange={e => setBusyDest(e.target.value)}
                  placeholder="e.g. 1003 or mobile number"
                />
              </FormField>
            )}

            <Checkbox
              label="Forward on No Answer (Timeout)"
              checked={noAnswerEnabled}
              onChange={e => setNoAnswerEnabled(e.target.checked)}
            />
            {noAnswerEnabled && (
              <Grid cols={2} gap="4">
                <FormField label="No Answer Destination" required>
                  <Input
                    value={noAnswerDest}
                    onChange={e => setNoAnswerDest(e.target.value)}
                    placeholder="e.g. 7001 or mobile number"
                  />
                </FormField>
                <FormField label="Ring Timeout (sec)">
                  <Input
                    type="number"
                    value={String(noAnswerTimeout)}
                    onChange={e => setNoAnswerTimeout(parseInt(e.target.value) || 20)}
                  />
                </FormField>
              </Grid>
            )}
          </Stack>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmRule}
        onClose={() => setDeleteConfirmRule(null)}
        title="Clear Call Forwarding"
        subtitle={`ext/${deleteConfirmRule?.extension_number || ''} — ${deleteConfirmRule?.display_name || 'Extension'}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteConfirmRule(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Yes, Delete Rules</Button>
          </>
        }
      >
        <p>
          Are you sure you want to remove and disable all call forwarding rules for extension <strong>ext/{deleteConfirmRule?.extension_number}</strong>?
          Incoming calls will directly ring this extension's registered device.
        </p>
      </Modal>
    </ListPageLayout>
  );
};
