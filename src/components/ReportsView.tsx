import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { ListPageLayout } from './layout';
import { Inline } from './layout/Stack';
import {
  Button,
  Input,
  Select,
  Badge,
  Alert,
  Tabs,
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

  const handleResetFilters = () => {
    setSelectedTenant(user?.tenant_id || '');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = Boolean((user?.role === 'SUPER_ADMIN' && selectedTenant) || startDate || endDate);

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
          {r.destination_number || 'N/A'}
        </span>
      )
    },
    {
      key: 'direction',
      header: 'Direction',
      render: (r: any) => {
        const dir = (r.direction || 'inbound').toLowerCase();
        return (
          <Badge variant={dir === 'inbound' ? 'info' : 'warning'}>
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
      header: 'Hangup Cause',
      render: (r: any) => {
        const cause = r.hangup_cause || 'NORMAL_CLEARING';
        const isSuccess = cause === 'NORMAL_CLEARING';
        return (
          <Badge variant={isSuccess ? 'success' : 'danger'}>
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
      subtitle="Tenant-wise call logs, extension-to-extension summary, outbound analytics & voice recordings"
      eyebrow="ANALYTICS & TELEMETRY"
      actions={
        <Button variant="primary" onClick={exportToCsv} leftIcon={<Download size={15} />}>
          Export CSV
        </Button>
      }
      filterBar={
        <FilterBar
          filters={
            <Inline gap="4" align="center" wrap={false} className="flex-wrap md:flex-nowrap">
              {user?.role === 'SUPER_ADMIN' && tenants.length > 0 && (
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
            { id: 'cdr', label: 'Call Detail Records (CDR)', icon: <FileText size={16} /> },
            { id: 'internal', label: 'Internal Calls Summary', icon: <PhoneCall size={16} /> },
            { id: 'outbound', label: 'Outbound Calls Analytics', icon: <PhoneOutgoing size={16} /> },
            { id: 'recordings', label: 'Voice Recordings', icon: <Disc size={16} /> },
          ]}
        />

        {/* Data Table */}
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



