import React, { useState, useEffect } from 'react';
import { Voicemail, Mail, Key, RefreshCw, Edit2, AlertCircle, X, Music, Plus } from 'lucide-react';
import { apiService } from '../services/api';
import { useToast } from './ToastProvider';

interface VoicemailViewProps {
  token: string | null;
  user?: any;
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

export const VoicemailView: React.FC<VoicemailViewProps> = ({ token }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [boxes, setBoxes] = useState<VoicemailBoxItem[]>([]);
  const [audioFiles, setAudioFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [editingBox, setEditingBox] = useState<VoicemailBoxItem | null>(null);
  const [mailboxPin, setMailboxPin] = useState('');
  const [emailNotification, setEmailNotification] = useState(true);
  const [emailAttachFile, setEmailAttachFile] = useState(true);
  const [emailAddress, setEmailAddress] = useState('');
  const [deleteAfterEmail, setDeleteAfterEmail] = useState(false);
  const [greetingPath, setGreetingPath] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [vmData, audios] = await Promise.allSettled([
        apiService.getVoicemailBoxesAll(token),
        apiService.getAudioFiles(token),
      ]);

      if (vmData.status === 'fulfilled') {
        setBoxes(vmData.value);
      } else {
        setError('Failed to load voicemail boxes');
      }

      if (audios.status === 'fulfilled') {
        setAudioFiles(audios.value);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const openCreateModal = () => {
    const firstBox = boxes.length > 0 ? boxes[0] : null;
    if (firstBox) {
      openEditModal(firstBox);
    } else {
      showErrorModal('No Extensions Found', 'Please provision a SIP extension first before configuring voicemail.');
    }
  };

  const openEditModal = (box: VoicemailBoxItem) => {
    setEditingBox(box);
    setMailboxPin('1234');
    setEmailNotification(box.email_notification ?? true);
    setEmailAttachFile(box.email_attach_file ?? true);
    setEmailAddress(box.email_address || box.extension_email || '');
    setDeleteAfterEmail(box.delete_after_email ?? false);
    setGreetingPath(box.greeting_path || '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingBox) return;
    setSaving(true);
    setError(null);
    try {
      await apiService.updateExtensionVoicemail(token, editingBox.extension_id, {
        mailbox: editingBox.mailbox || editingBox.extension_number,
        password: mailboxPin || undefined,
        email_notification: emailNotification,
        email_attach_file: emailAttachFile,
        email_address: emailAddress || undefined,
        delete_after_email: deleteAfterEmail,
        greeting_path: greetingPath || undefined,
      });

      showSuccessModal(
        'Voicemail Configured Successfully',
        `Voicemail box settings for ext/${editingBox.extension_number} have been updated.`
      );
      setEditingBox(null);
      fetchData();
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err.message || JSON.stringify(err);
      setError(msg);
      showErrorModal('Voicemail Configuration Failed', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <div className="eyebrow">Voice Messaging Engine</div>
          <h1 className="page-title">Voicemail Management</h1>
          <p className="page-sub">
            Configure voicemail boxes, voicemail-to-email routing with MP3 audio delivery, PIN protection, and custom audio greetings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn-secondary" title="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button onClick={openCreateModal} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} />
            <span>Configure Voicemail Box</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Voicemail className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{boxes.length}</div>
            <div className="text-xs text-slate-500 font-medium">Configured Voicemail Boxes</div>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              {boxes.filter(b => b.email_notification).length}
            </div>
            <div className="text-xs text-slate-500 font-medium">Email Forwarding Enabled</div>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              {audioFiles.length}
            </div>
            <div className="text-xs text-slate-500 font-medium">Available Audio Greetings</div>
          </div>
        </div>
      </div>

      {/* Boxes Table */}
      <div className="card overflow-hidden">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Extension</th>
                <th>Display Name</th>
                <th>Mailbox Number</th>
                <th>Voicemail-to-Email</th>
                <th>Email Address</th>
                <th>Attach MP3</th>
                <th>Auto-Purge after Send</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {boxes.map((box) => (
                <tr key={box.extension_id}>
                  <td className="font-bold text-slate-900">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 font-mono text-xs text-slate-800">
                      ext/{box.extension_number}
                    </span>
                  </td>
                  <td className="font-medium text-slate-800">{box.display_name}</td>
                  <td className="font-mono text-xs text-slate-600">{box.mailbox || box.extension_number}</td>
                  <td>
                    <span className={`terrix-badge ${box.email_notification ? 'green' : 'grey'}`}>
                      {box.email_notification ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-slate-600">
                    {box.email_address || box.extension_email || '—'}
                  </td>
                  <td>
                    <span className={`terrix-badge ${box.email_attach_file ? 'blue' : 'grey'}`}>
                      {box.email_attach_file ? 'Yes (.wav/.mp3)' : 'No (Alert only)'}
                    </span>
                  </td>
                  <td>
                    <span className={`terrix-badge ${box.delete_after_email ? 'orange' : 'grey'}`}>
                      {box.delete_after_email ? 'Purge on Email' : 'Keep on PBX'}
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => openEditModal(box)}
                      className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1 inline-flex"
                      title="Configure Voicemail Box"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Configure</span>
                    </button>
                  </td>
                </tr>
              ))}
              {boxes.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                    No extensions found for this tenant. Create extensions first to manage voicemail boxes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingBox && (
        <div className="modal-backdrop">
          <div className="terrix-modal max-w-lg">
            <div className="modal-head">
              <div className="modal-icon">
                <Voicemail className="w-5 h-5" />
              </div>
              <div>
                <h3>Configure Voicemail: ext/{editingBox.extension_number}</h3>
                <p>{editingBox.display_name} — Mailbox #{editingBox.mailbox || editingBox.extension_number}</p>
              </div>
              <button onClick={() => setEditingBox(null)} className="modal-close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="form-label">Voicemail Access PIN (4-10 digits)</label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      maxLength={10}
                      placeholder="e.g. 1234"
                      value={mailboxPin}
                      onChange={(e) => setMailboxPin(e.target.value)}
                      className="form-control pl-9 font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Dial *97 or dial voicemail extension to listen using this PIN.</p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-slate-800">
                    <input
                      type="checkbox"
                      checked={emailNotification}
                      onChange={(e) => setEmailNotification(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span>Enable Voicemail-to-Email Delivery</span>
                  </label>
                </div>

                {emailNotification && (
                  <div className="space-y-3 pl-6 border-l-2 border-blue-200">
                    <div>
                      <label className="form-label">Notification Email Address</label>
                      <input
                        type="email"
                        placeholder="user@example.com"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        className="form-control"
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={emailAttachFile}
                        onChange={(e) => setEmailAttachFile(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span>Attach Audio Recording File (.wav/.mp3) to Email</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={deleteAfterEmail}
                        onChange={(e) => setDeleteAfterEmail(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span>Delete voicemail from PBX storage after email delivery</span>
                    </label>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100">
                  <label className="form-label">Custom Greeting Audio Prompt</label>
                  <select
                    value={greetingPath}
                    onChange={(e) => setGreetingPath(e.target.value)}
                    className="form-control"
                  >
                    <option value="">-- Default System Greeting --</option>
                    {audioFiles.map((af: any) => (
                      <option key={af.id} value={af.file_path}>
                        {af.name || af.filename} ({af.category || 'audio'})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Upload audio prompts under <b>Audio Prompts</b> tab to use here.
                  </p>
                </div>
              </div>

              <div className="modal-foot">
                <button type="button" onClick={() => setEditingBox(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
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
