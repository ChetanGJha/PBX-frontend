import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Search, ArrowUpRight, ArrowDownLeft, PhoneCall } from 'lucide-react';

interface RoutingViewProps {
  token: string;
}

export const RoutingView: React.FC<RoutingViewProps> = ({ token }) => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const data = await apiService.getRoutes(token);
      setRoutes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, [token]);

  const filtered = routes.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.did_number && r.did_number.includes(search))
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Dialplan Engine</div>
          <h1 className="page-title">Call Routing & DIDs</h1>
          <p className="page-sub">Manage inbound DID number routing and outbound pattern matching rules</p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Inbound DIDs</span>
            <div style={{ background: '#ECFDF5', padding: '6px', borderRadius: '8px', color: '#047857' }}><ArrowDownLeft size={18} /></div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{routes.filter(r => r.route_type === 'inbound_did').length}</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Outbound Rules</span>
            <div style={{ background: '#FFF0EC', padding: '6px', borderRadius: '8px', color: 'var(--orange)' }}><ArrowUpRight size={18} /></div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{routes.filter(r => r.route_type === 'outbound').length}</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Total Active Routes</span>
            <div style={{ background: '#EFF6FF', padding: '6px', borderRadius: '8px', color: '#2563EB' }}><PhoneCall size={18} /></div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827' }}>{routes.length}</div>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input 
              className="form-control"
              style={{ paddingLeft: '36px', height: '38px', fontSize: '12px' }}
              placeholder="Search routes by name or DID number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Route Name</th>
                <th>DID / Pattern</th>
                <th>Route Type</th>
                <th>Destination Type</th>
                <th>Target Destination</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-4">Loading call routes...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-4 text-muted">No routing rules match your search</td></tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id}>
                    <td><div style={{ fontWeight: 700, color: '#111827' }}>{r.name}</div></td>
                    <td><code className="code-box" style={{ padding: '4px 8px', fontSize: '11px' }}>{r.did_number || r.regex_pattern || '*'}</code></td>
                    <td>
                      {r.route_type === 'inbound_did' ? (
                        <span className="terrix-badge green">INBOUND</span>
                      ) : (
                        <span className="terrix-badge orange">OUTBOUND</span>
                      )}
                    </td>
                    <td><span className="terrix-badge grey">{r.destination_type.toUpperCase()}</span></td>
                    <td><strong style={{ color: '#111827' }}>{r.destination}</strong></td>
                    <td><span style={{ fontWeight: 700 }}>P{r.priority}</span></td>
                    <td><span className="terrix-badge green">ENABLED</span></td>
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
