import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect } from 'react';
import { apiService, getApiBaseUrl } from '../services/api';
import { FileText, Calendar, Filter, PhoneOutgoing, PhoneCall, Disc, Volume2, Pause, Square, Loader2 } from 'lucide-react';
import { CustomSelect } from './CustomSelect';

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

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Analytics & Telemetry</div>
          <h1 className="page-title">Reports & Call Detail Records</h1>
          <p className="page-sub">Tenant-wise call logs, extension-to-extension summary, outbound analytics & voice recordings</p>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
        {user?.role === 'SUPER_ADMIN' && tenants.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} style={{ color: '#9CA3AF' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Tenant Filter:</span>
            <div style={{ minWidth: '200px' }}>
              <CustomSelect
                options={[
                  { value: '', label: '-- All Tenants --' },
                  ...tenants.map(t => ({ value: t.id, label: `${t.name} (${t.domain})` }))
                ]}
                value={selectedTenant}
                onChange={(val) => setSelectedTenant(val)}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={16} style={{ color: '#9CA3AF' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>From:</span>
          <input type="date" className="form-control" style={{ height: '36px', fontSize: '12px' }} value={startDate} onChange={e => setStartDate(e.target.value)} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>To:</span>
          <input type="date" className="form-control" style={{ height: '36px', fontSize: '12px' }} value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>

        <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => { setSelectedTenant(user?.tenant_id || ''); setStartDate(''); setEndDate(''); }}>
          Reset Filters
        </button>
        <button className="btn-primary" style={{ padding: '6px 14px', fontSize: '11px' }} onClick={exportToCsv}>
          Export CSV
        </button>
      </div>

      {/* AUDIO PLAYER BAR (WHEN PLAYING) */}
      {playingRecordingId && activeRecordingInfo && (
        <div style={{
          background: '#FFF0EC',
          border: '1px solid #FFC9BE',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#FF5430', color: '#FFFFFF', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Volume2 size={16} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>
                Now Playing: {activeRecordingInfo.file_name || 'Call Recording Audio'}
              </div>
              <div style={{ fontSize: '11px', color: '#6B7280' }}>
                {activeRecordingInfo.tenant_name || 'Global'} • {activeRecordingInfo.caller_id_number || activeRecordingInfo.source_extension || 'N/A'} → {activeRecordingInfo.destination_number || 'N/A'}
              </div>
            </div>
          </div>
          <button
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
            onClick={stopAudio}
          >
            <Square size={12} />
            <span>Stop Playback</span>
          </button>
        </div>
      )}

      {/* REPORT TYPE TABS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button className={`btn-secondary ${activeTab === 'cdr' ? 'bg-[#FFF0EC] text-[#FF5430] font-bold border-[#FF5430]' : ''}`} onClick={() => setActiveTab('cdr')}>
          <FileText size={14} style={{ marginRight: '6px' }} /> Call Detail Records (CDR)
        </button>
        <button className={`btn-secondary ${activeTab === 'internal' ? 'bg-[#FFF0EC] text-[#FF5430] font-bold border-[#FF5430]' : ''}`} onClick={() => setActiveTab('internal')}>
          <PhoneCall size={14} style={{ marginRight: '6px' }} /> Internal Calls Summary
        </button>
        <button className={`btn-secondary ${activeTab === 'outbound' ? 'bg-[#FFF0EC] text-[#FF5430] font-bold border-[#FF5430]' : ''}`} onClick={() => setActiveTab('outbound')}>
          <PhoneOutgoing size={14} style={{ marginRight: '6px' }} /> Outbound Calls Analytics
        </button>
        <button className={`btn-secondary ${activeTab === 'recordings' ? 'bg-[#FFF0EC] text-[#FF5430] font-bold border-[#FF5430]' : ''}`} onClick={() => setActiveTab('recordings')}>
          <Disc size={14} style={{ marginRight: '6px' }} /> Voice Recordings
        </button>
      </div>

      {/* DATA TABLE */}
      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div className="data-table-wrap">
          {activeTab === 'cdr' && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Start Time</th>
                  <th>Caller ID / Number</th>
                  <th>Destination Number</th>
                  <th>Direction</th>
                  <th>Duration</th>
                  <th>Bill Sec</th>
                  <th>Tenant</th>
                  <th>Hangup Cause</th>
                  <th className="text-right">Recording</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-4">Loading CDR records...</td></tr>
                ) : reportData.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-4 text-muted">No call detail records found for selected filters</td></tr>
                ) : (
                  reportData.map(r => (
                    <tr key={r.id}>
                      <td>{r.start_stamp || r.start_time || 'N/A'}</td>
                      <td><strong>{r.caller_id_number || r.caller_number || 'Unknown'}</strong> ({r.caller_id_name || r.caller_name || 'N/A'})</td>
                      <td><code className="code-box" style={{ padding: '4px 8px', fontSize: '11px' }}>{r.destination_number}</code></td>
                      <td><span className="terrix-badge grey">{r.direction || 'inbound'}</span></td>
                      <td>{r.duration || 0}s</td>
                      <td>{r.billsec || 0}s</td>
                      <td><span className="terrix-badge orange">{r.tenant_name || 'Global'}</span></td>
                      <td><span className="terrix-badge green">{r.hangup_cause || 'NORMAL_CLEARING'}</span></td>
                      <td className="text-right">
                        {r.recording_id ? (
                          <button
                            className={playingRecordingId === r.recording_id ? "btn-primary" : "btn-secondary"}
                            style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handlePlayRecording(r)}
                            disabled={audioLoadingId === r.recording_id}
                          >
                            {audioLoadingId === r.recording_id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : playingRecordingId === r.recording_id ? (
                              <Pause size={12} />
                            ) : (
                              <Volume2 size={12} />
                            )}
                            <span>{playingRecordingId === r.recording_id ? 'Pause' : 'Play'}</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>None</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'internal' && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Source Extension</th>
                  <th>Target Extension</th>
                  <th>Total Calls</th>
                  <th>Total Duration (Sec)</th>
                  <th>Avg Duration (Sec)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-4">Loading internal call report...</td></tr>
                ) : reportData.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-4 text-muted">No internal call records found</td></tr>
                ) : (
                  reportData.map((r, i) => (
                    <tr key={i}>
                      <td><code className="code-box" style={{ padding: '4px 8px', fontSize: '11px' }}>{r.caller_id_number}</code></td>
                      <td><code className="code-box" style={{ padding: '4px 8px', fontSize: '11px' }}>{r.destination_number}</code></td>
                      <td><strong>{r.total_calls}</strong></td>
                      <td>{r.total_duration_sec}s</td>
                      <td>{r.avg_duration_sec}s</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'outbound' && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Start Time / Recorded At</th>
                  <th>Originating Extension</th>
                  <th>Outbound Destination</th>
                  <th>Duration</th>
                  <th>Billable Sec</th>
                  <th>Tenant</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-4">Loading outbound call report...</td></tr>
                ) : reportData.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-4 text-muted">No outbound call records found</td></tr>
                ) : (
                  reportData.map((r, i) => (
                    <tr key={i}>
                      <td>{r.start_stamp || r.start_time || r.created_at || 'N/A'}</td>
                      <td><strong>{r.caller_id_number || r.source_extension || 'N/A'}</strong></td>
                      <td><code className="code-box" style={{ padding: '4px 8px', fontSize: '11px' }}>{r.destination_number || r.destination || 'N/A'}</code></td>
                      <td>{r.duration || 0}s</td>
                      <td>{r.billsec || 0}s</td>
                      <td><span className="terrix-badge orange">{r.tenant_name || 'Global'}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'recordings' && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Recorded At</th>
                  <th>File Name</th>
                  <th>Caller → Destination</th>
                  <th>File Size</th>
                  <th>Tenant</th>
                  <th className="text-right">Audio Playback</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-4">Loading voice recordings...</td></tr>
                ) : reportData.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-4 text-muted">No voice recordings found</td></tr>
                ) : (
                  reportData.map(r => (
                    <tr key={r.id}>
                      <td>{r.created_at || r.start_time || 'N/A'}</td>
                      <td><strong>{r.file_name || 'recording.wav'}</strong></td>
                      <td>
                        <span style={{ fontSize: '12px' }}>
                          <strong>{r.caller_number || r.source_extension || 'N/A'}</strong>
                          <span style={{ color: '#9CA3AF', margin: '0 4px' }}>→</span>
                          <code className="code-box" style={{ padding: '2px 6px', fontSize: '11px' }}>{r.destination_number || 'N/A'}</code>
                        </span>
                      </td>
                      <td>{((r.file_size || 0) / 1024).toFixed(1)} KB</td>
                      <td><span className="terrix-badge orange">{r.tenant_name || 'Global'}</span></td>
                      <td className="text-right">
                        <button
                          className={playingRecordingId === r.id ? "btn-primary" : "btn-secondary"}
                          style={{ padding: '4px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                          onClick={() => handlePlayRecording(r)}
                          disabled={audioLoadingId === r.id}
                        >
                          {audioLoadingId === r.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : playingRecordingId === r.id ? (
                            <Pause size={13} />
                          ) : (
                            <Volume2 size={13} />
                          )}
                          <span>{playingRecordingId === r.id ? 'Pause' : 'Play'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
