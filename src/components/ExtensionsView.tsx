import { useToast } from './ToastProvider';
import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, KeyRound, Edit2, Trash2 } from 'lucide-react';

import { apiService } from '../services/api';
import type { Extension, Tenant } from '../types';
import { PageContainer } from './layout/PageContainer';
import { Stack, Inline, Grid } from './layout/Stack';
import {
  Button,
  Input,
  Select,
  FormField,
  Modal,
  Badge,
  Alert,
} from './ui';
import { DataTable, FilterBar } from './patterns';

interface ExtensionsViewProps {
  token: string | null;
  user?: any;
}

export const ExtensionsView: React.FC<ExtensionsViewProps> = ({ token, user }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenantFilter, setSelectedTenantFilter] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedExtId, setSelectedExtId] = useState<string | null>(null);
  const [editingExtId, setEditingExtId] = useState<string | null>(null);

  // Edit Form
  const [editFormData, setEditFormData] = useState({
    extension_number: '',
    display_name: '',
    email: '',
    caller_id_name: '',
    caller_id_number: '',
    webrtc_enabled: true,
    no_answer_timeout: 20,
    enabled: true
  });

  // Create Form
  const [tenantId, setTenantId] = useState('');
  const [extNumber, setExtNumber] = useState('1001');
  const [displayName, setDisplayName] = useState('Alice Smith');
  const [email, setEmail] = useState('alice@acme.com');
  const [sipPassword, setSipPassword] = useState('SIPPassword123!');
  const [voicemailPin, setVoicemailPin] = useState('1234');

  // Reset Form
  const [newSipPwd, setNewSipPwd] = useState('');
  const [newVmPin, setNewVmPin] = useState('');

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [exts, tnts] = await Promise.all([
        apiService.getExtensions(token),
        user?.role === 'SUPER_ADMIN' ? apiService.getTenants(token) : Promise.resolve([]),
      ]);
      setExtensions(exts);
      setTenants(tnts);
      if (user?.role !== 'SUPER_ADMIN' && user?.tenant_id) {
        setTenantId(user.tenant_id);
      } else if (tnts.length > 0 && !tenantId) {
        setTenantId(tnts[0].id);
      }
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err.message || JSON.stringify(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      const cleanEmail = email && email.trim() ? email.trim() : undefined;
      await apiService.createExtension(token, {
        tenant_id: tenantId || (user?.tenant_id ?? undefined),
        extension_number: extNumber,
        display_name: displayName,
        email: cleanEmail,
        sip_password: sipPassword,
        voicemail_pin: voicemailPin,
      });
      setShowModal(false);
      showSuccessModal(
        'Extension Provisioned Successfully',
        `Extension ext/${extNumber} (${displayName}) has been created and registered for SIP and WebRTC softphones.`
      );
      fetchData();
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err.message || JSON.stringify(err);
      setError(msg);
      showErrorModal('Failed to Provision Extension', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedExtId) return;
    setLoading(true);
    try {
      await apiService.resetExtensionPassword(token, selectedExtId, {
        new_sip_password: newSipPwd || undefined,
        new_voicemail_pin: newVmPin || undefined,
      });
      setShowResetModal(false);
      setSelectedExtId(null);
      setNewSipPwd('');
      setNewVmPin('');
      showSuccessModal('Credentials Reset', 'SIP authentication password and voicemail PIN have been updated successfully.');
      fetchData();
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err.message || JSON.stringify(err);
      setError(msg);
      showErrorModal('Password Reset Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (ext: Extension) => {
    setEditingExtId(ext.id);
    setEditFormData({
      extension_number: ext.extension_number,
      display_name: ext.display_name || '',
      email: ext.email || '',
      caller_id_name: ext.caller_id_name || ext.display_name || '',
      caller_id_number: ext.caller_id_number || ext.extension_number || '',
      webrtc_enabled: ext.webrtc_enabled !== false,
      no_answer_timeout: ext.no_answer_timeout || 20,
      enabled: ext.enabled !== false
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingExtId) return;
    setLoading(true);
    try {
      await apiService.updateExtension(token, editingExtId, {
        display_name: editFormData.display_name,
        email: editFormData.email && editFormData.email.trim() ? editFormData.email.trim() : null,
        caller_id_name: editFormData.caller_id_name,
        caller_id_number: editFormData.caller_id_number,
        webrtc_enabled: editFormData.webrtc_enabled,
        no_answer_timeout: Number(editFormData.no_answer_timeout) || 20,
        enabled: editFormData.enabled
      });
      setShowEditModal(false);
      setEditingExtId(null);
      showSuccessModal(
        'Extension Updated',
        `Extension ext/${editFormData.extension_number} configuration has been saved.`
      );
      fetchData();
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err.message || JSON.stringify(err);
      setError(msg);
      showErrorModal('Update Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (extId: string, extNum: string) => {
    if (!window.confirm(`Are you sure you want to delete extension ${extNum}?`)) return;
    if (!token) return;
    setLoading(true);
    try {
      await apiService.deleteExtension(token, extId);
      showSuccessModal('Extension Deleted', `Extension ext/${extNum} was successfully deleted.`);
      fetchData();
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err.message || JSON.stringify(err);
      setError(msg);
      showErrorModal('Delete Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const filteredExts = extensions.filter((ext: Extension) => {
    const matchesSearch =
      ext.extension_number.includes(searchTerm) ||
      ext.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ext.email && ext.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTenant = selectedTenantFilter ? ext.tenant_id === selectedTenantFilter : true;
    return matchesSearch && matchesTenant;
  });

  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'TENANT_ADMIN';

  const columns = [
    {
      key: 'extension_number',
      header: 'Ext #',
      sortable: true,
      render: (ext: Extension) => <strong>{ext.extension_number}</strong>,
    },
    {
      key: 'display_name',
      header: 'Display Name',
      sortable: true,
      render: (ext: Extension) => ext.display_name,
    },
    {
      key: 'email',
      header: 'User Email',
      render: (ext: Extension) => ext.email || 'N/A',
    },
    {
      key: 'caller_id_name',
      header: 'Caller ID',
      render: (ext: Extension) => `${ext.caller_id_name || ext.display_name} (${ext.caller_id_number || ext.extension_number})`,
    },
    {
      key: 'webrtc_enabled',
      header: 'WebRTC Status',
      render: (ext: Extension) => (
        <Badge variant={ext.webrtc_enabled ? 'success' : 'neutral'}>
          {ext.webrtc_enabled ? 'WebRTC (WSS)' : 'SIP Only'}
        </Badge>
      ),
    },
    {
      key: 'no_answer_timeout',
      header: 'Timeout',
      render: (ext: Extension) => `${ext.no_answer_timeout}s`,
    },
  ];

  return (
    <PageContainer
      title="SIP Extensions"
      subtitle="Manage SIP digest credentials and WebRTC softphone configurations (/api/v1/extensions)."
      eyebrow="Endpoint Provisioning"
      actions={
        <Inline gap="3">
          <Button variant="secondary" onClick={fetchData} isLoading={loading} leftIcon={<RefreshCw size={14} />}>
            Refresh
          </Button>
          {canManage && (
            <Button variant="primary" onClick={() => setShowModal(true)} leftIcon={<Plus size={16} />}>
              Provision Extension
            </Button>
          )}
        </Inline>
      }
    >
      <Stack gap="6">
        {error && <Alert variant="danger" title="Error">{error}</Alert>}

        <FilterBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search extension or name..."
          filters={
            user?.role === 'SUPER_ADMIN' && tenants.length > 0 ? (
              <Select
                value={selectedTenantFilter}
                onChange={(e) => setSelectedTenantFilter(e.target.value)}
              >
                <option value="">All Tenants</option>
                {tenants.map((t: Tenant) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            ) : undefined
          }
        />

        <DataTable
          columns={columns}
          data={filteredExts}
          isLoading={loading}
          emptyTitle="No extensions found"
          emptyDescription={canManage ? 'Click "Provision Extension" to add your first extension.' : undefined}
          actions={
            canManage
              ? (ext: Extension) => (
                  <Inline gap="2" justify="flex-end">
                    <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(ext)} leftIcon={<Edit2 size={12} />}>
                      Edit
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => { setSelectedExtId(ext.id); setShowResetModal(true); }} leftIcon={<KeyRound size={12} />}>
                      Reset
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(ext.id, ext.extension_number)} leftIcon={<Trash2 size={12} />}>
                      Delete
                    </Button>
                  </Inline>
                )
              : undefined
          }
        />
      </Stack>

      {/* Create Extension Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Provision New SIP Extension"
        subtitle="Create a tenant extension endpoint for desktop phones or WebRTC softphones"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} isLoading={loading}>Provision Extension</Button>
          </>
        }
      >
        <Stack gap="4">
          {user?.role === 'SUPER_ADMIN' && tenants.length > 0 && (
            <FormField label="Target Tenant">
              <Select value={tenantId} onChange={(e) => setTenantId(e.target.value)}>
                {tenants.map((t: Tenant) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.sip_domain})</option>
                ))}
              </Select>
            </FormField>
          )}

          <Grid cols={2} gap="4">
            <FormField label="Extension Number" required>
              <Input
                value={extNumber}
                onChange={(e) => setExtNumber(e.target.value)}
                placeholder="1001"
              />
            </FormField>
            <FormField label="Display Name" required>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alice Smith"
              />
            </FormField>
          </Grid>

          <FormField label="User Email Address">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alice@acme.com"
            />
          </FormField>

          <Grid cols={2} gap="4">
            <FormField label="SIP Password" required>
              <Input
                type="password"
                value={sipPassword}
                onChange={(e) => setSipPassword(e.target.value)}
                placeholder="SIPPassword123!"
              />
            </FormField>
            <FormField label="Voicemail PIN">
              <Input
                value={voicemailPin}
                onChange={(e) => setVoicemailPin(e.target.value)}
                placeholder="1234"
              />
            </FormField>
          </Grid>
        </Stack>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Credentials"
        subtitle="Update SIP authentication password or Voicemail PIN"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowResetModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleResetPassword} isLoading={loading}>Save Credentials</Button>
          </>
        }
      >
        <Stack gap="4">
          <FormField label="New SIP Password" hint="Leave empty to keep unchanged">
            <Input
              type="password"
              value={newSipPwd}
              onChange={(e) => setNewSipPwd(e.target.value)}
              placeholder="New password..."
            />
          </FormField>
          <FormField label="New Voicemail PIN" hint="Leave empty to keep unchanged">
            <Input
              value={newVmPin}
              onChange={(e) => setNewVmPin(e.target.value)}
              placeholder="New PIN..."
            />
          </FormField>
        </Stack>
      </Modal>

      {/* Edit Extension Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingExtId(null); }}
        title="Edit Extension"
        subtitle={`Modify display profile, caller ID, and timeout for ext/${editFormData.extension_number}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setEditingExtId(null); }}>Cancel</Button>
            <Button variant="primary" onClick={handleUpdate} isLoading={loading}>Save Extension Changes</Button>
          </>
        }
      >
        <Stack gap="4">
          <Grid cols={2} gap="4">
            <FormField label="Display Name" required>
              <Input
                value={editFormData.display_name}
                onChange={(e) => setEditFormData({ ...editFormData, display_name: e.target.value })}
              />
            </FormField>
            <FormField label="User Email">
              <Input
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </FormField>
            <FormField label="Caller ID Name">
              <Input
                value={editFormData.caller_id_name}
                onChange={(e) => setEditFormData({ ...editFormData, caller_id_name: e.target.value })}
              />
            </FormField>
            <FormField label="Caller ID Number">
              <Input
                value={editFormData.caller_id_number}
                onChange={(e) => setEditFormData({ ...editFormData, caller_id_number: e.target.value })}
              />
            </FormField>
            <FormField label="No-Answer Timeout (sec)">
              <Input
                type="number"
                value={String(editFormData.no_answer_timeout)}
                onChange={(e) => setEditFormData({ ...editFormData, no_answer_timeout: parseInt(e.target.value) || 20 })}
              />
            </FormField>
            <FormField label="WebRTC Softphone">
              <Select
                value={editFormData.webrtc_enabled ? 'true' : 'false'}
                onChange={(e) => setEditFormData({ ...editFormData, webrtc_enabled: e.target.value === 'true' })}
              >
                <option value="true">Enabled (WSS / WebRTC)</option>
                <option value="false">Disabled (SIP Only)</option>
              </Select>
            </FormField>
          </Grid>
          <FormField label="Extension Status">
            <Select
              value={editFormData.enabled ? 'true' : 'false'}
              onChange={(e) => setEditFormData({ ...editFormData, enabled: e.target.value === 'true' })}
            >
              <option value="true">Active / Registered</option>
              <option value="false">Suspended / Inactive</option>
            </Select>
          </FormField>
        </Stack>
      </Modal>
    </PageContainer>
  );
};
