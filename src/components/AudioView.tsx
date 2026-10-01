import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect, useRef } from 'react';
import { apiService, getApiBaseUrl } from '../services/api';
import { Upload, Play, Pause, Trash2, Volume2, VolumeX, Music } from 'lucide-react';
import { PageContainer } from './layout/PageContainer';
import { Stack, Inline } from './layout/Stack';
import {
  Button,
  Input,
  Select,
  FormField,
  Modal,
  Badge,
} from './ui';
import { DataTable, FilterBar } from './patterns';

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

  const columns = [
    {
      key: 'name',
      header: 'Audio Name',
      sortable: true,
      render: (a: any) => (
        <Inline gap="3" align="center">
          <div className="w-8 h-8 rounded-lg bg-[var(--pbx-accent-light)] text-[var(--pbx-accent-primary)] flex items-center justify-center">
            <Music size={16} />
          </div>
          <div>
            <div className="font-bold text-[var(--pbx-text-primary)]">{a.name || a.file_name}</div>
            {a.tenant_name && <div className="text-xs text-[var(--pbx-text-muted)]">Tenant: {a.tenant_name}</div>}
          </div>
        </Inline>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (a: any) => (
        <Badge variant={a.category === 'ivr_greeting' ? 'success' : a.category === 'music_on_hold' ? 'warning' : 'neutral'}>
          {a.category ? a.category.replace('_', ' ').toUpperCase() : 'GENERAL'}
        </Badge>
      ),
    },
    {
      key: 'file_name',
      header: 'File Name',
      render: (a: any) => <code className="code-box">{a.file_name}</code>,
    },
    {
      key: 'file_size',
      header: 'File Size',
      render: (a: any) => (a.file_size ? `${(a.file_size / 1024).toFixed(1)} KB` : '—'),
    },
    {
      key: 'created_at',
      header: 'Uploaded',
      render: (a: any) => (a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'),
    },
  ];

  return (
    <PageContainer
      title="Voice Prompts & Greetings"
      subtitle="Upload and stream custom WAV/MP3 prompts for IVRs, call greetings, and music-on-hold"
      eyebrow="Audio Asset Library"
      actions={
        canManage ? (
          <Button variant="primary" onClick={() => setShowModal(true)} leftIcon={<Upload size={16} />}>
            Upload Audio Prompt
          </Button>
        ) : undefined
      }
    >
      <Stack gap="6">
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search audio prompts..."
        />

        <DataTable
          columns={columns}
          data={filtered}
          isLoading={loading}
          emptyTitle="No custom audio prompts found"
          actions={(a: any) => {
            const isThisPlaying = currentPlaying?.id === a.id && isPlaying;
            return (
              <Inline gap="2" justify="flex-end">
                <Button
                  variant={isThisPlaying ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => handleTogglePlay(a)}
                  leftIcon={isThisPlaying ? <Pause size={13} /> : <Play size={13} />}
                >
                  {isThisPlaying ? 'Pause' : 'Play'}
                </Button>
                {canManage && (
                  <Button variant="danger" size="sm" onClick={() => handleDelete(a)} leftIcon={<Trash2 size={13} />}>
                    Delete
                  </Button>
                )}
              </Inline>
            );
          }}
        />
      </Stack>

      {/* Floating Audio Player Bar */}
      {currentPlaying && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[min(760px,94%)] bg-slate-900 text-white rounded-xl shadow-2xl p-4 z-50 flex items-center gap-4 backdrop-blur-md">
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleTogglePlay(currentPlaying)}
            className="w-10 h-10 rounded-full p-0 flex items-center justify-center shrink-0"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-bold truncate">{currentPlaying.name || currentPlaying.file_name}</span>
              <span className="text-slate-400 font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 accent-[var(--pbx-accent-primary)] cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={handleToggleMute}
            className="bg-transparent border-0 text-slate-400 hover:text-white cursor-pointer"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          <Button variant="secondary" size="sm" onClick={handleStop}>
            Close
          </Button>
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Upload Voice Prompt"
        subtitle="Upload WAV, MP3, or OGG audio file for tenant dialplans"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpload} isLoading={uploading}>
              Upload Audio Prompt
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpload}>
          <Stack gap="4">
            {user?.role === 'SUPER_ADMIN' && (
              <FormField label="Target Tenant (Optional)">
                <Select value={tenantId} onChange={e => setTenantId(e.target.value)}>
                  <option value="">-- Global / Select Tenant --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.domain})
                    </option>
                  ))}
                </Select>
              </FormField>
            )}

            <FormField label="Prompt Category" required>
              <Select value={category} onChange={e => setCategory(e.target.value)}>
                <option value="ivr_greeting">IVR Welcome Prompt</option>
                <option value="ivr_prompt">IVR Menu Option Prompt</option>
                <option value="voicemail_greeting">Voicemail Greeting</option>
                <option value="music_on_hold">Music On Hold (MOH)</option>
              </Select>
            </FormField>

            <FormField label="Audio Recording File" required>
              <Input
                type="file"
                accept="audio/wav,audio/wave,audio/x-wav,audio/mpeg,audio/mp3,audio/ogg"
                onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)}
              />
              <span className="text-xs text-[var(--pbx-text-muted)] mt-1 block">
                Supported formats: 16-bit 8kHz/16kHz WAV, MP3, OGG (Max 25MB)
              </span>
            </FormField>
          </Stack>
        </form>
      </Modal>
    </PageContainer>
  );
};
