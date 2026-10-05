import React, { useState, useEffect, useMemo } from 'react';
import { Voicemail, RefreshCw, Edit2, Plus, Trash2 } from 'lucide-react';
import { apiService } from '../services/api';
import { useToast } from './ToastProvider';
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

interface VoicemailViewProps {
  token: string | null;
  user?: User | null;
}

interface VoicemailBoxItem {
  extension_id: string;
  extension_number: string;
  display_name: string;
  extension_email?: string;
  voicemail_box_id?: string;
  mailbox: string;
  email_notification: boolean;
  email_attach_file: boolean;
  email_address?: string;
  delete_after_email: boolean;
  greeting_path?: string;
}

export const VoicemailView: React.FC<VoicemailViewProps> = ({ token, user }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [boxes, setBoxes] = useState<VoicemailBoxItem[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [audioFiles, setAudioFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedExtId, setSelectedExtId] = useState('');
  const [mailboxPin, setMailboxPin] = useState('1234');
  const [emailNotification, setEmailNotification] = useState(true);
  const [emailAttachFile, setEmailAttachFile] = useState(true);
  const [emailAddress, setEmailAddress] = useState('');
  const [deleteAfterEmail, setDeleteAfterEmail] = useState(false);
  const [greetingPath, setGreetingPath] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [vmData, extData, audios] = await Promise.allSettled([
        apiService.getVoicemailBoxesAll(token),
        apiService.getExtensions(token),
        apiService.getAudioFiles(token),
      ]);

      if (vmData.status === 'fulfilled') setBoxes(vmData.value);
      if (extData.status === 'fulfilled') setExtensions(extData.value);
      if (audios.status === 'fulfilled') setAudioFiles(audios.value);
    } catch (err: any) {
      console.error('Failed to load voicemail data:', err);
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
    setSelectedExtId(firstExt ? (firstExt.id || '') : '');
    setMailboxPin('1234');
    setEmailNotification(true);
    setEmailAttachFile(true);
    setEmailAddress(firstExt?.email || '');
    setDeleteAfterEmail(false);
    setGreetingPath('');
    setShowModal(true);
  };

  const openEditModal = (box: VoicemailBoxItem) => {
    setSelectedExtId(box.extension_id);
    setMailboxPin('1234');
    setEmailNotification(box.email_notification ?? true);
    setEmailAttachFile(box.email_attach_file ?? true);
    setEmailAddress(box.email_address || box.extension_email || '');
    setDeleteAfterEmail(box.delete_after_email ?? false);
    setGreetingPath(box.greeting_path || '');
    setShowModal(true);
  };

  const handleExtensionChange = (extId: string) => {
    setSelectedExtId(extId);
    const ext = tenantExtensions.find(e => e.id === extId);
    const existingBox = boxes.find(b => b.extension_id === extId);
    if (existingBox) {
      setEmailNotification(existingBox.email_notification ?? true);
      setEmailAttachFile(existingBox.email_attach_file ?? true);
      setEmailAddress(existingBox.email_address || existingBox.extension_email || ext?.email || '');
      setDeleteAfterEmail(existingBox.delete_after_email ?? false);
      setGreetingPath(existingBox.greeting_path || '');
    } else if (ext) {
      setEmailAddress(ext.email || '');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedExtId) {
      showErrorModal('Extension Required', 'Please select an extension to configure voicemail.');
      return;
    }

    setSaving(true);
    try {
      const ext = tenantExtensions.find(e => e.id === selectedExtId);
      const mailboxNum = ext ? ext.extension_number : undefined;

      await apiService.updateExtensionVoicemail(token, selectedExtId, {
        mailbox: mailboxNum,
        password: mailboxPin || undefined,
        email_notification: emailNotification,
        email_attach_file: emailAttachFile,
        email_address: emailAddress || undefined,
        delete_after_email: deleteAfterEmail,
        greeting_path: greetingPath || undefined,
      });

      showSuccessModal(
        'Voicemail Configured Successfully',
        `Voicemail box settings for ext/${ext?.extension_number || 'selected'} have been updated.`
      );
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      showErrorModal('Configuration Failed', err.message || 'Failed to save voicemail configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBox = async (extId: string, extNum: string) => {
    if (!window.confirm(`Are you sure you want to delete the voicemail box for ext/${extNum}? This will remove its mailbox and reset voicemail credentials.`)) return;
    if (!token) return;
    setLoading(true);
    try {
      await apiService.deleteVoicemailBox(token, extId);
      showSuccessModal('Voicemail Box Deleted', `Voicemail box for ext/${extNum} was successfully deleted.`);
      fetchData();
    } catch (err: any) {
      showErrorModal('Delete Error', err.message || 'Could not delete voicemail box');
    } finally {
      setLoading(false);
    }
  };

  const filtered = boxes.filter(b =>
    b.extension_number.includes(search) ||
    (b.display_name && b.display_name.toLowerCase().includes(search.toLowerCase())) ||
    (b.email_address && b.email_address.toLowerCase().includes(search.toLowerCase()))
  );

  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'TENANT_ADMIN';

  const columns = [
    {
      key: 'extension_number',
      header: 'Extension / Mailbox',
      sortable: true,
      render: (b: VoicemailBoxItem) => (
        <Inline gap="2">
          <Voicemail size={16} />
          <strong>ext/{b.extension_number}</strong>
          {b.display_name && <Badge variant="neutral">{b.display_name}</Badge>}
        </Inline>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (b: VoicemailBoxItem) => (
        <Badge variant={b.voicemail_box_id ? 'success' : 'neutral'}>
          {b.voicemail_box_id ? 'ACTIVE' : 'DEFAULT'}
        </Badge>
      ),
    },
    {
      key: 'email_address',
      header: 'Email Delivery',
      render: (b: VoicemailBoxItem) => (
        b.email_notification && (b.email_address || b.extension_email) ? (
          <span>{b.email_address || b.extension_email}</span>
        ) : (
          <Badge variant="neutral">Disabled</Badge>
        )
      ),
    },
    {
      key: 'email_attach_file',
      header: 'Attachment',
      render: (b: VoicemailBoxItem) => (
        <Badge variant={b.email_attach_file ? 'warning' : 'neutral'}>
          {b.email_attach_file ? 'WAV ATTACHED' : 'NOTIFICATION ONLY'}
        </Badge>
      ),
    },
    {
      key: 'delete_after_email',
      header: 'Auto-Purge',
      render: (b: VoicemailBoxItem) => (
        <Badge variant={b.delete_after_email ? 'danger' : 'neutral'}>
          {b.delete_after_email ? 'Delete on send' : 'Retain in box'}
        </Badge>
      ),
    },
    {
      key: 'greeting_path',
      header: 'Greeting Audio',
      render: (b: VoicemailBoxItem) => (
        <code>{b.greeting_path ? b.greeting_path.split('/').pop() : 'Standard Greeting'}</code>
      ),
    },
  ];

  return (
    <ListPageLayout
      title="Voicemail Management"
      subtitle="Configure extension voicemail boxes, PIN codes, audio greetings, and email notifications"
      eyebrow="UNIFIED MESSAGING"
      actions={
        <Inline gap="3">
          <Button variant="secondary" onClick={fetchData} isLoading={loading} leftIcon={<RefreshCw size={14} />}>
            Refresh
          </Button>
          {canManage && (
            <Button variant="primary" onClick={openCreateModal} leftIcon={<Plus size={16} />}>
              Setup Voicemail Box
            </Button>
          )}
        </Inline>
      }
      filterBar={
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search voicemail boxes..."
        />
      }
    >

        <DataTable
          columns={columns}
          data={filtered}
          isLoading={loading}
          emptyTitle="No voicemail boxes configured yet"
          actions={canManage ? (b: VoicemailBoxItem) => (
            <Inline gap="2" justify="flex-end">
              <Button variant="secondary" size="sm" onClick={() => openEditModal(b)} leftIcon={<Edit2 size={12} />}>
                Configure
              </Button>
              {b.voicemail_box_id && (
                <Button variant="danger" size="sm" onClick={() => handleDeleteBox(b.extension_id, b.extension_number)} leftIcon={<Trash2 size={12} />}>
                  Delete
                </Button>
              )}
            </Inline>
          ) : undefined}
        />

      {/* Setup / Configure Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Configure Voicemail Box"
        subtitle="Manage mailbox PIN, email attachments, and custom audio greetings"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} isLoading={saving}>Save Voicemail Settings</Button>
          </>
        }
      >
        <Stack gap="4">
          <FormField label="Select Extension" required>
            <Select
              value={selectedExtId}
              onChange={e => handleExtensionChange(e.target.value)}
            >
              <option value="">-- Choose Extension --</option>
              {tenantExtensions.map(e => (
                <option key={e.id} value={e.id}>
                  ext/{e.extension_number} — {e.display_name || 'Extension'} {e.email ? `(${e.email})` : ''}
                </option>
              ))}
            </Select>
          </FormField>

          <Grid cols={2} gap="4">
            <FormField label="Mailbox PIN (4-10 Digits)" required hint="Default subscriber pin: 1234">
              <Input
                type="password"
                value={mailboxPin}
                onChange={e => setMailboxPin(e.target.value)}
                placeholder="e.g. 1234"
              />
            </FormField>

            <FormField label="Custom Greeting Prompt">
              <Select
                value={greetingPath}
                onChange={e => setGreetingPath(e.target.value)}
              >
                <option value="">-- System Default Greeting --</option>
                {audioFiles.map(a => (
                  <option key={a.id} value={a.file_path || a.file_name}>
                    {a.name || a.file_name} ({a.category})
                  </option>
                ))}
              </Select>
            </FormField>
          </Grid>

          <FormField label="Notification Email Address">
            <Input
              type="email"
              value={emailAddress}
              onChange={e => setEmailAddress(e.target.value)}
              placeholder="agent@company.com"
            />
          </FormField>

          <Stack gap="2">
            <Checkbox
              label="Send Email Notification on New Voicemail"
              checked={emailNotification}
              onChange={e => setEmailNotification(e.target.checked)}
            />
            <Checkbox
              label="Attach Audio Recording (.wav) to Email"
              checked={emailAttachFile}
              onChange={e => setEmailAttachFile(e.target.checked)}
            />
            <Checkbox
              label="Delete from Server After Successful Email"
              checked={deleteAfterEmail}
              onChange={e => setDeleteAfterEmail(e.target.checked)}
            />
          </Stack>
        </Stack>
      </Modal>
    </ListPageLayout>
  );
};
