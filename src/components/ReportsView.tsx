import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect, useRef } from 'react';
import { apiService, getApiBaseUrl } from '../services/api';
import {
  FileText,
  PhoneOutgoing,
  PhoneCall,
  Disc,
  Volume2,
  Pause,
  Square,
  RotateCcw,
  Download,
  PieChart,
  CheckCircle2,
  PhoneMissed,
  PhoneOff,
  XCircle,
  Activity,
  Radio,
  Voicemail,
  Mail,
  MailOpen,
  Trash2,
  Play,
} from 'lucide-react';
import { ListPageLayout } from './layout';
import { Inline, Stack, Grid } from './layout/Stack';
import {
  Button,
  Input,
  Select,
  Badge,
  Alert,
  Tabs,
  ProgressBar,
} from './ui';
import { DataTable, FilterBar, StatCard } from './patterns';

interface ReportsViewProps {
  token: string;
  user?: User | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ token, user }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [activeTab, setActiveTab] = useState<'summary' | 'disposition' | 'voicemail' | 'cdr' | 'internal' | 'outbound' | 'recordings'>('summary');
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState(user?.tenant_id || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [dispositionFilter, setDispositionFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [dispositionData, setDispositionData] = useState<any>(null);

  // Voicemail Analytics State
  const [voicemailData, setVoicemailData] = useState<any>(null);
  const [voicemailLoading, setVoicemailLoading] = useState(false);
  const [vmExtensionFilter, setVmExtensionFilter] = useState('');
  const [vmReadFilter, setVmReadFilter] = useState<'all' | 'unread' | 'read'>('all');

  // WebSocket Live Real-Time State
  const [wsConnected, setWsConnected] = useState(false);
  const [livePulse, setLivePulse] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Audio Playback State
  const [playingRecordingId, setPlayingRecordingId] = useState<string | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [activeRecordingInfo, setActiveRecordingInfo] = useState<any | null>(null);

  const loadTenants = async () => {
    try {
      const data = await apiService.getTenants(token);
      setTenants(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTenants();
  }, [token]);

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    setPlayingRecordingId(null);
    setAudioLoadingId(null);
    setCurrentAudio(null);
    setActiveRecordingInfo(null);
  };

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  // Keep latest filters in ref so WebSocket listener never needs to recreate connection on filter changes
  const filtersRef = useRef({
    activeTab,
    selectedTenant,
    directionFilter,
    dispositionFilter,
    startDate,
    endDate
  });

  useEffect(() => {
    filtersRef.current = {
      activeTab,
      selectedTenant,
      directionFilter,
      dispositionFilter,
      startDate,
      endDate
    };
  }, [activeTab, selectedTenant, directionFilter, dispositionFilter, startDate, endDate]);

  // WebSocket Connection for Real-Time Live Reports (Stable connection on token)
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    let reconnectTimer: any = null;
    let pingInterval: any = null;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/reports?token=${encodeURIComponent(token)}`;

    const connectWs = () => {
      if (!isMounted) return;
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setWsConnected(true);
          pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send('ping');
            }
          }, 20000);
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            if (event.data === 'pong') return;
            const payload = JSON.parse(event.data);
            const { activeTab: curTab, selectedTenant: curTenant, directionFilter: curDir, dispositionFilter: curDisp, startDate: curStart, endDate: curEnd } = filtersRef.current;

            if (payload.event === 'cdr.created' || payload.type === 'cdr.created') {
              const cdr = payload.data;
              setLivePulse(true);
              setTimeout(() => { if (isMounted) setLivePulse(false); }, 2000);

              // Prepend to CDR table if viewing CDR tab
              setReportData((prev) => {
                if (curTab === 'cdr') {
                  const matchesTenant = !curTenant || cdr.tenant_id === curTenant;
                  const matchesDir = curDir === 'all' || cdr.direction === curDir;
                  let matchesDisp = true;
                  if (curDisp !== 'all') {
                    const isAnswered = cdr.billsec > 0 || cdr.hangup_cause === 'NORMAL_CLEARING';
                    if (curDisp === 'ANSWERED') matchesDisp = isAnswered;
                    else if (curDisp === 'NO_ANSWER') matchesDisp = !isAnswered && ['NO_ANSWER', 'ORIGINATOR_CANCEL', 'NORMAL_TEMPORARY_FAILURE', 'NO_USER_RESPONSE'].includes(cdr.hangup_cause);
                    else if (curDisp === 'BUSY') matchesDisp = !isAnswered && ['USER_BUSY', 'CALL_REJECTED'].includes(cdr.hangup_cause);
                    else if (curDisp === 'FAILED') matchesDisp = !isAnswered && !['NORMAL_CLEARING', 'NO_ANSWER', 'ORIGINATOR_CANCEL', 'NORMAL_TEMPORARY_FAILURE', 'NO_USER_RESPONSE', 'USER_BUSY', 'CALL_REJECTED'].includes(cdr.hangup_cause);
                  }
                  if (matchesTenant && matchesDir && matchesDisp) {
                    return [cdr, ...prev];
                  }
                }
                return prev;
              });

              // If viewing disposition or summary tab, refresh metrics
              if (curTab === 'disposition') {
                loadDispositionData();
              } else if (curTab === 'voicemail') {
                loadVoicemailData();
              } else if (curTab === 'summary') {
                apiService.getTenantSummaryReport(token, curStart, curEnd).then(setReportData).catch(console.error);
              }
            } else if (payload.type === 'voicemail.created' || payload.event === 'voicemail.created') {
              setLivePulse(true);
              setTimeout(() => { if (isMounted) setLivePulse(false); }, 2000);
              if (curTab === 'voicemail') {
                loadVoicemailData();
              }
            }
          } catch {
            // Ignore parse errors or non-json messages
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setWsConnected(false);
          if (pingInterval) clearInterval(pingInterval);
          reconnectTimer = setTimeout(connectWs, 5000);
        };

        ws.onerror = () => {
          if (!isMounted) return;
          setWsConnected(false);
        };
      } catch (e) {
        console.error('WebSocket initialization error:', e);
      }
    };

    connectWs();

    return () => {
      isMounted = false;
      if (pingInterval) clearInterval(pingInterval);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [token]);

  const handlePlayRecording = async (rec: any) => {
    const recId = rec.recording_id || rec.id;
    if (!recId) {
      showErrorModal('Audio Playback', 'No recording ID associated with this record.');
      return;
    }

    if (playingRecordingId === recId) {
      stopAudio();
      return;
    }

    stopAudio();
    setAudioLoadingId(recId);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/reports/recordings/${recId}/stream`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showErrorModal('Playback Error', err.detail || `Recording audio file could not be loaded (${res.status})`);
        setAudioLoadingId(null);
        return;
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const audio = new Audio(objectUrl);

      audio.onended = () => {
        setPlayingRecordingId(null);
        setCurrentAudio(null);
        setActiveRecordingInfo(null);
        URL.revokeObjectURL(objectUrl);
      };

      audio.onerror = () => {
        showErrorModal('Playback Error', 'Failed to decode or play audio file from server.');
        setPlayingRecordingId(null);
        setCurrentAudio(null);
        setActiveRecordingInfo(null);
        URL.revokeObjectURL(objectUrl);
      };

      await audio.play();
      setPlayingRecordingId(recId);
      setCurrentAudio(audio);
      setActiveRecordingInfo(rec);
    } catch (err: any) {
      showErrorModal('Playback Error', err.message || 'Failed to stream audio file.');
      setPlayingRecordingId(null);
      setCurrentAudio(null);
      setActiveRecordingInfo(null);
    } finally {
      setAudioLoadingId(null);
    }
  };

  const loadDispositionData = async () => {
    try {
      const data = await apiService.getDispositionSummaryReport(token, selectedTenant, startDate, endDate, directionFilter);
      setDispositionData(data);
    } catch (err) {
      console.error('Failed to load disposition report:', err);
    }
  };

  const loadVoicemailData = async () => {
    try {
      setVoicemailLoading(true);
      const isReadParam = vmReadFilter === 'all' ? undefined : vmReadFilter === 'read';
      const data = await apiService.getVoicemailReport(
        token,
        vmExtensionFilter || undefined,
        isReadParam,
        startDate || undefined,
        endDate || undefined
      );
      setVoicemailData(data);
    } catch (err) {
      console.error('Failed to load voicemail report:', err);
    } finally {
      setVoicemailLoading(false);
    }
  };

  const handlePlayVoicemail = async (msg: any) => {
    const msgId = msg.id;
    if (!msgId) return;

    if (playingRecordingId === msgId) {
      stopAudio();
      return;
    }

    stopAudio();
    setAudioLoadingId(msgId);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/reports/voicemail/${msgId}/audio`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showErrorModal('Playback Error', err.detail || `Voicemail audio could not be loaded (${res.status})`);
        setAudioLoadingId(null);
        return;
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const audio = new Audio(objectUrl);

      audio.onended = () => {
        setPlayingRecordingId(null);
        setCurrentAudio(null);
        setActiveRecordingInfo(null);
        URL.revokeObjectURL(objectUrl);
      };

      audio.onerror = () => {
        showErrorModal('Playback Error', 'Failed to decode or play voicemail audio.');
        setPlayingRecordingId(null);
        setCurrentAudio(null);
        setActiveRecordingInfo(null);
        URL.revokeObjectURL(objectUrl);
      };

      await audio.play();
      setPlayingRecordingId(msgId);
      setCurrentAudio(audio);
      setActiveRecordingInfo({
        caller_id_number: msg.caller_id_number,
        destination_number: msg.extension_number || msg.mailbox,
        recording_id: msgId,
        type: 'Voicemail'
      });
    } catch (err: any) {
      showErrorModal('Playback Error', err.message || 'Failed to stream voicemail audio file.');
      setPlayingRecordingId(null);
      setCurrentAudio(null);
      setActiveRecordingInfo(null);
    } finally {
      setAudioLoadingId(null);
    }
  };

  const handleToggleVoicemailRead = async (msg: any) => {
    try {
      await apiService.toggleVoicemailRead(token, msg.id, !msg.read);
      showSuccessModal('Voicemail Updated', `Marked message as ${!msg.read ? 'read' : 'unread'}`);
      loadVoicemailData();
    } catch (err: any) {
      showErrorModal('Update Failed', err.message || 'Failed to update read status');
    }
  };

  const handleDeleteVoicemail = async (msg: any) => {
    if (!window.confirm(`Delete voicemail message from ${msg.caller_id_number}?`)) return;
    try {
      if (playingRecordingId === msg.id) {
        stopAudio();
      }
      await apiService.deleteVoicemailMessage(token, msg.id);
      showSuccessModal('Voicemail Deleted', 'Voicemail message removed successfully');
      loadVoicemailData();
    } catch (err: any) {
      showErrorModal('Delete Failed', err.message || 'Failed to delete voicemail');
    }
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      if (activeTab === 'summary') {
        const data = await apiService.getTenantSummaryReport(token, startDate, endDate);
        setReportData(data);
      } else if (activeTab === 'disposition') {
        await loadDispositionData();
      } else if (activeTab === 'voicemail') {
        await loadVoicemailData();
      } else if (activeTab === 'cdr') {
        const data = await apiService.getCdrReport(token, selectedTenant, startDate, endDate, directionFilter, dispositionFilter);
        setReportData(data);
      } else if (activeTab === 'internal') {
        const data = await apiService.getInternalReport(token, selectedTenant, startDate, endDate);
        setReportData(data);
      } else if (activeTab === 'outbound') {
        const data = await apiService.getOutboundReport(token, selectedTenant, startDate, endDate);
        setReportData(data);
      } else if (activeTab === 'recordings') {
        const data = await apiService.getRecordingsReport(token, selectedTenant);
        setReportData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [token, activeTab, selectedTenant, startDate, endDate, directionFilter, dispositionFilter, vmExtensionFilter, vmReadFilter]);

  const exportToCsv = () => {
    const dataToExport = activeTab === 'disposition' 
      ? dispositionData?.breakdown 
      : activeTab === 'voicemail' 
      ? voicemailData?.messages 
      : reportData;
    if (!dataToExport || dataToExport.length === 0) {
      showErrorModal('Export Notice', 'No data available to export for the current filters.');
      return;
    }
    try {
      const headers = Object.keys(dataToExport[0]);
      const csvRows = [
        headers.join(','),
        ...dataToExport.map((row: any) =>
          headers.map(h => {
            const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
            return `"${val.replace(/"/g, '""')}"`;
          }).join(',')
        )
      ];
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTab}_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccessModal('Report Exported', `Successfully exported ${dataToExport.length} records to CSV.`);
    } catch (err: any) {
      showErrorModal('Export Failed', err.message || 'Failed to export report.');
    }
  };

  const handleResetFilters = () => {
    setSelectedTenant(user?.tenant_id || '');
    setStartDate('');
    setEndDate('');
    setDirectionFilter('all');
    setDispositionFilter('all');
  };

  const hasActiveFilters = Boolean(
    (user?.role === 'SUPER_ADMIN' && selectedTenant) ||
    startDate ||
    endDate ||
    directionFilter !== 'all' ||
    dispositionFilter !== 'all'
  );

  const summaryColumns = [
    {
      key: 'tenant_name',
      header: 'Tenant Domain',
      render: (r: any) => (
        <div>
          <div className="font-bold text-sm text-[var(--pbx-text-primary)]">{r.tenant_name || 'Global Domain'}</div>
          <div className="text-xs text-[var(--pbx-text-secondary)]">{r.tenant_domain || 'global'}</div>
        </div>
      )
    },
    {
      key: 'total_calls',
      header: 'Total Calls',
      render: (r: any) => <span className="font-semibold text-sm text-[var(--pbx-text-primary)]">{r.total_calls || 0}</span>
    },
    {
      key: 'inbound_calls',
      header: 'Inbound Calls',
      render: (r: any) => (
        <Badge variant="info">
          {r.inbound_calls || 0} <span className="text-[10px] opacity-75 ml-1">({Math.round((r.inbound_duration_sec || 0) / 60)}m)</span>
        </Badge>
      )
    },
    {
      key: 'outbound_calls',
      header: 'Outbound Calls',
      render: (r: any) => (
        <Badge variant="warning">
          {r.outbound_calls || 0} <span className="text-[10px] opacity-75 ml-1">({Math.round((r.outbound_duration_sec || 0) / 60)}m)</span>
        </Badge>
      )
    },
    {
      key: 'outbound_answered',
      header: 'Answered',
      render: (r: any) => <Badge variant="success">{r.outbound_answered || 0}</Badge>
    },
    {
      key: 'outbound_failed',
      header: 'Failed',
      render: (r: any) => <Badge variant="danger">{r.outbound_failed || 0}</Badge>
    },
    {
      key: 'total_billsec',
      header: 'Billable Time',
      render: (r: any) => (
        <span className="font-medium text-sm text-[var(--pbx-text-primary)]">
          {Math.round((r.total_billsec || 0) / 60)} <span className="text-xs text-[var(--pbx-text-muted)]">mins</span>
        </span>
      )
    },
  ];

  const dispositionBreakdownColumns = [
    {
      key: 'cause',
      header: 'Hangup Cause / Disposition',
      render: (r: any) => {
        const cause = r.cause || 'UNKNOWN';
        let variant: 'success' | 'warning' | 'danger' | 'neutral' = 'neutral';
        if (cause === 'NORMAL_CLEARING') variant = 'success';
        else if (['NO_ANSWER', 'ORIGINATOR_CANCEL', 'NORMAL_TEMPORARY_FAILURE', 'NO_USER_RESPONSE'].includes(cause)) variant = 'warning';
        else if (['USER_BUSY', 'CALL_REJECTED'].includes(cause)) variant = 'warning';
        else variant = 'danger';

        return <Badge variant={variant}>{cause}</Badge>;
      }
    },
    {
      key: 'count',
      header: 'Total Calls',
      render: (r: any) => <span className="font-semibold text-sm text-[var(--pbx-text-primary)]">{r.count}</span>
    },
    {
      key: 'percentage',
      header: 'Share of Traffic',
      render: (r: any) => (
        <Inline gap="2" align="center">
          <span className="font-medium text-sm text-[var(--pbx-text-primary)]">{r.percentage}%</span>
          <ProgressBar value={r.percentage} color="primary" className="w-24" />
        </Inline>
      )
    },
    {
      key: 'avg_duration',
      header: 'Avg Duration',
      render: (r: any) => (
        <span className="text-sm font-medium text-[var(--pbx-text-primary)]">
          {r.avg_duration}<span className="text-xs text-[var(--pbx-text-muted)] ml-0.5">s</span>
        </span>
      )
    },
    {
      key: 'avg_billsec',
      header: 'Avg Billable Time',
      render: (r: any) => (
        <span className="text-sm text-[var(--pbx-text-secondary)]">
          {r.avg_billsec}<span className="text-xs text-[var(--pbx-text-muted)] ml-0.5">s</span>
        </span>
      )
    }
  ];

  const voicemailColumns = [
    {
      key: 'created_at',
      header: 'Received At',
      render: (r: any) => (
        <span className="text-xs font-medium text-[var(--pbx-text-primary)]">
          {r.created_at ? new Date(r.created_at).toLocaleString() : 'N/A'}
        </span>
      )
    },
    {
      key: 'extension_number',
      header: 'Mailbox / Extension',
      render: (r: any) => (
        <Inline gap={2} align="center">
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--pbx-bg-subtle)] border border-[var(--pbx-border-default)] text-[var(--pbx-text-primary)] font-medium">
            {r.extension_number || r.mailbox}
          </span>
          {r.display_name && (
            <span className="text-xs text-[var(--pbx-text-muted)] font-normal">
              ({r.display_name})
            </span>
          )}
        </Inline>
      )
    },
    {
      key: 'caller_id_number',
      header: 'Caller ID',
      render: (r: any) => (
        <Stack gap={0.5}>
          <span className="font-semibold text-sm text-[var(--pbx-text-primary)]">
            {r.caller_id_number}
          </span>
          {r.caller_id_name && r.caller_id_name !== r.caller_id_number && (
            <span className="text-xs text-[var(--pbx-text-muted)]">
              {r.caller_id_name}
            </span>
          )}
        </Stack>
      )
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (r: any) => {
        const dur = r.duration || 0;
        const mins = Math.floor(dur / 60);
        const secs = dur % 60;
        return (
          <span className="font-mono text-xs font-medium text-[var(--pbx-text-primary)]">
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
        );
      }
    },
    {
      key: 'read',
      header: 'Status',
      render: (r: any) => (
        <Badge variant={r.read ? 'neutral' : 'warning'}>
          {r.read ? 'Read' : 'New / Unread'}
        </Badge>
      )
    },
    {
      key: 'audio',
      header: 'Audio Playback',
      render: (r: any) => {
        const isThisPlaying = playingRecordingId === r.id;
        const isLoadingThis = audioLoadingId === r.id;
        return (
          <Inline gap={1.5} align="center">
            <Button
              variant={isThisPlaying ? 'primary' : 'secondary'}
              size="sm"
              disabled={isLoadingThis}
              leftIcon={
                isLoadingThis ? (
                  <RotateCcw size={12} className="animate-spin" />
                ) : isThisPlaying ? (
                  <Pause size={12} />
                ) : (
                  <Play size={12} />
                )
              }
              onClick={() => handlePlayVoicemail(r)}
            >
              {isLoadingThis ? 'Loading' : isThisPlaying ? 'Pause' : 'Play'}
            </Button>
            <a
              href={`${getApiBaseUrl()}/api/v1/reports/voicemail/${r.id}/audio`}
              download={`voicemail_${r.caller_id_number}_${r.id}.wav`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center p-1.5 rounded text-[var(--pbx-text-muted)] hover:text-[var(--pbx-text-primary)] hover:bg-[var(--pbx-bg-subtle)] transition-colors"
              title="Download audio WAV"
            >
              <Download size={14} />
            </a>
          </Inline>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r: any) => (
        <Inline gap={1} align="center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleVoicemailRead(r)}
            leftIcon={r.read ? <Mail size={12} /> : <MailOpen size={12} />}
            title={r.read ? 'Mark as Unread' : 'Mark as Read'}
          >
            {r.read ? 'Mark Unread' : 'Mark Read'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteVoicemail(r)}
            className="text-[var(--pbx-danger-text,#ef4444)] hover:bg-[var(--pbx-danger-subtle,#fee2e2)]"
            leftIcon={<Trash2 size={12} />}
            title="Delete voicemail"
          >
            Delete
          </Button>
        </Inline>
      )
    }
  ];

  const cdrColumns = [
    {
      key: 'start_time',
      header: 'Start Time',
      render: (r: any) => (
        <span className="text-xs font-medium text-[var(--pbx-text-primary)]">
          {r.start_stamp || r.start_time || 'N/A'}
        </span>
      )
    },
    {
      key: 'caller',
      header: 'Caller ID / Number',
      render: (r: any) => (
        <div>
          <div className="font-semibold text-sm text-[var(--pbx-text-primary)]">
            {r.caller_id_number || r.caller_number || 'Unknown'}
          </div>
          {(r.caller_id_name || r.caller_name) && (
            <div className="text-xs text-[var(--pbx-text-secondary)]">
              {r.caller_id_name || r.caller_name}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'destination_number',
      header: 'Destination',
      render: (r: any) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--pbx-bg-subtle)] border border-[var(--pbx-border-default)] text-[var(--pbx-text-primary)] font-medium">
          {r.destination_number || r.destination || 'N/A'}
        </span>
      )
    },
    {
      key: 'direction',
      header: 'Direction',
      render: (r: any) => {
        const dir = (r.direction || 'inbound').toLowerCase();
        let variant: 'info' | 'warning' | 'neutral' = 'neutral';
        if (dir === 'inbound') variant = 'info';
        else if (dir === 'outbound') variant = 'warning';
        return (
          <Badge variant={variant}>
            {dir}
          </Badge>
        );
      }
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (r: any) => (
        <span className="text-sm font-medium text-[var(--pbx-text-primary)]">
          {r.duration || 0}<span className="text-xs text-[var(--pbx-text-muted)] ml-0.5">s</span>
        </span>
      )
    },
    {
      key: 'billsec',
      header: 'Bill Sec',
      render: (r: any) => (
        <span className="text-sm text-[var(--pbx-text-secondary)]">
          {r.billsec || 0}<span className="text-xs text-[var(--pbx-text-muted)] ml-0.5">s</span>
        </span>
      )
    },
    {
      key: 'tenant_name',
      header: 'Tenant',
      render: (r: any) => <Badge variant="neutral">{r.tenant_name || 'Global'}</Badge>
    },
    {
      key: 'hangup_cause',
      header: 'Disposition / Cause',
      render: (r: any) => {
        const cause = r.hangup_cause || 'NORMAL_CLEARING';
        const isAnswered = r.billsec > 0 || cause === 'NORMAL_CLEARING';
        let variant: 'success' | 'warning' | 'danger' = 'danger';
        if (isAnswered) variant = 'success';
        else if (['NO_ANSWER', 'ORIGINATOR_CANCEL', 'NORMAL_TEMPORARY_FAILURE', 'NO_USER_RESPONSE', 'USER_BUSY'].includes(cause)) variant = 'warning';

        return (
          <Badge variant={variant}>
            {cause}
          </Badge>
        );
      }
    },
  ];

  const internalColumns = [
    {
      key: 'caller_id_number',
      header: 'Source Extension',
      render: (r: any) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--pbx-bg-subtle)] border border-[var(--pbx-border-default)] text-[var(--pbx-text-primary)] font-medium">
          {r.caller_id_number}
        </span>
      )
    },
    {
      key: 'destination_number',
      header: 'Target Extension',
      render: (r: any) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--pbx-bg-subtle)] border border-[var(--pbx-border-default)] text-[var(--pbx-text-primary)] font-medium">
          {r.destination_number}
        </span>
      )
    },
    {
      key: 'total_calls',
      header: 'Total Calls',
      render: (r: any) => <span className="font-semibold text-sm text-[var(--pbx-text-primary)]">{r.total_calls}</span>
    },
    {
      key: 'total_duration_sec',
      header: 'Total Duration',
      render: (r: any) => `${r.total_duration_sec || 0}s`
    },
    {
      key: 'avg_duration_sec',
      header: 'Avg Duration',
      render: (r: any) => `${r.avg_duration_sec || 0}s`
    },
  ];

  const outboundColumns = [
    {
      key: 'start_time',
      header: 'Start Time',
      render: (r: any) => (
        <span className="text-xs font-medium text-[var(--pbx-text-primary)]">
          {r.start_stamp || r.start_time || r.created_at || 'N/A'}
        </span>
      )
    },
    {
      key: 'source',
      header: 'Originating Extension',
      render: (r: any) => (
        <span className="font-semibold text-sm text-[var(--pbx-text-primary)]">
          {r.caller_id_number || r.source_extension || 'N/A'}
        </span>
      )
    },
    {
      key: 'destination',
      header: 'Destination',
      render: (r: any) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--pbx-bg-subtle)] border border-[var(--pbx-border-default)] text-[var(--pbx-text-primary)] font-medium">
          {r.destination_number || r.destination || 'N/A'}
        </span>
      )
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (r: any) => `${r.duration || 0}s`
    },
    {
      key: 'billsec',
      header: 'Billable Sec',
      render: (r: any) => `${r.billsec || 0}s`
    },
    {
      key: 'tenant_name',
      header: 'Tenant',
      render: (r: any) => <Badge variant="neutral">{r.tenant_name || 'Global'}</Badge>
    },
  ];

  const recordingColumns = [
    {
      key: 'created_at',
      header: 'Recorded At',
      render: (r: any) => (
        <span className="text-xs font-medium text-[var(--pbx-text-primary)]">
          {r.created_at || r.start_time || 'N/A'}
        </span>
      )
    },
    {
      key: 'file_name',
      header: 'File Name',
      render: (r: any) => (
        <span className="font-semibold text-sm text-[var(--pbx-text-primary)]">
          {r.file_name || 'recording.wav'}
        </span>
      )
    },
    {
      key: 'parties',
      header: 'Caller → Destination',
      render: (r: any) => (
        <Inline gap="2" align="center">
          <span className="font-medium text-sm text-[var(--pbx-text-primary)]">
            {r.caller_number || r.source_extension || 'N/A'}
          </span>
          <span className="text-[var(--pbx-text-muted)]">&rarr;</span>
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--pbx-bg-subtle)] border border-[var(--pbx-border-default)] text-[var(--pbx-text-primary)] font-medium">
            {r.destination_number || 'N/A'}
          </span>
        </Inline>
      )
    },
    {
      key: 'file_size',
      header: 'File Size',
      render: (r: any) => (
        <span className="text-sm text-[var(--pbx-text-secondary)]">
          {((r.file_size || 0) / 1024).toFixed(1)} KB
        </span>
      )
    },
    {
      key: 'tenant_name',
      header: 'Tenant',
      render: (r: any) => <Badge variant="neutral">{r.tenant_name || 'Global'}</Badge>
    },
  ];

  return (
    <ListPageLayout
      title="Reports & Call Detail Records"
      subtitle="Real-time call logs, disposition summary, extension-to-extension stats & audio recordings"
      eyebrow="ANALYTICS & TELEMETRY"
      actions={
        <Inline gap="3" align="center">
          {wsConnected ? (
            <Badge variant="success" className={livePulse ? 'ring-2 ring-[var(--pbx-success)] ring-offset-1 transition-all' : ''}>
              <Radio size={12} className="animate-pulse mr-1" />
              Live Real-Time
            </Badge>
          ) : (
            <Badge variant="neutral">
              <Radio size={12} className="opacity-50 mr-1" />
              Connecting Real-Time...
            </Badge>
          )}
          <Button variant="primary" onClick={exportToCsv} leftIcon={<Download size={15} />}>
            Export CSV
          </Button>
        </Inline>
      }
      filterBar={
        <FilterBar
          filters={
            <Inline gap="4" align="center" wrap={false} className="flex-wrap md:flex-nowrap">
              {user?.role === 'SUPER_ADMIN' && tenants.length > 0 && activeTab !== 'summary' && (
                <Select
                  value={selectedTenant}
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  className="w-56 min-w-[200px]"
                >
                  <option value="">-- All Tenants --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.domain})
                    </option>
                  ))}
                </Select>
              )}

              {(activeTab === 'cdr' || activeTab === 'disposition') && (
                <Select
                  value={directionFilter}
                  onChange={(e) => setDirectionFilter(e.target.value)}
                  className="w-40 min-w-[150px]"
                >
                  <option value="all">All Directions</option>
                  <option value="inbound">Inbound</option>
                  <option value="outbound">Outbound</option>
                  <option value="internal">Internal</option>
                </Select>
              )}

              {activeTab === 'cdr' && (
                <Select
                  value={dispositionFilter}
                  onChange={(e) => setDispositionFilter(e.target.value)}
                  className="w-40 min-w-[150px]"
                >
                  <option value="all">All Dispositions</option>
                  <option value="ANSWERED">Answered</option>
                  <option value="NO_ANSWER">No Answer</option>
                  <option value="BUSY">Busy</option>
                  <option value="FAILED">Failed</option>
                </Select>
              )}

              <Inline gap="2" align="center" wrap={false}>
                <span className="text-xs font-semibold text-[var(--pbx-text-secondary)] uppercase">From:</span>
                <Input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-40"
                />
                <span className="text-xs font-semibold text-[var(--pbx-text-secondary)] uppercase">To:</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-40"
                />
              </Inline>

              {hasActiveFilters && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleResetFilters}
                  leftIcon={<RotateCcw size={14} />}
                >
                  Reset
                </Button>
              )}
            </Inline>
          }
        />
      }
    >
      {/* Audio Player Bar */}
      {playingRecordingId && activeRecordingInfo && (
        <Alert variant="info" icon={<Volume2 size={20} />}>
          <Inline justify="between" align="center" className="w-full">
            <div>
              <div className="font-bold">Now Playing: {activeRecordingInfo.file_name || 'Call Recording Audio'}</div>
              <div className="text-xs text-[var(--pbx-text-muted)] mt-0.5">
                {activeRecordingInfo.tenant_name || 'Global'} • {activeRecordingInfo.caller_id_number || activeRecordingInfo.source_extension || 'N/A'} &rarr; {activeRecordingInfo.destination_number || 'N/A'}
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={stopAudio} leftIcon={<Square size={12} />}>
              Stop Playback
            </Button>
          </Inline>
        </Alert>
      )}

      {/* Design System Tabs component */}
      <Tabs
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
        variant="line"
        items={[
          { id: 'summary', label: 'Summarized Reports (Traffic)', icon: <PieChart size={16} /> },
          { id: 'disposition', label: 'Disposition Summary', icon: <CheckCircle2 size={16} /> },
          { id: 'voicemail', label: 'Voicemail Analytics', icon: <Voicemail size={16} /> },
          { id: 'cdr', label: 'Call Detail Records (CDR)', icon: <FileText size={16} /> },
          { id: 'internal', label: 'Internal Calls Summary', icon: <PhoneCall size={16} /> },
          { id: 'outbound', label: 'Outbound Calls Analytics', icon: <PhoneOutgoing size={16} /> },
          { id: 'recordings', label: 'Voice Recordings', icon: <Disc size={16} /> },
        ]}
      />

      {/* Voicemail Analytics Panel */}
      {activeTab === 'voicemail' && (
        <Stack gap="6">
          <Grid cols={4} gap="4">
            <StatCard
              title="Total Voicemails"
              value={voicemailData?.total_messages ?? 0}
              icon={<Voicemail size={20} />}
            />
            <StatCard
              title="Unread Messages"
              value={voicemailData?.unread_messages ?? 0}
              icon={<Mail size={20} />}
              trend={voicemailData?.unread_messages > 0 ? `${voicemailData.unread_messages} unread` : undefined}
            />
            <StatCard
              title="Total Duration"
              value={`${Math.floor((voicemailData?.total_duration_seconds ?? 0) / 60)}m ${(voicemailData?.total_duration_seconds ?? 0) % 60}s`}
              icon={<Volume2 size={20} />}
            />
            <StatCard
              title="Configured Mailboxes"
              value={voicemailData?.summary?.length ?? 0}
              icon={<PhoneCall size={20} />}
            />
          </Grid>

          <FilterBar
            actions={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setVmExtensionFilter('');
                  setVmReadFilter('all');
                }}
              >
                Reset Filters
              </Button>
            }
            filters={
              <Inline gap="3" align="center" wrap={false} className="flex-wrap md:flex-nowrap">
                <div className="w-48">
                  <Input
                    placeholder="Filter by Extension..."
                    value={vmExtensionFilter}
                    onChange={(e) => setVmExtensionFilter(e.target.value)}
                  />
                </div>
                <div className="w-44">
                  <Select
                    value={vmReadFilter}
                    onChange={(e) => setVmReadFilter(e.target.value as any)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="unread">Unread Only</option>
                    <option value="read">Read Only</option>
                  </Select>
                </div>
              </Inline>
            }
          />

          <DataTable
            columns={voicemailColumns}
            data={voicemailData?.messages || []}
            isLoading={voicemailLoading}
            emptyTitle="No voicemail messages found"
          />
        </Stack>
      )}

      {/* Data Tables */}
      {activeTab === 'summary' && (
        <DataTable
          columns={summaryColumns}
          data={reportData}
          isLoading={loading}
          emptyTitle="No summary traffic records found"
        />
      )}

      {activeTab === 'disposition' && (
        <Stack gap="6">
          <Grid cols={5} gap="4">
            <StatCard
              title="Answered Calls"
              value={dispositionData?.answered ?? 0}
              icon={<CheckCircle2 size={20} className="text-[var(--pbx-success)]" />}
              trend={dispositionData?.total_calls ? `${Math.round(((dispositionData?.answered ?? 0) / dispositionData.total_calls) * 100)}% of total` : '0%'}
            />
            <StatCard
              title="No Answer"
              value={dispositionData?.no_answer ?? 0}
              icon={<PhoneMissed size={20} className="text-[var(--pbx-warning)]" />}
              trend={dispositionData?.total_calls ? `${Math.round(((dispositionData?.no_answer ?? 0) / dispositionData.total_calls) * 100)}% of total` : '0%'}
            />
            <StatCard
              title="User Busy"
              value={dispositionData?.busy ?? 0}
              icon={<PhoneOff size={20} className="text-[var(--pbx-warning)]" />}
              trend={dispositionData?.total_calls ? `${Math.round(((dispositionData?.busy ?? 0) / dispositionData.total_calls) * 100)}% of total` : '0%'}
            />
            <StatCard
              title="Failed Calls"
              value={dispositionData?.failed ?? 0}
              icon={<XCircle size={20} className="text-[var(--pbx-danger)]" />}
              trend={dispositionData?.total_calls ? `${Math.round(((dispositionData?.failed ?? 0) / dispositionData.total_calls) * 100)}% of total` : '0%'}
            />
            <StatCard
              title="Answer Rate"
              value={`${dispositionData?.answer_rate ?? 0}%`}
              icon={<Activity size={20} className="text-[var(--pbx-primary)]" />}
              trend={`${dispositionData?.total_calls ?? 0} total calls`}
            />
          </Grid>

          <DataTable
            columns={dispositionBreakdownColumns}
            data={dispositionData?.breakdown ?? []}
            isLoading={loading}
            emptyTitle="No disposition breakdown records found"
          />
        </Stack>
      )}

      {activeTab === 'cdr' && (
        <DataTable
          columns={cdrColumns}
          data={reportData}
          isLoading={loading}
          emptyTitle="No call detail records found"
          actions={(r: any) => r.recording_id ? (
            <Button
              variant={playingRecordingId === r.recording_id ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handlePlayRecording(r)}
              isLoading={audioLoadingId === r.recording_id}
              title={playingRecordingId === r.recording_id ? 'Pause' : 'Play'}
            >
              {playingRecordingId === r.recording_id ? <Pause size={14} /> : <Volume2 size={14} />}
            </Button>
          ) : undefined}
        />
      )}

      {activeTab === 'internal' && (
        <DataTable
          columns={internalColumns}
          data={reportData}
          isLoading={loading}
          emptyTitle="No internal call records found"
        />
      )}

      {activeTab === 'outbound' && (
        <DataTable
          columns={outboundColumns}
          data={reportData}
          isLoading={loading}
          emptyTitle="No outbound call records found"
        />
      )}

      {activeTab === 'recordings' && (
        <DataTable
          columns={recordingColumns}
          data={reportData}
          isLoading={loading}
          emptyTitle="No voice recordings found"
          actions={(r: any) => (
            <Button
              variant={playingRecordingId === r.id ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handlePlayRecording(r)}
              isLoading={audioLoadingId === r.id}
              title={playingRecordingId === r.id ? 'Pause' : 'Play'}
            >
              {playingRecordingId === r.id ? <Pause size={14} /> : <Volume2 size={14} />}
            </Button>
          )}
        />
      )}
    </ListPageLayout>
  );
};
