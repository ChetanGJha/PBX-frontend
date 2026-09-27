import React, { useState, useEffect, useMemo } from 'react';
import { Voicemail, Mail, RefreshCw, Edit2, Plus, Search } from 'lucide-react';
import { apiService } from '../services/api';
import { useToast } from './ToastProvider';
import type { User } from '../types';

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

  // Tenant-scoped extensions
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

  const filtered = boxes.filter(b =>
    b.extension_number.includes(search) ||
    (b.display_name && b.display_name.toLowerCase().includes(search.toLowerCase())) ||
    (b.email_address && b.email_address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Unified Messaging</div>
          <h1 className="page-title">Voicemail Management</h1>
          <p className="page-sub">Configure extension voicemail boxes, PIN codes, audio greetings, and email notifications</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchData} className="btn-secondary" title="Refresh">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={openCreateModal} className="btn-primary">
            <Plus size={16} /> Setup Voicemail Box
          </button>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              className="form-control"
              style={{ paddingLeft: '36px', height: '38px', fontSize: '12px' }}
              placeholder="Search voicemail boxes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#6B7280' }}>
            Total <strong>{filtered.length}</strong> mailbox{filtered.length !== 1 ? 'es' : ''}
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Extension / Mailbox</th>
                <th>Status</th>
                <th>Email Delivery</th>
                <th>Attachment</th>
                <th>Auto-Purge</th>
                <th>Greeting Audio</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-4">Loading voicemail boxes...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-4 text-muted">No voicemail boxes configured yet</td></tr>
              ) : (
                filtered.map(b => (
                  <tr key={b.extension_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#FFF0EC', color: '#FF5430', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Voicemail size={14} />
                        </div>
                        <div>
                          <strong style={{ color: '#111827', fontSize: '13px' }}>ext/{b.extension_number}</strong>
                          {b.display_name && <div style={{ fontSize: '11px', color: '#6B7280' }}>{b.display_name}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`terrix-badge ${b.voicemail_box_id ? 'green' : 'grey'}`}>
                        {b.voicemail_box_id ? 'ACTIVE' : 'DEFAULT'}
                      </span>
                    </td>
                    <td>
                      {b.email_notification && (b.email_address || b.extension_email) ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#16A34A' }}>
                          <Mail size={13} />
                          <span>{b.email_address || b.extension_email}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Disabled</span>
                      )}
                    </td>
                    <td>
                      <span className={`terrix-badge ${b.email_attach_file ? 'orange' : 'grey'}`}>
                        {b.email_attach_file ? 'WAV ATTACHED' : 'NOTIFICATION ONLY'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: b.delete_after_email ? '#DC2626' : '#6B7280' }}>
                        {b.delete_after_email ? 'Delete on send' : 'Retain in box'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#4B5563', fontFamily: 'monospace' }}>
                        {b.greeting_path ? b.greeting_path.split('/').pop() : 'Standard Greeting'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '5px 10px', fontSize: '11px' }}
                        onClick={() => openEditModal(b)}
                      >
                        <Edit2 size={13} style={{ marginRight: '4px' }} /> Configure
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Setup / Configure Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="terrix-modal" style={{ maxWidth: '580px' }}>
            <div className="modal-head">
              <div className="modal-icon"><Voicemail size={20} /></div>
              <div>
                <h3>Configure Voicemail Box</h3>
                <p>Manage mailbox PIN, email attachments, and custom audio greetings</p>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label required">Select Extension</label>
                    <select
                      className="form-control"
                      value={selectedExtId}
                      onChange={e => handleExtensionChange(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Extension --</option>
                      {tenantExtensions.map(e => (
                        <option key={e.id} value={e.id}>
                          ext/{e.extension_number} — {e.display_name || 'Extension'} {e.email ? `(${e.email})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Mailbox PIN (4-10 Digits)</label>
                    <input
                      type="password"
                      required
                      minLength={4}
                      maxLength={10}
                      className="form-control"
                      value={mailboxPin}
                      onChange={e => setMailboxPin(e.target.value)}
                      placeholder="e.g. 1234"
                    />
                    <small style={{ color: '#6B7280', fontSize: '10.5px', marginTop: '3px' }}>
                      Default subscriber pin: 1234
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Custom Greeting Prompt</label>
                    <select
                      className="form-control"
                      value={greetingPath}
                      onChange={e => setGreetingPath(e.target.value)}
                    >
                      <option value="">-- System Default Greeting --</option>
                      {audioFiles.map(a => (
                        <option key={a.id} value={a.file_path || a.file_name}>
                          {a.name || a.file_name} ({a.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Notification Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={emailAddress}
                      onChange={e => setEmailAddress(e.target.value)}
                      placeholder="agent@company.com"
                    />
                  </div>

                  {/* Toggles */}
                  <div className="form-group" style={{ gridColumn: '1 / -1', background: '#F8FAFC', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '8px' }}>
                      <input
                        type="checkbox"
                        checked={emailNotification}
                        onChange={e => setEmailNotification(e.target.checked)}
                        style={{ accentColor: '#FF5430', width: '16px', height: '16px' }}
                      />
                      <div>
                        <strong style={{ fontSize: '12.5px', color: '#111827' }}>Send Email Notification on New Voicemail</strong>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>Dispatches SMTP alert when caller leaves a message</div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '8px' }}>
                      <input
                        type="checkbox"
                        checked={emailAttachFile}
                        onChange={e => setEmailAttachFile(e.target.checked)}
                        style={{ accentColor: '#FF5430', width: '16px', height: '16px' }}
                      />
                      <div>
                        <strong style={{ fontSize: '12.5px', color: '#111827' }}>Attach Audio Recording (.wav) to Email</strong>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>Enables listening to voicemail directly from mobile email</div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={deleteAfterEmail}
                        onChange={e => setDeleteAfterEmail(e.target.checked)}
                        style={{ accentColor: '#FF5430', width: '16px', height: '16px' }}
                      />
                      <div>
                        <strong style={{ fontSize: '12.5px', color: '#111827' }}>Delete from Server After Successful Email</strong>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>Prevents mailbox disk quota exhaustion</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Voicemail Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
