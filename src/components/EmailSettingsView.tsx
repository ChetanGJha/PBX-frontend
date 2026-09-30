import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Server,
  Eye,
  EyeOff,
  RefreshCw,
  Info,
  Lock,
  ShieldCheck,
  Check,
  User,
  KeyRound,
  Sparkles
} from 'lucide-react';
import { apiService } from '../services/api';
import type { Tenant, SmtpSettings } from '../types';
import { useToast } from './ToastProvider';

interface EmailSettingsViewProps {
  token: string | null;
  user?: any;
}

interface ProviderPreset {
  id: string;
  name: string;
  badge: string;
  host: string;
  port: number;
  useTls: boolean;
  usernameHint: string;
  note: string;
  color: string;
}

const PRESETS: ProviderPreset[] = [
  {
    id: 'gmail',
    name: 'Google Workspace',
    badge: 'Gmail',
    host: 'smtp.gmail.com',
    port: 587,
    useTls: true,
    usernameHint: 'user@yourcompany.com',
    note: 'Requires a Google 16-character App Password (not standard account password).',
    color: '#EA4335'
  },
  {
    id: 'office365',
    name: 'Microsoft 365',
    badge: 'Outlook',
    host: 'smtp.office365.com',
    port: 587,
    useTls: true,
    usernameHint: 'user@yourdomain.com',
    note: 'Requires "Authenticated SMTP" enabled in Microsoft 365 Admin Center.',
    color: '#0078D4'
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    badge: 'Twilio',
    host: 'smtp.sendgrid.net',
    port: 587,
    useTls: true,
    usernameHint: 'apikey',
    note: 'Username is literally "apikey" and password is your SendGrid API Secret.',
    color: '#1A82E2'
  },
  {
    id: 'ses',
    name: 'Amazon SES',
    badge: 'AWS',
    host: 'email-smtp.us-east-1.amazonaws.com',
    port: 587,
    useTls: true,
    usernameHint: 'AKIAIOSFODNN7EXAMPLE',
    note: 'Use dedicated AWS SES SMTP credentials created in the SES Console.',
    color: '#FF9900'
  }
];

