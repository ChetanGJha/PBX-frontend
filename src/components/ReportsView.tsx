import type { User } from '../types';
import { useToast } from './ToastProvider';
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { FileText, Calendar, Filter, PhoneOutgoing, PhoneCall, Disc, Volume2 } from 'lucide-react';

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} style={{ color: '#9CA3AF' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Tenant Filter:</span>
          <select className="form-control" style={{ height: '36px', fontSize: '12px', minWidth: '180px' }} value={selectedTenant} onChange={e => setSelectedTenant(e.target.value)}>
            <option value="">-- All Tenants --</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.name} ({t.domain})</option>)}
          </select>
        </div>

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
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-4">Loading CDR records...</td></tr>
                ) : reportData.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-4 text-muted">No call detail records found for selected filters</td></tr>
                ) : (
                  reportData.map(r => (
                    <tr key={r.id}>
                      <td>{r.start_stamp}</td>
                      <td><strong>{r.caller_id_number}</strong> ({r.caller_id_name || 'N/A'})</td>
                      <td><code className="code-box" style={{ padding: '4px 8px', fontSize: '11px' }}>{r.destination_number}</code></td>
                      <td><span className="terrix-badge grey">{r.direction || 'inbound'}</span></td>
                      <td>{r.duration}s</td>
                      <td>{r.billsec}s</td>
                      <td><span className="terrix-badge orange">{r.tenant_name || 'Global'}</span></td>
                      <td><span className="terrix-badge green">{r.hangup_cause || 'NORMAL_CLEARING'}</span></td>
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
                  <th>Start Time</th>
                  <th>Originating Extension</th>
                  <th>Outbound Destination</th>
                  <th>Billable Sec</th>
                  <th>Tenant</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-4">Loading outbound call report...</td></tr>
                ) : reportData.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-4 text-muted">No outbound call records found</td></tr>
                ) : (
                  reportData.map((r, i) => (
                    <tr key={i}>
                      <td>{r.start_stamp}</td>
                      <td><strong>{r.caller_id_number}</strong></td>
                      <td><code className="code-box" style={{ padding: '4px 8px', fontSize: '11px' }}>{r.destination_number}</code></td>
                      <td>{r.billsec}s</td>
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
                  <th>File Size</th>
                  <th>Tenant</th>
                  <th>Audio Playback</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-4">Loading voice recordings...</td></tr>
                ) : reportData.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-4 text-muted">No voice recordings found</td></tr>
                ) : (
                  reportData.map(r => (
                    <tr key={r.id}>
                      <td>{r.created_at}</td>
                      <td><strong>{r.file_name}</strong></td>
                      <td>{(r.file_size / 1024).toFixed(1)} KB</td>
                      <td><span className="terrix-badge orange">{r.tenant_name || 'Global'}</span></td>
                      <td>
                        <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => showSuccessModal("Playback Recording", `Recording loaded: ${r.file_name} (${(r.file_size / 1024).toFixed(1)} KB)`)}>
                          <Volume2 size={13} style={{ marginRight: '4px' }} /> Play Recording
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
