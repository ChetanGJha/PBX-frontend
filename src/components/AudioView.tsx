import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Mic, Upload, Play, Pause } from 'lucide-react';

interface AudioViewProps {
  token: string;
  user?: User | null;
}

export const AudioView: React.FC<AudioViewProps> = ({ token, user }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [audioFiles, setAudioFiles] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState('ivr_greeting');
  const [tenantId, setTenantId] = useState(user?.tenant_id || '');

  const loadData = async () => {
    try {
      setLoading(true);
      const [aData, tData] = await Promise.allSettled([
        apiService.getAudioFiles(token),
        apiService.getTenants(token)
      ]);
      if (aData.status === 'fulfilled') setAudioFiles(aData.value);
      if (tData.status === 'fulfilled') setTenants(tData.value);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);

  const handlePlayAudio = (a: any) => {
    if (playingId === a.id && audioPlayer) {
      audioPlayer.pause();
      setPlayingId(null);
      return;
    }
    if (audioPlayer) {
      audioPlayer.pause();
    }
    try {
      const audioUrl = `/api/v1/audio/${a.id || a.file_name}/stream`;
      const player = new Audio(audioUrl);
      player.onended = () => setPlayingId(null);
      player.onerror = () => {
        setPlayingId(null);
        showErrorModal('Audio Playback Error', `Failed to stream audio file: ${a.file_name}`);
      };
      player.play().then(() => {
        setAudioPlayer(player);
        setPlayingId(a.id);
        showSuccessModal('Audio Playing', `Now playing: ${a.file_name} (${a.category.toUpperCase()})`);
      }).catch(err => {
        setPlayingId(null);
        showErrorModal('Playback Blocked', err.message || 'Browser blocked audio autoplay');
      });
    } catch (err: any) {
      showErrorModal('Audio Error', err.message);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showErrorModal('Upload Warning', 'Please select an audio file to upload');
      return;
    }
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('category', category);
    const tid = (user?.role !== 'SUPER_ADMIN' && user?.tenant_id) ? user.tenant_id : tenantId;
      if (tid) formData.append('tenant_id', tid);

    try {
      await apiService.uploadAudioFile(token, formData);
      setShowModal(false);
      showSuccessModal('Audio File Uploaded', `Audio prompt "${selectedFile?.name}" has been uploaded.`);
      setSelectedFile(null);
      loadData();
    } catch (err: any) {
      showErrorModal('Upload Failed', err.message || 'Failed to upload audio file');
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Audio Asset Library</div>
          <h1 className="page-title">Voice Prompts & Greetings</h1>
          <p className="page-sub">Upload custom WAV/MP3 audio prompts for IVRs, greetings and music-on-hold</p>
        </div>
        <div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Upload size={16} /> Upload Audio Prompt
          </button>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Audio File Name</th>
                <th>Category</th>
                <th>File Path</th>
                <th>Uploaded At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-4">Loading audio files...</td></tr>
              ) : audioFiles.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-4 text-muted">No custom audio prompts uploaded</td></tr>
              ) : (
                audioFiles.map(a => (
                  <tr key={a.id}>
                    <td><strong style={{ color: '#111827' }}>{a.file_name}</strong></td>
                    <td><span className="terrix-badge grey">{a.category.toUpperCase()}</span></td>
                    <td><code className="code-box" style={{ padding: '4px 8px', fontSize: '11px' }}>{a.file_path}</code></td>
                    <td>{a.created_at}</td>
                    <td>
                      <button
                        className={playingId === a.id ? "btn-primary" : "btn-secondary"}
                        style={{ padding: '5px 12px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handlePlayAudio(a)}
                      >
                        {playingId === a.id ? (
                          <>
                            <Pause size={13} /> Stop Playing
                          </>
                        ) : (
                          <>
                            <Play size={13} /> Play Audio
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="terrix-modal">
            <div className="modal-head">
              <div className="modal-icon"><Mic size={20} /></div>
              <div>
                <h3>Upload Voice Prompt</h3>
                <p>Select a WAV or MP3 audio recording file</p>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="modal-body">
                {user?.role === 'SUPER_ADMIN' && (
                  <div className="form-group mb-3">
                    <label className="form-label">Target Tenant (Optional)</label>
                    <select className="form-control" value={tenantId} onChange={e => setTenantId(e.target.value)}>
                      <option value="">-- Global / Select Tenant --</option>
                      {tenants.map(t => <option key={t.id} value={t.id}>{t.name} ({t.domain})</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group mb-3">
                  <label className="form-label">Category</label>
                  <select className="form-control" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="ivr_greeting">IVR Welcome Prompt</option>
                    <option value="voicemail_greeting">Voicemail Greeting</option>
                    <option value="music_on_hold">Music On Hold</option>
                  </select>
                </div>
                <div className="form-group mb-3">
                  <label className="form-label">Audio File (.wav / .mp3)</label>
                  <input required type="file" accept="audio/*" className="form-control" onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)} />
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Upload Audio</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