export const EmailSettingsView: React.FC<EmailSettingsViewProps> = ({ token, user }) => {
  const { toastSuccess, toastError, toastInfo } = useToast();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Tenants list for Super Admin dropdown
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    isSuperAdmin ? '' : (user?.tenant_id || '')
  );

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // SMTP Settings State
  const [settings, setSettings] = useState<SmtpSettings | null>(null);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [useTls, setUseTls] = useState(true);
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('PBX Voicemail');

  // Test Email State
  const [testRecipient, setTestRecipient] = useState(user?.email || '');
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  // Load Tenants for Super Admin
  useEffect(() => {
    if (isSuperAdmin && token) {
      apiService.getTenants(token)
        .then((tnts) => setTenants(tnts))
        .catch((err) => console.error('Failed to load tenants:', err));
    }
  }, [isSuperAdmin, token]);

  // Load SMTP Settings
  const fetchSettings = async (isManual = false) => {
    if (!token) return;
    setLoading(true);
    try {
      const tenantParam = selectedTenantId || undefined;
      const data: SmtpSettings = await apiService.getSmtpSettings(token, tenantParam);
      setSettings(data);

      setSmtpHost(data.smtp_host || '');
      setSmtpPort(data.smtp_port || 587);
      setUseTls(data.use_tls !== undefined ? !!data.use_tls : true);
      setSmtpUsername(data.smtp_username || '');
      setSmtpPassword(data.smtp_password || '');
      setFromEmail(data.from_email || '');
      setFromName(data.from_name || 'PBX Voicemail');

      if (isManual) {
        toastInfo('Settings Reloaded', 'Fetched the latest SMTP configuration from the server.');
      }
    } catch (err: any) {
      toastError('Failed to load SMTP settings', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token, selectedTenantId]);

  // Apply Provider Preset
  const handleApplyPreset = (preset: ProviderPreset) => {
    setSmtpHost(preset.host);
    setSmtpPort(preset.port);
    setUseTls(preset.useTls);
    toastInfo(`Preset Selected: ${preset.name}`, preset.note);
  };

  // Save Settings
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token) return;

    if (!smtpHost.trim()) {
      toastError('Validation Error', 'SMTP Server Host is required.');
      return;
    }
    if (!fromEmail.trim()) {
      toastError('Validation Error', 'Sender Email (From) address is required.');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        smtp_host: smtpHost.trim(),
        smtp_port: Number(smtpPort),
        use_tls: useTls,
        smtp_username: smtpUsername.trim() || null,
        smtp_password: smtpPassword, // Empty or •••••••• preserves existing in backend
        from_email: fromEmail.trim(),
        from_name: fromName.trim() || 'PBX Voicemail',
        tenant_id: selectedTenantId || null,
      };

      await apiService.updateSmtpSettings(token, payload);
      toastSuccess('Settings Saved', 'Outbound email configuration updated successfully.');
      await fetchSettings(false);
    } catch (err: any) {
      toastError('Save Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  // Reset to Global Default (for Tenant)
  const handleResetToGlobal = async () => {
    if (!token || !selectedTenantId) return;
    if (!window.confirm('Are you sure you want to revert this tenant to the Global PBX Default SMTP server?')) {
      return;
    }

    setSaving(true);
    try {
      await apiService.deleteSmtpSettings(token, selectedTenantId);
      toastSuccess('Reset Successful', 'Reverted to Global PBX Default SMTP settings.');
      await fetchSettings(false);
    } catch (err: any) {
      toastError('Reset Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  // Send Test Email
  const handleSendTestEmail = async () => {
    if (!token) return;
    if (!testRecipient.trim()) {
      toastError('Validation Error', 'Please enter a recipient email address.');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const payload = {
        to_email: testRecipient.trim(),
        smtp_host: smtpHost.trim() || undefined,
        smtp_port: Number(smtpPort) || undefined,
        use_tls: useTls,
        smtp_username: smtpUsername.trim() || undefined,
        smtp_password: smtpPassword || undefined,
        from_email: fromEmail.trim() || undefined,
        from_name: fromName.trim() || undefined,
        tenant_id: selectedTenantId || undefined,
      };

      const res = await apiService.testSmtpConnection(token, payload);
      setTestResult(res);
      if (res.success) {
        toastSuccess('Test Email Sent', `Verification message delivered to ${testRecipient}`);
      } else {
        toastError('Delivery Failed', res.error || 'Server rejected connection');
      }
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
      toastError('Test Failed', err.message);
    } finally {
      setTesting(false);
    }
  };

  const isCustomTenantConfigured = settings?.configured && !settings?.is_using_global_fallback && !!selectedTenantId;
  const isInheritingGlobal = selectedTenantId && settings?.is_using_global_fallback;
  const activePreset = PRESETS.find(p => p.host.toLowerCase() === smtpHost.trim().toLowerCase());

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28, paddingBottom: 80 }}>
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <div className="eyebrow flex items-center gap-1.5" style={{ marginBottom: 6 }}>
            <Mail className="w-3.5 h-3.5 text-[#FF5430]" />
            Outbound Mail Gateway
          </div>
          <h1 className="page-title" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            SMTP & Email Delivery
          </h1>
          <p className="page-sub" style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            Configure mail servers to automatically dispatch voicemail audio notifications and PBX alert digests.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Scope Selector for Super Admin */}
          {isSuperAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFFFFF', padding: '8px 14px', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <Globe className="w-4 h-4 text-[#FF5430]" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scope:</span>
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 6, padding: '4px 8px', fontSize: 12, fontWeight: 600, color: '#1E293B', outline: 'none' }}
              >
                <option value="">Global PBX Default (Master Fallback)</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    Tenant: {t.name} ({t.domain})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => fetchSettings(true)}
            disabled={loading}
            className="btn-secondary"
            title="Reload latest configuration from server"
            style={{ height: 42, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#FF5430]' : ''}`} />
            <span>{loading ? 'Reloading...' : 'Reload'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="btn-primary"
            style={{ height: 42, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* ── Status / Scope Banner ───────────────────────────────── */}
      {selectedTenantId ? (
        isInheritingGlobal ? (
          <div className="card" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 100%)', borderColor: '#BFDBFE', borderRadius: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#DBEAFE', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Globe className="w-6 h-6" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1E3A8A' }}>Inheriting Global PBX Mail Server</span>
                  <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: '#BFDBFE', color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Default Fallback
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#3B82F6', marginTop: 4, lineHeight: 1.5 }}>
                  This tenant does not have a custom SMTP server and delivers emails via the master PBX gateway. Configure and save below to switch to a dedicated server.
                </p>
              </div>
            </div>
          </div>
        ) : isCustomTenantConfigured ? (
          <div className="card" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDFA 100%)', borderColor: '#A7F3D0', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#D1FAE5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#064E3B' }}>Dedicated Tenant Mail Server Active</span>
                  <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: '#A7F3D0', color: '#065F46', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Custom Route
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#047857', marginTop: 4, lineHeight: 1.5 }}>
                  Emails for this tenant are delivered through this custom configured SMTP server.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetToGlobal}
              disabled={saving}
              style={{ fontSize: 12, fontWeight: 600, background: '#FFFFFF', color: '#DC2626', border: '1px solid #FECACA', padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.15s ease' }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Global Default
            </button>
          </div>
        ) : (
          <div className="card" style={{ padding: '20px 24px', background: '#FFFBEB', borderColor: '#FDE68A', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#78350F' }}>No SMTP Server Configured</div>
              <p style={{ fontSize: 12, color: '#92400E', marginTop: 4 }}>
                Neither tenant nor global SMTP settings are set. Outbound voicemail delivery is inactive.
              </p>
            </div>
          </div>
        )
      ) : (
        <div className="card" style={{ padding: '20px 24px', background: '#F8FAFC', borderColor: '#E2E8F0', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#E2E8F0', color: '#FF5430', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Global PBX Default Gateway Settings</div>
            <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
              These credentials serve as the master fallback for all tenants that do not have their own dedicated SMTP server.
            </p>
          </div>
        </div>
      )}

      {/* ── Provider Quick Setup (Visual Cards) ─────────────────── */}
      <div className="card" style={{ padding: '28px 30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles className="w-4 h-4 text-[#FF5430]" />
              Popular Email Providers
            </h2>
            <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
              Select your email provider to automatically configure recommended host, port, and security protocols.
            </p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#F1F5F9', padding: '4px 10px', borderRadius: 6 }}>
            1-Click Preset
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {PRESETS.map((preset) => {
            const isSelected = activePreset?.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                style={{
                  padding: '20px',
                  borderRadius: 14,
                  minHeight: 145,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  border: isSelected ? '2px solid #FF5430' : '1px solid #E2E8F0',
                  background: isSelected ? '#FFF8F6' : '#FFFFFF',
                  boxShadow: isSelected ? '0 4px 14px rgba(255, 84, 48, 0.12)' : '0 1px 3px rgba(0,0,0,0.03)',
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: isSelected ? '#FF5430' : '#1E293B' }}>
                      {preset.name}
                    </span>
                    {isSelected ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: '#FF5430', color: '#FFFFFF', flexShrink: 0 }}>
                        <Check className="w-2.5 h-2.5" /> Selected
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', background: '#F1F5F9', padding: '3px 8px', borderRadius: 6, flexShrink: 0 }}>
                        {preset.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '4px 8px', borderRadius: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', fontFamily: 'monospace', fontSize: 11, color: '#334155', display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`${preset.host}:${preset.port}`}>
                    {preset.host}:{preset.port}
                  </div>
                </div>
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #F1F5F9', fontSize: 11, color: '#64748B', lineHeight: 1.45 }}>
                  {preset.note}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Configuration Grid ─────────────────────────────── */}
      <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24 }}>
        {/* Left Column (8 Cols): Connection & Credentials */}
        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Card 1: Server Connection */}
          <div className="card" style={{ padding: '28px 30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 16, marginBottom: 24, borderBottom: '1px solid #F1F5F9' }}>
              <Server className="w-4 h-4 text-[#FF5430]" />
              <h3 style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                1. Server Connection & Protocols
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ marginBottom: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                    SMTP Server Host <span style={{ color: '#FF5430' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Server className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      placeholder="e.g. smtp.gmail.com"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      required
                      className="form-control"
                      style={{ height: 44, paddingLeft: 42, fontSize: 13 }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ marginBottom: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                    Port <span style={{ color: '#FF5430' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    required
                    min={1}
                    max={65535}
                    className="form-control"
                    style={{ height: 44, fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Port Quick Helpers */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Common Ports:</span>
                {[
                  { port: 587, label: '587 (STARTTLS - Standard)' },
                  { port: 465, label: '465 (SSL / SMTPS)' },
                  { port: 25, label: '25 (Unencrypted Relays)' }
                ].map((p) => (
                  <button
                    key={p.port}
                    type="button"
                    onClick={() => {
                      setSmtpPort(p.port);
                      if (p.port === 25) setUseTls(false);
                      else setUseTls(true);
                    }}
                    style={{
                      fontSize: 11,
                      padding: '5px 12px',
                      borderRadius: 8,
                      border: smtpPort === p.port ? '1px solid #1E293B' : '1px solid #E2E8F0',
                      background: smtpPort === p.port ? '#1E293B' : '#FFFFFF',
                      color: smtpPort === p.port ? '#FFFFFF' : '#475569',
                      fontWeight: smtpPort === p.port ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Security & TLS Toggle Card */}
              <div style={{ padding: '18px 20px', borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <label htmlFor="useTls" style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', cursor: 'pointer', display: 'block' }}>
                      Enable STARTTLS / Secure Encryption
                    </label>
                    <span style={{ fontSize: 11, color: '#64748B', display: 'block', marginTop: 2 }}>
                      Encrypts communications during SMTP handshake (highly recommended).
                    </span>
                  </div>
                </div>

                <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    id="useTls"
                    checked={useTls}
                    onChange={(e) => setUseTls(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF5430]"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Card 2: Authentication & Sender Identity */}
          <div className="card" style={{ padding: '28px 30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 16, marginBottom: 24, borderBottom: '1px solid #F1F5F9' }}>
              <Lock className="w-4 h-4 text-[#FF5430]" />
              <h3 style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                2. Authentication & Sender Details
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Username */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ marginBottom: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                  SMTP Username / API Key
                </label>
                <div style={{ position: 'relative' }}>
                  <User className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    placeholder="e.g. user@domain.com or apikey"
                    value={smtpUsername}
                    onChange={(e) => setSmtpUsername(e.target.value)}
                    className="form-control"
                    style={{ height: 44, paddingLeft: 42, fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label className="form-label" style={{ marginBottom: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                    SMTP Password / Secret
                  </label>
                  {settings?.smtp_password && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <Check className="w-2.5 h-2.5" /> Saved
                    </span>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <KeyRound className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={settings?.smtp_password ? '••••••••' : 'Enter password or API key'}
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    className="form-control"
                    style={{ height: 44, paddingLeft: 42, paddingRight: 44, fontSize: 13 }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 6, borderRadius: 6 }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-slate-600" /> : <Eye className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
                <span style={{ fontSize: 11, color: '#94A3B8', marginTop: 6, display: 'block' }}>
                  Leave blank to preserve existing password.
                </span>
              </div>

              {/* Sender Email (From) */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ marginBottom: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                  Sender Email (From) <span style={{ color: '#FF5430' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type="email"
                    placeholder="voicemail@mycompany.com"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    required
                    className="form-control"
                    style={{ height: 44, paddingLeft: 42, fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Sender Display Name */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ marginBottom: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
                  Sender Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme PBX Voicemail"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  className="form-control"
                  style={{ height: 44, fontSize: 13 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 Cols): Live Test & Actions Card */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Card 3: Interactive Delivery Verification */}
          <div className="card" style={{ padding: '28px 26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 16, marginBottom: 20, borderBottom: '1px solid #F1F5F9' }}>
              <Send className="w-4 h-4 text-[#FF5430]" />
              <h3 style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Live Delivery Test
              </h3>
            </div>

            <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5, marginBottom: 20 }}>
              Dispatch an immediate test email to verify host connectivity, TLS negotiation, and credentials before saving.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ marginBottom: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>Destination Email Address</label>
                <input
                  type="email"
                  placeholder="recipient@example.com"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  className="form-control"
                  style={{ height: 44, fontSize: 13 }}
                />
              </div>

              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={testing}
                className="btn-secondary"
                style={{ height: 44, width: '100%', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FF5430]" />
                    <span>Verifying Delivery...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-[#FF5430]" />
                    <span>Send Test Email</span>
                  </>
                )}
              </button>

              {testResult && (
                <div
                  style={{
                    padding: '16px',
                    borderRadius: 12,
                    fontSize: 12,
                    lineHeight: 1.5,
                    border: testResult.success ? '1px solid #A7F3D0' : '1px solid #FECACA',
                    background: testResult.success ? '#ECFDF5' : '#FEF2F2',
                    color: testResult.success ? '#065F46' : '#991B1B'
                  }}
                >
                  {testResult.success ? (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div style={{ fontWeight: 700 }}>Verification Succeeded!</div>
                        <div style={{ fontSize: 11, color: '#047857', marginTop: 2 }}>{testResult.message}</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <div style={{ fontWeight: 700 }}>Connection Error:</div>
                        <div style={{ fontSize: 11, color: '#991B1B', marginTop: 4, wordBreak: 'break-word', fontFamily: 'monospace' }}>
                          {testResult.error}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Help Card */}
          <div className="card" style={{ padding: '22px 24px', background: '#F8FAFC', borderColor: '#E2E8F0', borderRadius: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Info className="w-3.5 h-3.5 text-[#FF5430]" />
              Voicemail Audio Attachments
            </div>
            <p style={{ fontSize: 11, lineHeight: 1.55, color: '#64748B' }}>
              When an extension receives a voicemail, the FreeSWITCH engine automatically converts the recording to standard WAV format and delivers it with transcript metadata to the extension's notification email address.
            </p>
          </div>
        </div>

        {/* Bottom Full-Width Action Bar */}
        <div className="card" style={{ gridColumn: 'span 12', padding: '20px 28px', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', background: '#FFFFFF', borderColor: '#E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: 12, color: '#64748B' }}>
            {settings?.updated_at ? (
              <span>Last updated: {new Date(settings.updated_at).toLocaleString()}</span>
            ) : (
              <span>Configure your SMTP settings to activate email notifications</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={() => fetchSettings(true)}
              disabled={loading}
              className="btn-secondary"
              style={{ height: 42, padding: '0 18px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Reload Settings</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{ height: 42, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save SMTP Settings'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
