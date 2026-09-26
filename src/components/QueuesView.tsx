import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Users, Clock, Headphones } from 'lucide-react';

interface QueuesViewProps {
  token: string;
}

export const QueuesView: React.FC<QueuesViewProps> = ({ token }) => {
  const [queues, setQueues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQueues = async () => {
    try {
      setLoading(true);
      const data = await apiService.getQueues(token);
      setQueues(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueues();
  }, [token]);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">ACR Queue Engine</div>
          <h1 className="page-title">Call Queues</h1>
          <p className="page-sub">FreeSWITCH mod_callcenter agent queues, distribution strategies and wait timers</p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Active Queues</span>
            <div style={{ background: '#FFF0EC', padding: '6px', borderRadius: '8px', color: 'var(--orange)' }}><Users size={18} /></div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{queues.length}</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Active Agents</span>
            <div style={{ background: '#ECFDF5', padding: '6px', borderRadius: '8px', color: '#047857' }}><Headphones size={18} /></div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>8 Ready</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Avg Wait Time</span>
            <div style={{ background: '#EFF6FF', padding: '6px', borderRadius: '8px', color: '#2563EB' }}><Clock size={18} /></div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>12s</div>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Queue Name</th>
                <th>Extension</th>
                <th>Distribution Strategy</th>
                <th>Agent Timeout</th>
                <th>Max Wait Time</th>
                <th>Agents</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-4">Loading call queues...</td></tr>
              ) : queues.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-4 text-muted">No call queues configured</td></tr>
              ) : (
                queues.map((q) => (
                  <tr key={q.id}>
                    <td><div style={{ fontWeight: 700, color: '#111827' }}>{q.name}</div></td>
                    <td><code className="code-box" style={{ padding: '4px 8px', fontSize: '11px' }}>{q.queue_number}</code></td>
                    <td><span className="terrix-badge grey">{q.strategy.toUpperCase()}</span></td>
                    <td>{q.agent_timeout}s</td>
                    <td>{q.max_wait_time}s</td>
                    <td>{q.agents || 'All Extensions'}</td>
                    <td><span className="terrix-badge green">ACTIVE</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
