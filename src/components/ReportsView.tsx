import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect } from 'react';
import { apiService, getApiBaseUrl } from '../services/api';
import { FileText, PhoneOutgoing, PhoneCall, Disc, Volume2, Pause, Square, Loader2 } from 'lucide-react';
import { PageContainer } from './layout/PageContainer';
import { Stack, Inline } from './layout/Stack';
import {
  Button,
  Card,
  Input,
  Select,
  Badge,
  Alert
} from './ui';
import { DataTable, FilterBar } from './patterns';

interface ReportsViewProps {
  token: string;
  user?: User | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ token, user }) => {
  const { showSuccessModal, showErrorModal } = useToast();
  const [activeTab, setActiveTab] = useState<'cdr' | 'internal' | 'outbound' | 'recordings'>('cdr');
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState(user?.tenant_id || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);

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

  const loadReport = async () => {
    try {
      setLoading(true);
      if (activeTab === 'cdr') {
        const data = await apiService.getCdrReport(token, selectedTenant, startDate, endDate);
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
  }, [token, activeTab, selectedTenant, startDate, endDate]);

  const exportToCsv = () => {
    if (!reportData || reportData.length === 0) {
      showErrorModal('Export Notice', 'No data available to export for the current filters.');
      return;
    }
    try {
      const headers = Object.keys(reportData[0]);
      const csvRows = [
        headers.join(','),
        ...reportData.map(row =>
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
      showSuccessModal('Report Exported', `Successfully exported ${reportData.length} records to CSV.`);
    } catch (err: any) {
      showErrorModal('Export Failed', err.message || 'Failed to export report.');
    }
  };

  const cdrColumns = [
    { key: 'start_time', header: 'Start Time', render: (r: any) => r.start_stamp || r.start_time || 'N/A' },
    { key: 'caller', header: 'Caller ID / Number', render: (r: any) => <span><strong>{r.caller_id_number || r.caller_number || 'Unknown'}</strong> ({r.caller_id_name || r.caller_name || 'N/A'})</span> },
    { key: 'destination_number', header: 'Destination', render: (r: any) => <code className="code-box">{r.destination_number}</code> },
    { key: 'direction', header: 'Direction', render: (r: any) => <Badge variant="neutral">{r.direction || 'inbound'}</Badge> },
    { key: 'duration', header: 'Duration', render: (r: any) => `${r.duration || 0}s` },
    { key: 'billsec', header: 'Bill Sec', render: (r: any) => `${r.billsec || 0}s` },
    { key: 'tenant_name', header: 'Tenant', render: (r: any) => <Badge variant="warning">{r.tenant_name || 'Global'}</Badge> },
    { key: 'hangup_cause', header: 'Hangup Cause', render: (r: any) => <Badge variant="success">{r.hangup_cause || 'NORMAL_CLEARING'}</Badge> },
  ];

  const internalColumns = [
    { key: 'caller_id_number', header: 'Source Extension', render: (r: any) => <code className="code-box">{r.caller_id_number}</code> },
    { key: 'destination_number', header: 'Target Extension', render: (r: any) => <code className="code-box">{r.destination_number}</code> },
    { key: 'total_calls', header: 'Total Calls', render: (r: any) => <strong>{r.total_calls}</strong> },
    { key: 'total_duration_sec', header: 'Total Duration', render: (r: any) => `${r.total_duration_sec}s` },
    { key: 'avg_duration_sec', header: 'Avg Duration', render: (r: any) => `${r.avg_duration_sec}s` },
  ];

  const outboundColumns = [
    { key: 'start_time', header: 'Start Time', render: (r: any) => r.start_stamp || r.start_time || r.created_at || 'N/A' },
    { key: 'source', header: 'Originating Extension', render: (r: any) => <strong>{r.caller_id_number || r.source_extension || 'N/A'}</strong> },
    { key: 'destination', header: 'Destination', render: (r: any) => <code className="code-box">{r.destination_number || r.destination || 'N/A'}</code> },
    { key: 'duration', header: 'Duration', render: (r: any) => `${r.duration || 0}s` },
    { key: 'billsec', header: 'Billable Sec', render: (r: any) => `${r.billsec || 0}s` },
    { key: 'tenant_name', header: 'Tenant', render: (r: any) => <Badge variant="warning">{r.tenant_name || 'Global'}</Badge> },
  ];

  const recordingColumns = [
    { key: 'created_at', header: 'Recorded At', render: (r: any) => r.created_at || r.start_time || 'N/A' },
    { key: 'file_name', header: 'File Name', render: (r: any) => <strong>{r.file_name || 'recording.wav'}</strong> },
    { key: 'parties', header: 'Caller → Destination', render: (r: any) => (
      <Inline gap="2" align="center">
        <strong>{r.caller_number || r.source_extension || 'N/A'}</strong>
        <span className="text-[var(--pbx-text-muted)]">&rarr;</span>
        <code className="code-box">{r.destination_number || 'N/A'}</code>
      </Inline>
    )},
    { key: 'file_size', header: 'File Size', render: (r: any) => `${((r.file_size || 0) / 1024).toFixed(1)} KB` },
    { key: 'tenant_name', header: 'Tenant', render: (r: any) => <Badge variant="warning">{r.tenant_name || 'Global'}</Badge> },
  ];

  return (
    <PageContainer
      title="Reports & Call Detail Records"
      subtitle="Tenant-wise call logs, extension-to-extension summary, outbound analytics & voice recordings"
      eyebrow="Analytics & Telemetry"
      actions={
        <Button variant="primary" onClick={exportToCsv}>
          Export CSV
        </Button>
      }
    >
      <Stack gap="6">
        {/* Filters */}
        <Card padding="sm">
          <FilterBar
            filters={
              <Inline gap="4" align="center">
                {user?.role === 'SUPER_ADMIN' && tenants.length > 0 && (
                  <Select value={selectedTenant} onChange={(e) => setSelectedTenant(e.target.value)} className="w-56">
                    <option value="">-- All Tenants --</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.domain})
                      </option>
                    ))}
                  </Select>
                )}

                <Inline gap="2" align="center">
                  <span className="text-xs font-bold text-[var(--pbx-text-muted)] uppercase">From:</span>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-40" />
                  <span className="text-xs font-bold text-[var(--pbx-text-muted)] uppercase">To:</span>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-40" />
                </Inline>

                <Button variant="secondary" size="sm" onClick={() => { setSelectedTenant(user?.tenant_id || ''); setStartDate(''); setEndDate(''); }}>
                  Reset
                </Button>
              </Inline>
            }
          />
        </Card>

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

        {/* Navigation Tabs */}
        <Inline gap="2">
          <Button variant={activeTab === 'cdr' ? 'primary' : 'secondary'} onClick={() => setActiveTab('cdr')} leftIcon={<FileText size={14} />}>
            Call Detail Records (CDR)
          </Button>
          <Button variant={activeTab === 'internal' ? 'primary' : 'secondary'} onClick={() => setActiveTab('internal')} leftIcon={<PhoneCall size={14} />}>
            Internal Calls Summary
          </Button>
          <Button variant={activeTab === 'outbound' ? 'primary' : 'secondary'} onClick={() => setActiveTab('outbound')} leftIcon={<PhoneOutgoing size={14} />}>
            Outbound Calls Analytics
          </Button>
          <Button variant={activeTab === 'recordings' ? 'primary' : 'secondary'} onClick={() => setActiveTab('recordings')} leftIcon={<Disc size={14} />}>
            Voice Recordings
          </Button>
        </Inline>

        {/* Table */}
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
                leftIcon={playingRecordingId === r.recording_id ? <Pause size={12} /> : <Volume2 size={12} />}
              >
                {playingRecordingId === r.recording_id ? 'Pause' : 'Play'}
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
                leftIcon={playingRecordingId === r.id ? <Pause size={12} /> : <Volume2 size={12} />}
              >
                {playingRecordingId === r.id ? 'Pause' : 'Play'}
              </Button>
            )}
          />
        )}
      </Stack>
    </PageContainer>
  );
};
