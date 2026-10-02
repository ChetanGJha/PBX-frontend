import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useToast } from './ToastProvider';
import { GitBranch, Plus, Volume2, Edit, Trash2, UploadCloud, Palette } from 'lucide-react';
import { PageContainer } from './layout/PageContainer';
import { Stack, Inline, Grid } from './layout/Stack';
import {
  Button,
  Card,
  Input,
  Select,
  FormField,
  Modal,
  Badge,
  Alert,
} from './ui';
import { DataTable } from './patterns';

interface IvrViewProps {
  token: string;
  user?: any;
}

export const IvrView: React.FC<IvrViewProps> = ({ token, user }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [ivrs, setIvrs] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [queues, setQueues] = useState<any[]>([]);
  const [audioFiles, setAudioFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDesignerModal, setShowDesignerModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Designer & State
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [activeIvr, setActiveIvr] = useState<any>(null);
  const [activeNodes, setActiveNodes] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    greeting_audio: 'welcome_prompt.wav',
    direct_extension_dial: true,
    timeout: 10,
    tenant_id: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [iData, tData, extData, qData, audData] = await Promise.allSettled([
        apiService.getIvrs(token),
        apiService.getTenants(token),
        apiService.getExtensions(token),
        apiService.getQueues(token),
        apiService.getAudioFiles(token)
      ]);

      if (iData.status === 'fulfilled') setIvrs(iData.value);
      if (tData.status === 'fulfilled') setTenants(tData.value);
      if (extData.status === 'fulfilled') setExtensions(extData.value);
      if (qData.status === 'fulfilled') setQueues(qData.value);
      if (audData.status === 'fulfilled') setAudioFiles(audData.value);
    } catch (err) {
      console.error('Failed to load IVR data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Helper for uploading audio files
  const uploadAudioFile = async (file: File, category: string = 'ivr_greeting', tenantId?: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', category);
    if (tenantId) fd.append('tenant_id', tenantId);

    const res = await apiService.uploadAudioFile(token, fd);
    try {
      const updatedAudios = await apiService.getAudioFiles(token);
      setAudioFiles(updatedAudios);
    } catch (e) {}
    return res.file_name;
  };

  const handleCanvasGreetingUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeIvr) return;

    try {
      setUploadingTarget('canvas_greeting');
      const fileName = await uploadAudioFile(file, 'ivr_greeting', activeIvr.tenant_id);
      await apiService.updateIvr(token, activeIvr.id, { greeting_audio: fileName });
      setActiveIvr((prev: any) => ({ ...prev, greeting_audio: fileName }));
      loadData();
    } catch (err: any) {
      showErrorModal('Upload Failed', err.message || 'Failed to upload greeting audio');
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleCanvasGreetingChange = async (fileName: string) => {
    if (!activeIvr) return;
    try {
      await apiService.updateIvr(token, activeIvr.id, { greeting_audio: fileName });
      setActiveIvr((prev: any) => ({ ...prev, greeting_audio: fileName }));
      loadData();
    } catch (err: any) {
      showErrorModal('Update Failed', err.message || 'Failed to update greeting audio');
    }
  };

  const handleCardAudioUpload = async (dtmf_key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeIvr) return;

    try {
      setUploadingTarget('keypad_' + dtmf_key);
      const fileName = await uploadAudioFile(file, 'ivr_prompt', activeIvr.tenant_id);
      const payload = {
        dtmf_key,
        action_type: 'play_audio',
        action_target: fileName
      };
      await apiService.upsertIvrNode(token, activeIvr.id, payload);
      const updatedNodes = await apiService.getIvrNodes(token, activeIvr.id);
      setActiveNodes(updatedNodes);
    } catch (err: any) {
      showErrorModal('Audio Upload Failed', err.message || 'Failed to upload audio file');
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleCardDrop = async (dtmf_key: string, actionType: string) => {
    if (!activeIvr) return;
    await handleCardActionChange(dtmf_key, actionType);
  };

  const handleModalAudioUpload = async (targetField: 'create' | 'edit', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingTarget('modal_' + targetField);
      const fileName = await uploadAudioFile(file, 'ivr_greeting', formData.tenant_id);
      setFormData(prev => ({ ...prev, greeting_audio: fileName }));
    } catch (err: any) {
      showErrorModal('Audio Upload Failed', err.message || 'Audio upload failed');
    } finally {
      setUploadingTarget(null);
    }
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      greeting_audio: audioFiles.length > 0 ? audioFiles[0].file_name : 'welcome_prompt.wav',
      direct_extension_dial: true,
      timeout: 10,
      tenant_id: ''
    });
    setShowCreateModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { ...formData };
      if (!payload.tenant_id) delete payload.tenant_id;
      await apiService.createIvr(token, payload);
      setShowCreateModal(false);
      showSuccessModal("IVR Flow Created", `IVR "${payload.name}" has been created successfully.`);
      loadData();
    } catch (err: any) {
      showErrorModal('Failed to Create IVR', err.message || 'Failed to create IVR flow');
    }
  };

  const openEditModal = (ivr: any) => {
    setActiveIvr(ivr);
    setFormData({
      name: ivr.name,
      greeting_audio: ivr.greeting_audio || 'welcome_prompt.wav',
      direct_extension_dial: ivr.direct_extension_dial ?? true,
      timeout: ivr.timeout || 10,
      tenant_id: ivr.tenant_id || ''
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIvr) return;
    try {
      const payload: any = { ...formData };
      if (!payload.tenant_id) payload.tenant_id = null;
      await apiService.updateIvr(token, activeIvr.id, payload);
      setShowEditModal(false);
      setActiveIvr(null);
      showSuccessModal("IVR Updated", `IVR settings have been saved successfully.`);
      loadData();
    } catch (err: any) {
      showErrorModal('Failed to Update IVR', err.message || 'Failed to update IVR menu');
    }
  };

  const dtmfKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  const openDesignerModal = async (ivr: any) => {
    setActiveIvr(ivr);
    try {
      const nodes = await apiService.getIvrNodes(token, ivr.id);
      setActiveNodes(nodes);
      setShowDesignerModal(true);
    } catch (err: any) {
      showErrorModal('Failed to Fetch Nodes', err.message || 'Failed to fetch nodes');
    }
  };

  const handleCardActionChange = async (dtmf_key: string, action_type: string) => {
    if (!activeIvr) return;
    if (!action_type) {
      const existingNode = activeNodes.find(n => n.dtmf_key === dtmf_key);
      if (existingNode) await handleDeleteNode(existingNode.id);
      return;
    }

    let defaultTarget = '';
    if (action_type === 'extension' && extensions.length > 0) defaultTarget = extensions[0].extension_number;
    if (action_type === 'queue' && queues.length > 0) defaultTarget = queues[0].name;
    if (action_type === 'play_audio' && audioFiles.length > 0) defaultTarget = audioFiles[0].file_name;
    if (action_type === 'voicemail') defaultTarget = extensions.length > 0 ? extensions[0].extension_number : '1001';
    if (action_type === 'hangup') defaultTarget = 'NORMAL_CLEARING';

    try {
      await apiService.upsertIvrNode(token, activeIvr.id, {
        dtmf_key,
        action_type,
        action_target: defaultTarget
      });
      const updated = await apiService.getIvrNodes(token, activeIvr.id);
      setActiveNodes(updated);
    } catch (err: any) {
      showErrorModal('Error', err.message || 'Action failed');
    }
  };

  const handleCardTargetChange = async (dtmf_key: string, action_type: string, action_target: string) => {
    if (!activeIvr) return;
    try {
      await apiService.upsertIvrNode(token, activeIvr.id, {
        dtmf_key,
        action_type,
        action_target
      });
      const updated = await apiService.getIvrNodes(token, activeIvr.id);
      setActiveNodes(updated);
    } catch (err: any) {
      showErrorModal('Error', err.message || 'Action failed');
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!activeIvr) return;
    try {
      await apiService.deleteIvrNode(token, activeIvr.id, nodeId);
      const updated = await apiService.getIvrNodes(token, activeIvr.id);
      setActiveNodes(updated);
    } catch (err: any) {
      showErrorModal('Error', err.message || 'Action failed');
    }
  };

  const handleDeleteIvr = async () => {
    if (!activeIvr) return;
    try {
      const ivrName = activeIvr.name;
      await apiService.deleteIvr(token, activeIvr.id);
      setShowDeleteModal(false);
      setActiveIvr(null);
      showSuccessModal("IVR Deleted", `IVR flow "${ivrName}" has been removed.`);
      loadData();
    } catch (err: any) {
      showErrorModal('Error', err.message || 'Action failed');
    }
  };

  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'TENANT_ADMIN';

  const getTenantName = (tId: string) => {
    const tenant = tenants.find(t => t.id === tId);
    return tenant ? tenant.name : 'Global Platform';
  };

  const columns = [
    {
      key: 'name',
      header: 'IVR Name',
      sortable: true,
      render: (ivr: any) => (
        <Inline gap="2">
          <GitBranch size={16} />
          <strong>{ivr.name}</strong>
        </Inline>
      ),
    },
    {
      key: 'tenant_id',
      header: 'Tenant',
      render: (ivr: any) => getTenantName(ivr.tenant_id),
    },
    {
      key: 'greeting_audio',
      header: 'Voice Greeting',
      render: (ivr: any) => (
        <Badge variant="neutral">
          <Volume2 size={12} /> {ivr.greeting_audio || 'welcome_prompt.wav'}
        </Badge>
      ),
    },
    {
      key: 'direct_extension_dial',
      header: 'Direct Ext Dial',
      render: (ivr: any) => (
        <Badge variant={ivr.direct_extension_dial ? 'success' : 'danger'}>
          {ivr.direct_extension_dial ? 'Enabled' : 'Disabled'}
        </Badge>
      ),
    },
    {
      key: 'timeout',
      header: 'Timeout',
      render: (ivr: any) => `${ivr.timeout || 10}s`,
    },
  ];

  return (
    <PageContainer
      title="Interactive Voice Response (IVR) Flows"
      subtitle="Configure inbound auto-attendants, voice greetings, and interactive keypress actions."
      eyebrow="Auto-Attendant Engine"
      actions={
        canManage ? (
          <Button variant="primary" onClick={openCreateModal} leftIcon={<Plus size={16} />}>
            Create IVR Flow
          </Button>
        ) : undefined
      }
    >
      <Stack gap="6">
        <Alert variant="info" title="Visual IVR Flow Builder & Audio Greetings">
          Click "Open Designer" on any IVR flow to open the interactive canvas where you can map keypress actions, upload audio greetings, and configure routing blocks.
        </Alert>

        <DataTable
          columns={columns}
          data={ivrs}
          isLoading={loading}
          emptyTitle="No IVR Flows Configured"
          emptyDescription={canManage ? 'Create your first auto-attendant flow to start routing incoming customer calls automatically.' : undefined}
          actions={(ivr: any) => (
            <Inline gap="2" justify="center" wrap={false}>
              <Button variant="secondary" size="sm" onClick={() => openDesignerModal(ivr)} title="Open Designer">
                <Palette size={14} />
              </Button>
              {canManage && (
                <>
                  <Button variant="secondary" size="sm" onClick={() => openEditModal(ivr)} title="Edit">
                    <Edit size={14} />
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => { setActiveIvr(ivr); setShowDeleteModal(true); }} title="Delete">
                    <Trash2 size={14} />
                  </Button>
                </>
              )}
            </Inline>
          )}
        />
      </Stack>

      {/* CREATE MODAL */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New IVR Flow"
        subtitle="Configure auto-attendant greeting and properties"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate}>Create IVR</Button>
          </>
        }
      >
        <Stack gap="4">
          <FormField label="IVR Menu Name" required>
            <Input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Main Company Directory"
            />
          </FormField>

          {user?.role === 'SUPER_ADMIN' && tenants.length > 0 && (
            <FormField label="Assign to Tenant">
              <Select
                value={formData.tenant_id}
                onChange={e => setFormData({ ...formData, tenant_id: e.target.value })}
              >
                <option value="">-- Global / System Default --</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </FormField>
          )}

          <FormField label="Audio Greeting File">
            <Inline gap="2">
              <Select
                value={formData.greeting_audio}
                onChange={e => setFormData({ ...formData, greeting_audio: e.target.value })}
              >
                {audioFiles.map(a => (
                  <option key={a.id} value={a.file_name}>{a.name} ({a.file_name})</option>
                ))}
                {audioFiles.length === 0 && <option value="welcome_prompt.wav">welcome_prompt.wav</option>}
              </Select>
              <label>
                <Button variant="secondary" size="sm" leftIcon={<UploadCloud size={14} />}>
                  {uploadingTarget === 'modal_create' ? 'Uploading...' : 'Upload File'}
                </Button>
                <input type="file" accept="audio/*" className="hidden" onChange={e => handleModalAudioUpload('create', e)} />
              </label>
            </Inline>
          </FormField>

          <Grid cols={2} gap="4">
            <FormField label="Timeout (seconds)">
              <Input
                type="number"
                value={String(formData.timeout)}
                onChange={e => setFormData({ ...formData, timeout: parseInt(e.target.value) || 10 })}
              />
            </FormField>
            <FormField label="Direct Ext Dial">
              <Select
                value={formData.direct_extension_dial ? 'true' : 'false'}
                onChange={e => setFormData({ ...formData, direct_extension_dial: e.target.value === 'true' })}
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </Select>
            </FormField>
          </Grid>
        </Stack>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit IVR Settings"
        subtitle="Modify flow name and default greeting audio"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleUpdate}>Save Changes</Button>
          </>
        }
      >
        <Stack gap="4">
          <FormField label="IVR Menu Name" required>
            <Input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </FormField>

          {user?.role === 'SUPER_ADMIN' && tenants.length > 0 && (
            <FormField label="Tenant Assignment">
              <Select
                value={formData.tenant_id}
                onChange={e => setFormData({ ...formData, tenant_id: e.target.value })}
              >
                <option value="">-- Global / System Default --</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </FormField>
          )}

          <FormField label="Audio Greeting File">
            <Inline gap="2">
              <Select
                value={formData.greeting_audio}
                onChange={e => setFormData({ ...formData, greeting_audio: e.target.value })}
              >
                {audioFiles.map(a => (
                  <option key={a.id} value={a.file_name}>{a.name} ({a.file_name})</option>
                ))}
                {audioFiles.length === 0 && <option value="welcome_prompt.wav">welcome_prompt.wav</option>}
              </Select>
              <label>
                <Button variant="secondary" size="sm" leftIcon={<UploadCloud size={14} />}>
                  {uploadingTarget === 'modal_edit' ? 'Uploading...' : 'Upload Audio'}
                </Button>
                <input type="file" accept="audio/*" className="hidden" onChange={e => handleModalAudioUpload('edit', e)} />
              </label>
            </Inline>
          </FormField>

          <Grid cols={2} gap="4">
            <FormField label="Timeout (seconds)">
              <Input
                type="number"
                value={String(formData.timeout)}
                onChange={e => setFormData({ ...formData, timeout: parseInt(e.target.value) || 10 })}
              />
            </FormField>
            <FormField label="Direct Ext Dial">
              <Select
                value={formData.direct_extension_dial ? 'true' : 'false'}
                onChange={e => setFormData({ ...formData, direct_extension_dial: e.target.value === 'true' })}
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </Select>
            </FormField>
          </Grid>
        </Stack>
      </Modal>

      {/* DESIGNER MODAL */}
      <Modal
        isOpen={showDesignerModal && !!activeIvr}
        onClose={() => setShowDesignerModal(false)}
        title={`Visual Flow Builder: ${activeIvr?.name || ''}`}
        subtitle="Configure DTMF keypad actions and greeting prompts"
        maxWidth="lg"
        footer={<Button variant="secondary" onClick={() => setShowDesignerModal(false)}>Close Designer</Button>}
      >
        <Stack gap="4">
          <Alert variant="info" title="Interactive Keypad Mapping">
            Select a keypad digit below to assign call routing targets (extensions, queues, voicemail, or audio playback).
          </Alert>

          <Card padding="sm" className="bg-slate-50">
            <Inline justify="between" align="center">
              <div>
                <div className="text-xs font-bold text-slate-900">IVR Entry Greeting Audio</div>
                <div className="text-[11px] text-slate-500">Active prompt played when caller enters this IVR menu</div>
              </div>
              <Inline gap="2" align="center">
                <Select
                  value={activeIvr?.greeting_audio || ''}
                  onChange={e => handleCanvasGreetingChange(e.target.value)}
                  className="w-56"
                >
                  {audioFiles.map(a => (
                    <option key={a.id} value={a.file_name}>{a.name} ({a.file_name})</option>
                  ))}
                </Select>
                <label className="cursor-pointer">
                  <Button variant="secondary" size="sm" leftIcon={<UploadCloud size={14} />}>
                    {uploadingTarget === 'canvas_greeting' ? 'Uploading...' : 'Upload Prompt'}
                  </Button>
                  <input type="file" accept="audio/*" className="hidden" onChange={handleCanvasGreetingUpload} />
                </label>
              </Inline>
            </Inline>
          </Card>

          <Grid cols={3} gap="4">
            {dtmfKeys.map(key => {
              const node = activeNodes.find(n => n.dtmf_key === key);
              return (
                <div
                  key={key}
                  onDragOver={(e: React.DragEvent) => e.preventDefault()}
                  onDrop={() => handleCardDrop(key, 'extension')}
                >
                  <Stack gap="2">
                  <Inline gap="2">
                    <Badge variant={node ? 'primary' : 'neutral'}>Key {key}</Badge>
                    {node && (
                      <Button variant="danger" size="sm" onClick={() => handleDeleteNode(node.id)}>Remove</Button>
                    )}
                  </Inline>

                  <Select
                    value={node ? node.action_type : ''}
                    onChange={e => handleCardActionChange(key, e.target.value)}
                  >
                    <option value="">-- Select Action --</option>
                    <option value="extension">➔ Transfer Extension</option>
                    <option value="queue">➔ Transfer Call Queue</option>
                    <option value="play_audio">➔ Play Audio Prompt</option>
                    <option value="voicemail">➔ Send to Voicemail</option>
                    <option value="hangup">➔ Hangup Call</option>
                  </Select>

                  {node && (
                    <>
                      {node.action_type === 'extension' && (
                        <Select
                          value={node.action_target}
                          onChange={e => handleCardTargetChange(key, 'extension', e.target.value)}
                        >
                          {extensions.map(ext => (
                            <option key={ext.id || ext.extension_number} value={ext.extension_number}>
                              Ext {ext.extension_number} ({ext.display_name || 'User'})
                            </option>
                          ))}
                        </Select>
                      )}

                      {node.action_type === 'queue' && (
                        <Select
                          value={node.action_target}
                          onChange={e => handleCardTargetChange(key, 'queue', e.target.value)}
                        >
                          {queues.map(q => (
                            <option key={q.id || q.name} value={q.name}>
                              Queue: {q.name}
                            </option>
                          ))}
                        </Select>
                      )}

                      {node.action_type === 'play_audio' && (
                        <Stack gap="1">
                          <Select
                            value={node.action_target}
                            onChange={e => handleCardTargetChange(key, 'play_audio', e.target.value)}
                          >
                            {audioFiles.map(a => (
                              <option key={a.id} value={a.file_name}>{a.name} ({a.file_name})</option>
                            ))}
                          </Select>
                          <label className="text-[10px] text-[var(--pbx-action-primary)] font-bold cursor-pointer inline-flex items-center gap-1 bg-amber-50 px-2 py-1 rounded border border-amber-200 justify-center">
                            <UploadCloud size={12} /> {uploadingTarget === 'keypad_' + key ? 'Uploading...' : 'Upload New Audio'}
                            <input type="file" accept="audio/*" className="hidden" onChange={e => handleCardAudioUpload(key, e)} />
                          </label>
                        </Stack>
                      )}

                      {node.action_type === 'voicemail' && (
                        <Input
                          value={node.action_target}
                          onChange={e => handleCardTargetChange(key, 'voicemail', e.target.value)}
                          placeholder="Ext number..."
                        />
                      )}
                    </>
                  )}
                </Stack>
              </div>
            );
          })}
          </Grid>
        </Stack>
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={showDeleteModal && !!activeIvr}
        onClose={() => setShowDeleteModal(false)}
        title="Delete IVR Menu"
        subtitle="Are you sure you want to delete this IVR flow?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteIvr}>Delete</Button>
          </>
        }
      >
        <p>
          Are you sure you want to delete <strong>{activeIvr?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </PageContainer>
  );
};
