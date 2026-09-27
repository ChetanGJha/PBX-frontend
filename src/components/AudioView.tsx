import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect, useRef } from 'react';
import { apiService, getApiBaseUrl } from '../services/api';
import { Upload, Play, Pause, Trash2, Mic, Volume2, VolumeX, Music, Search } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

interface AudioViewProps {
  token: string;
  user?: User | null;
}

export const AudioView: React.FC<AudioViewProps> = ({ token, user }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [audioFiles, setAudioFiles] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState('ivr_greeting');
  const [tenantId, setTenantId] = useState(user?.tenant_id || '');
  const [uploading, setUploading] = useState(false);

  // Playback state
  const [currentPlaying, setCurrentPlaying] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
      console.error('Failed to load audio files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleTogglePlay = (a: any) => {
    const streamUrl = `${getApiBaseUrl()}/api/v1/audio/${a.id || a.file_name}/stream`;

    if (currentPlaying?.id === a.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play().then(() => setIsPlaying(true)).catch(err => {
          showErrorModal('Playback Error', err.message || 'Failed to play audio');
        });
      }
      return;
    }

    // New audio track
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const player = new Audio(streamUrl);
    audioRef.current = player;
    setCurrentPlaying(a);
    setIsPlaying(true);
    setCurrentTime(0);

    player.ontimeupdate = () => {
      setCurrentTime(player.currentTime);
      if (player.duration && !isNaN(player.duration)) {
        setDuration(player.duration);
      }
    };

    player.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    player.onerror = () => {
      setIsPlaying(false);
      setCurrentPlaying(null);
      showErrorModal('Audio Playback Error', `Cannot play audio file "${a.file_name}". Verify backend is running and file format is valid.`);
    };

    player.play().catch(err => {
      setIsPlaying(false);
      setCurrentPlaying(null);
      showErrorModal('Playback Blocked', err.message || 'Browser audio playback was blocked. Please interact with the page first.');
    });
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentPlaying(null);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleToggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showErrorModal('Upload Warning', 'Please choose an audio file (.wav, .mp3, .ogg) to upload');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('category', category);
    const tid = (user?.role !== 'SUPER_ADMIN' && user?.tenant_id) ? user.tenant_id : tenantId;
    if (tid) formData.append('tenant_id', tid);

    try {
      await apiService.uploadAudioFile(token, formData);
      setShowModal(false);
      showSuccessModal('Audio File Uploaded', `Audio prompt "${selectedFile.name}" was uploaded successfully.`);
      setSelectedFile(null);
      loadData();
    } catch (err: any) {
      showErrorModal('Upload Failed', err.message || 'Failed to upload audio prompt');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (a: any) => {
    if (!window.confirm(`Are you sure you want to delete audio prompt "${a.name || a.file_name}"?`)) return;
    try {
      if (currentPlaying?.id === a.id) {
        handleStop();
      }
      await apiService.deleteAudioFile(token, a.id);
      showSuccessModal('Audio File Deleted', `Audio prompt "${a.name || a.file_name}" has been removed.`);
      loadData();
    } catch (err: any) {
      showErrorModal('Delete Failed', err.message || 'Could not delete audio file');
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const filtered = audioFiles.filter(a =>
    (a.name && a.name.toLowerCase().includes(search.toLowerCase())) ||
    (a.file_name && a.file_name.toLowerCase().includes(search.toLowerCase())) ||
    (a.category && a.category.toLowerCase().includes(search.toLowerCase()))
  );

  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'TENANT_ADMIN';

  return (
    <div style={{ paddingBottom: currentPlaying ? '80px' : '0' }}>
      <div className="page-head">
        <div>
          <div className="eyebrow">Audio Asset Library</div>
          <h1 className="page-title">Voice Prompts & Greetings</h1>
          <p className="page-sub">Upload and stream custom WAV/MP3 prompts for IVRs, call greetings, and music-on-hold</p>
        </div>
        {canManage && (
          <div>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Upload size={16} /> Upload Audio Prompt
            </button>
          </div>
        )}
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="search-input-wrap" style={{ width: '280px' }}>
            <Search size={16} className="search-icon" />
            <input
              className="form-control"
              style={{ height: '38px', fontSize: '12px' }}
              placeholder="Search audio prompts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#6B7280' }}>
            Showing <strong>{filtered.length}</strong> audio asset{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Audio Name</th>
                <th>Category</th>
                <th>File Name</th>
                <th>File Size</th>
                <th>Uploaded</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-4">Loading audio files...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-4 text-muted">No custom audio prompts found</td></tr>
              ) : (
                filtered.map(a => {
                  const isThisPlaying = currentPlaying?.id === a.id && isPlaying;
                  return (
                    <tr key={a.id} style={{ background: currentPlaying?.id === a.id ? '#FFF9F5' : undefined }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: isThisPlaying ? '#FF5430' : '#FFF0EC',
                            color: isThisPlaying ? '#FFFFFF' : '#FF5430',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}>
                            <Music size={16} />
                          </div>
                          <div>
                            <strong style={{ color: '#111827', fontSize: '13px' }}>{a.name || a.file_name}</strong>
                            {a.tenant_name && <div style={{ fontSize: '10.5px', color: '#6B7280' }}>Tenant: {a.tenant_name}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`terrix-badge ${a.category === 'ivr_greeting' ? 'green' : a.category === 'music_on_hold' ? 'orange' : 'grey'}`}>
                          {a.category.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <code className="code-box" style={{ padding: '3px 8px', fontSize: '11px' }}>{a.file_name}</code>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: '#4B5563' }}>
                          {a.file_size ? `${(a.file_size / 1024).toFixed(1)} KB` : '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '11.5px', color: '#6B7280' }}>
                          {a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            type="button"
                            className={isThisPlaying ? "btn-primary" : "btn-secondary"}
                            style={{ padding: '5px 12px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => handleTogglePlay(a)}
                          >
                            {isThisPlaying ? (
                              <>
                                <Pause size={13} /> Pause
                              </>
                            ) : (
                              <>
                                <Play size={13} /> Play
                              </>
                            )}
                          </button>
                          {canManage && (
                            <button
                              type="button"
                              className="btn-secondary text-rose-600"
                              style={{ padding: '5px 8px', fontSize: '11px' }}
                              onClick={() => handleDelete(a)}
                              title="Delete Audio"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Audio Player Bar */}
      {currentPlaying && (
        <div style={{
          position: 'fixed',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(760px, 94%)',
          background: '#0F172A',
          color: '#FFFFFF',
          borderRadius: '14px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          padding: '12px 20px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          backdropFilter: 'blur(8px)'
        }}>
          <button
            type="button"
            onClick={() => handleTogglePlay(currentPlaying)}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: '#FF5430',
              border: 'none',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentPlaying.name || currentPlaying.file_name}
              </span>
              <span style={{ color: '#94A3B8', fontFamily: 'monospace' }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              style={{ width: '100%', height: '4px', accentColor: '#FF5430', cursor: 'pointer' }}
            />
          </div>

          <button
            type="button"
            onClick={handleToggleMute}
            style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          <button
            type="button"
            onClick={handleStop}
            style={{
              background: '#334155',
              border: 'none',
              color: '#F1F5F9',
              fontSize: '11px',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Close
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="terrix-modal" style={{ maxWidth: '520px' }}>
            <div className="modal-head">
              <div className="modal-icon"><Mic size={20} /></div>
              <div>
                <h3>Upload Voice Prompt</h3>
                <p>Upload WAV, MP3, or OGG audio file for tenant dialplans</p>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="modal-body">
                {user?.role === 'SUPER_ADMIN' && (
                  <div className="form-group mb-3">
                    <label className="form-label">Target Tenant (Optional)</label>
                    <CustomSelect
                      options={[
                        { value: '', label: '-- Global / Select Tenant --' },
                        ...tenants.map(t => ({ value: t.id, label: `${t.name} (${t.domain})` }))
                      ]}
                      value={tenantId}
                      onChange={(val) => setTenantId(val)}
                    />
                  </div>
                )}
                <div className="form-group mb-3">
                  <label className="form-label required">Prompt Category</label>
                  <CustomSelect
                    options={[
                      { value: 'ivr_greeting', label: 'IVR Welcome Prompt' },
                      { value: 'ivr_prompt', label: 'IVR Menu Option Prompt' },
                      { value: 'voicemail_greeting', label: 'Voicemail Greeting' },
                      { value: 'music_on_hold', label: 'Music On Hold (MOH)' },
                    ]}
                    value={category}
                    onChange={(val) => setCategory(val)}
                  />
                </div>
                <div className="form-group mb-3">
                  <label className="form-label required">Audio Recording File</label>
                  <input
                    required
                    type="file"
                    accept="audio/wav,audio/wave,audio/x-wav,audio/mpeg,audio/mp3,audio/ogg"
                    className="form-control"
                    onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  />
                  <small style={{ color: '#6B7280', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                    Supported formats: 16-bit 8kHz/16kHz WAV, MP3, OGG (Max 25MB)
                  </small>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} disabled={uploading}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload Audio Prompt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
