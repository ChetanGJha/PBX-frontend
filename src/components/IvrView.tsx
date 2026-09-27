import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useToast } from './ToastProvider';
import { CustomSelect } from './CustomSelect';
import { GitBranch, Plus, Volume2, Edit, Trash2, ArrowRight, PhoneCall, Layers, Move, Users, PhoneForwarded, Voicemail, PhoneOff, X, UploadCloud, Info } from 'lucide-react';

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
  const [draggedActionType, setDraggedActionType] = useState<string | null>(null);

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

  const handleCardDrop = async (dtmf_key: string, actionType: string) => {
    if (!activeIvr) return;
    await handleCardActionChange(dtmf_key, actionType);
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

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GitBranch style={{ color: '#FF5722' }} size={28} /> Interactive Voice Response (IVR) Flows
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
            Configure inbound auto-attendants, voice greetings, and interactive keypress actions.
          </p>
        </div>
        {canManage && (
          <button className="btn-primary" onClick={openCreateModal} style={{ background: '#FF5722', border: 'none' }}>
            <Plus size={18} /> Create IVR Flow
          </button>
        )}
      </div>

      {/* Quick Help Card */}
      <div style={{ background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)', border: '1px solid #FFCC80', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ background: '#FF5722', color: '#FFF', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Info size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#D84315' }}>How to Design IVR & Upload Audio Greetings:</h4>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#5D4037' }}>
            Click <strong>"🎨 Open Designer"</strong> on any IVR flow below. You can select actions directly from dropdowns on each keypad card, upload custom audio greetings directly in Step 2 of the designer canvas, or drag routing blocks onto keypad cards!
          </p>
        </div>
      </div>

      {/* IVR List Table */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Loading IVR flows...</div>
      ) : ivrs.length === 0 ? (
        <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
          <GitBranch size={48} style={{ color: '#CBD5E1', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>No IVR Flows Configured</h3>
          <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '20px' }}>
            Create your first auto-attendant flow to start routing incoming customer calls automatically.
          </p>
          {canManage && (
            <button className="btn-primary" onClick={openCreateModal} style={{ background: '#FF5722' }}>
              <Plus size={16} /> Create First IVR
            </button>
          )}
        </div>
      ) : (
        <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                <th style={{ padding: '14px 20px' }}>IVR NAME</th>
                <th style={{ padding: '14px 20px' }}>TENANT</th>
                <th style={{ padding: '14px 20px' }}>VOICE GREETING</th>
                <th style={{ padding: '14px 20px' }}>DIRECT EXT DIAL</th>
                <th style={{ padding: '14px 20px' }}>TIMEOUT</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {ivrs.map(ivr => (
                <tr key={ivr.id} style={{ borderBottom: '1px solid #F1F5F9', fontSize: '14px' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 700, color: '#0F172A' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <GitBranch size={16} style={{ color: '#FF5722' }} />
                      {ivr.name}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', color: '#475569' }}>{getTenantName(ivr.tenant_id)}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', color: '#334155', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                      <Volume2 size={14} style={{ color: '#FF5722' }} /> {ivr.greeting_audio || 'welcome_prompt.wav'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {ivr.direct_extension_dial ? (
                      <span style={{ color: '#166534', background: '#DCFCE7', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Enabled</span>
                    ) : (
                      <span style={{ color: '#991B1B', background: '#FEE2E2', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Disabled</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', color: '#64748B' }}>{ivr.timeout || 10}s</td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button className="btn-secondary sm" onClick={() => openDesignerModal(ivr)} style={{ background: '#FFF3E0', border: '1px solid #FFCC80', color: '#E65100', fontWeight: 700 }}>
                        🎨 Open Designer
                      </button>
                      {canManage && (
                        <>
                          <button className="btn-secondary sm" onClick={() => openEditModal(ivr)}>
                            <Edit size={14} />
                          </button>
                          <button className="btn-danger sm" onClick={() => { setActiveIvr(ivr); setShowDeleteModal(true); }}>
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="terrix-modal" style={{ maxWidth: '520px' }}>
            <div className="modal-head">
              <div className="modal-icon orange"><GitBranch size={20} /></div>
              <div>
                <h3>Create New IVR Flow</h3>
                <p>Configure auto-attendant greeting and properties</p>
              </div>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label required">IVR Menu Name</label>
                  <input className="form-control" required placeholder="e.g. Main Company Directory" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                {user?.role === 'SUPER_ADMIN' && tenants.length > 0 && (
                  <div>
                    <label className="form-label">Assign to Tenant</label>
                    <CustomSelect
                      options={[
                        { value: '', label: '-- Global / System Default --' },
                        ...tenants.map(t => ({ value: t.id, label: t.name }))
                      ]}
                      value={formData.tenant_id}
                      onChange={val => setFormData({ ...formData, tenant_id: val })}
                    />
                  </div>
                )}
                <div>
                  <label className="form-label">Audio Greeting File</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select className="form-control" value={formData.greeting_audio} onChange={e => setFormData({ ...formData, greeting_audio: e.target.value })} style={{ flex: 1 }}>
                      {audioFiles.map(a => (<option key={a.id} value={a.file_name}>{a.name} ({a.file_name})</option>))}
                      {audioFiles.length === 0 && <option value="welcome_prompt.wav">welcome_prompt.wav</option>}
                    </select>
                    <label className="btn-secondary" style={{ cursor: 'pointer', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', background: '#FFF3E0', color: '#E65100', border: '1px solid #FFB74D', fontWeight: 600, fontSize: '13px' }}>
                      <UploadCloud size={16} /> {uploadingTarget === 'modal_create' ? 'Uploading...' : 'Upload File'}
                      <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => handleModalAudioUpload('create', e)} />
                    </label>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Timeout (seconds)</label>
                    <input type="number" className="form-control" min="3" max="60" value={formData.timeout} onChange={e => setFormData({ ...formData, timeout: parseInt(e.target.value) || 10 })} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingTop: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                      <input type="checkbox" checked={formData.direct_extension_dial} onChange={e => setFormData({ ...formData, direct_extension_dial: e.target.checked })} />
                      Allow Direct Ext Dial
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: '#FF5722' }}>Create IVR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="terrix-modal" style={{ maxWidth: '520px' }}>
            <div className="modal-head">
              <div className="modal-icon orange"><Edit size={20} /></div>
              <div>
                <h3>Edit IVR Settings</h3>
                <p>Modify flow name and default greeting audio</p>
              </div>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label required">IVR Menu Name</label>
                  <input className="form-control" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                {user?.role === 'SUPER_ADMIN' && tenants.length > 0 && (
                  <div>
                    <label className="form-label">Tenant Assignment</label>
                    <CustomSelect
                      options={[
                        { value: '', label: '-- Global / System Default --' },
                        ...tenants.map(t => ({ value: t.id, label: t.name }))
                      ]}
                      value={formData.tenant_id}
                      onChange={val => setFormData({ ...formData, tenant_id: val })}
                    />
                  </div>
                )}
                <div>
                  <label className="form-label">Audio Greeting File</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select className="form-control" value={formData.greeting_audio} onChange={e => setFormData({ ...formData, greeting_audio: e.target.value })} style={{ flex: 1 }}>
                      {audioFiles.map(a => (<option key={a.id} value={a.file_name}>{a.name} ({a.file_name})</option>))}
                      {audioFiles.length === 0 && <option value="welcome_prompt.wav">welcome_prompt.wav</option>}
                    </select>
                    <label className="btn-secondary" style={{ cursor: 'pointer', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', background: '#FFF3E0', color: '#E65100', border: '1px solid #FFB74D', fontWeight: 600, fontSize: '13px' }}>
                      <UploadCloud size={16} /> {uploadingTarget === 'modal_edit' ? 'Uploading...' : 'Upload Audio'}
                      <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => handleModalAudioUpload('edit', e)} />
                    </label>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Timeout (seconds)</label>
                    <input type="number" className="form-control" min="3" max="60" value={formData.timeout} onChange={e => setFormData({ ...formData, timeout: parseInt(e.target.value) || 10 })} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingTop: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                      <input type="checkbox" checked={formData.direct_extension_dial} onChange={e => setFormData({ ...formData, direct_extension_dial: e.target.checked })} />
                      Allow Direct Ext Dial
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: '#FF5722' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DESIGNER MODAL */}
      {showDesignerModal && activeIvr && (
        <div className="modal-backdrop">
          <div className="terrix-modal" style={{ maxWidth: '980px', width: '95vw' }}>
            <div className="modal-head">
              <div className="modal-icon orange"><GitBranch size={22} /></div>
              <div>
                <h3>Visual Drag & Drop Flow Builder: {activeIvr.name}</h3>
                <p>Drag routing blocks onto keypad slots or select DTMF actions directly below</p>
              </div>
              <button className="modal-close" onClick={() => setShowDesignerModal(false)}>✕</button>
            </div>
            
            <div className="modal-body" style={{ padding: '20px' }}>
              
              {/* Call Tree Header Banner */}
              <div style={{ background: '#0F172A', borderRadius: '12px', padding: '16px 20px', color: '#FFF', marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={14} /> LIVE VISUAL CALL TREE CANVAS
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  
                  {/* Step 1 */}
                  <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <PhoneCall size={18} style={{ color: '#38BDF8' }} />
                    <div>
                      <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700 }}>STEP 1: CALL INBOUND</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#F8FAFC' }}>Caller Dials DID</div>
                    </div>
                  </div>

                  <ArrowRight size={16} style={{ color: '#64748B' }} />

                  {/* Step 2 Greeting */}
                  <div style={{ background: '#1E293B', border: '1px solid #38BDF8', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Volume2 size={18} style={{ color: '#38BDF8' }} />
                    <div>
                      <div style={{ fontSize: '10px', color: '#38BDF8', fontWeight: 700 }}>STEP 2: AUDIO GREETING</div>
                        <div style={{ minWidth: '220px' }}>
                          <CustomSelect
                            options={
                              audioFiles.length > 0
                                ? audioFiles.map(a => ({ value: a.file_name, label: `${a.name} (${a.file_name})` }))
                                : [{ value: 'welcome_prompt.wav', label: 'welcome_prompt.wav' }]
                            }
                            value={activeIvr.greeting_audio || ''}
                            onChange={val => handleCanvasGreetingChange(val)}
                          />
                        </div>
                        <label style={{ background: '#38BDF8', color: '#0F172A', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <UploadCloud size={12} /> {uploadingTarget === 'canvas_greeting' ? 'Uploading...' : 'Upload Audio'}
                          <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={handleCanvasGreetingUpload} />
                        </label>
                      </div>
                    </div>

                  <ArrowRight size={16} style={{ color: '#64748B' }} />

                  {/* Step 3 Keypad */}
                  <div style={{ background: '#FF5722', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <GitBranch size={18} style={{ color: '#FFF' }} />
                    <div>
                      <div style={{ fontSize: '10px', color: '#FFE0B2', fontWeight: 700 }}>STEP 3: KEYPAD INPUT</div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#FFF' }}>{activeNodes.length} Keypress Actions Mapped</div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Main Builder Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '16px' }}>
                
                {/* Left Panel: Draggable Action Blocks */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Move size={14} /> Drag Routing Blocks
                  </div>
                  <p style={{ fontSize: '11px', color: '#64748B', marginBottom: '12px' }}>
                    Drag any block onto a keypad slot on the right:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div
                      draggable
                      onDragStart={() => setDraggedActionType('extension')}
                      style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '10px 12px', cursor: 'grab', fontSize: '12px', fontWeight: 600, color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <PhoneForwarded size={14} /> Transfer Extension
                    </div>
                    <div
                      draggable
                      onDragStart={() => setDraggedActionType('queue')}
                      style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '10px 12px', cursor: 'grab', fontSize: '12px', fontWeight: 600, color: '#15803D', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Users size={14} /> Transfer Call Queue
                    </div>
                    <div
                      draggable
                      onDragStart={() => setDraggedActionType('play_audio')}
                      style={{ background: '#FEFCE8', border: '1px solid #FEF08A', borderRadius: '8px', padding: '10px 12px', cursor: 'grab', fontSize: '12px', fontWeight: 600, color: '#A16207', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Volume2 size={14} /> Play Audio File
                    </div>
                    <div
                      draggable
                      onDragStart={() => setDraggedActionType('voicemail')}
                      style={{ background: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: '8px', padding: '10px 12px', cursor: 'grab', fontSize: '12px', fontWeight: 600, color: '#7E22CE', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Voicemail size={14} /> Send to Voicemail
                    </div>
                    <div
                      draggable
                      onDragStart={() => setDraggedActionType('hangup')}
                      style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 12px', cursor: 'grab', fontSize: '12px', fontWeight: 600, color: '#B91C1C', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <PhoneOff size={14} /> Hangup Call
                    </div>
                  </div>
                </div>

                {/* Right Panel: Keypad Grid */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>Keypad Slots & Drop Targets</div>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>Drag blocks from left or select action directly below</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    {dtmfKeys.map(key => {
                      const node = activeNodes.find(n => n.dtmf_key === key);
                      const isUploading = uploadingTarget === 'keypad_' + key;

                      return (
                        <div
                          key={key}
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => {
                            e.preventDefault();
                            if (draggedActionType) {
                              handleCardDrop(key, draggedActionType);
                              setDraggedActionType(null);
                            }
                          }}
                          style={{
                            background: node ? '#FFFFFF' : '#F8FAFC',
                            border: node ? '2px solid #FF5722' : '2px dashed #CBD5E1',
                            borderRadius: '10px',
                            padding: '12px',
                            minHeight: '120px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ background: node ? '#FF5722' : '#0F172A', color: '#FFF', width: '28px', height: '28px', borderRadius: '7px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                              {key}
                            </div>
                            {node && (
                              <button type="button" className="btn-danger sm" onClick={() => handleDeleteNode(node.id)} style={{ padding: '3px 6px', fontSize: '11px' }}>
                                <X size={12} />
                              </button>
                            )}
                          </div>

                          <div style={{ marginBottom: '8px' }}>
                            <CustomSelect
                              options={[
                                { value: '', label: '-- Select Action or Drop Block --' },
                                { value: 'extension', label: '➔ Transfer Extension' },
                                { value: 'queue', label: '➔ Transfer Call Queue' },
                                { value: 'play_audio', label: '➔ Play Audio Prompt' },
                                { value: 'voicemail', label: '➔ Send to Voicemail' },
                                { value: 'hangup', label: '➔ Hangup Call' }
                              ]}
                              value={node ? node.action_type : ''}
                              onChange={val => handleCardActionChange(key, val)}
                            />
                          </div>

                          {node && (
                            <div>
                              {node.action_type === 'extension' && (
                                <CustomSelect
                                  options={
                                    extensions.length === 0
                                      ? [{ value: '1001', label: 'Ext 1001' }]
                                      : extensions.map(ext => ({
                                          value: ext.extension_number,
                                          label: `Ext ${ext.extension_number} (${ext.first_name || 'User'})`
                                        }))
                                  }
                                  value={node.action_target}
                                  onChange={val => handleCardTargetChange(key, 'extension', val)}
                                />
                              )}

                              {node.action_type === 'queue' && (
                                <CustomSelect
                                  options={
                                    queues.length === 0
                                      ? [{ value: 'Support', label: 'Support Queue' }]
                                      : queues.map(q => ({
                                          value: q.name,
                                          label: `Queue: ${q.name}`
                                        }))
                                  }
                                  value={node.action_target}
                                  onChange={val => handleCardTargetChange(key, 'queue', val)}
                                />
                              )}

                              {node.action_type === 'play_audio' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <CustomSelect
                                    options={audioFiles.map(a => ({
                                      value: a.file_name,
                                      label: `${a.name} (${a.file_name})`
                                    }))}
                                    value={node.action_target}
                                    onChange={val => handleCardTargetChange(key, 'play_audio', val)}
                                  />
                                  <label style={{ fontSize: '10px', color: '#FF5722', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: '#FFF3E0', padding: '4px 6px', borderRadius: '5px', border: '1px dashed #FFB74D' }}>
                                    <UploadCloud size={12} /> {isUploading ? 'Uploading...' : 'Upload New Audio'}
                                    <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => handleCardAudioUpload(key, e)} />
                                  </label>
                                </div>
                              )}

                              {node.action_type === 'voicemail' && (
                                <input
                                  style={{ width: '100%', fontSize: '11px', padding: '4px 6px', borderRadius: '6px', border: '1px solid #E2E8F0' }}
                                  placeholder="Ext number"
                                  value={node.action_target}
                                  onChange={e => handleCardTargetChange(key, 'voicemail', e.target.value)}
                                />
                              )}

                              {node.action_type === 'hangup' && (
                                <div style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600 }}>Hangup (NORMAL_CLEARING)</div>
                              )}
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>
            <div className="modal-foot">
              <button type="button" className="btn-secondary" onClick={() => setShowDesignerModal(false)}>Close Designer</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && activeIvr && (
        <div className="modal-backdrop">
          <div className="terrix-modal" style={{ maxWidth: '440px' }}>
            <div className="modal-head">
              <div className="modal-icon red"><Trash2 size={20} /></div>
              <div>
                <h3>Delete IVR Menu</h3>
                <p>Are you sure?</p>
              </div>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '14px', color: '#475569' }}>
                Are you sure you want to delete <strong>{activeIvr.name}</strong>?
              </p>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button type="button" className="btn-danger" onClick={handleDeleteIvr}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
