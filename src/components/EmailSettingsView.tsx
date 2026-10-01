import React, { useState, useEffect } from 'react';
import {
  Send,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Globe,
  RefreshCw,
  ShieldCheck,
  Check,
  Sparkles
} from 'lucide-react';
import { apiService } from '../services/api';
import type { Tenant, SmtpSettings } from '../types';
import { useToast } from './ToastProvider';
import { PageContainer } from './layout/PageContainer';
import { Stack, Inline, Grid } from './layout/Stack';
import {
  Button,
  Card,
  Input,
  Select,
  FormField,
  Badge,
  Alert
} from './ui';

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
    note: 'Requires a Google 16-character App Password.',
  },
  {
    id: 'office365',
    name: 'Microsoft 365',
    badge: 'Outlook',
    host: 'smtp.office365.com',
    port: 587,
    useTls: true,
    usernameHint: 'user@yourdomain.com',
    note: 'Requires Authenticated SMTP enabled in Microsoft 365 Admin Center.',
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
  }
];

export const EmailSettingsView: React.FC<EmailSettingsViewProps> = ({ token, user }) => {
  const { toastSuccess, toastError, toastInfo } = useToast();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    isSuperAdmin ? '' : (user?.tenant_id || '')
  );

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [settings, setSettings] = useState<SmtpSettings | null>(null);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [useTls, setUseTls] = useState(true);
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('PBX Voicemail');

  const [testRecipient, setTestRecipient] = useState(user?.email || '');
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  useEffect(() => {
    if (isSuperAdmin && token) {
      apiService.getTenants(token)
        .then((tnts) => setTenants(tnts))
        .catch((err) => console.error('Failed to load tenants:', err));
    }
  }, [isSuperAdmin, token]);

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

  const handleApplyPreset = (preset: ProviderPreset) => {
    setSmtpHost(preset.host);
    setSmtpPort(preset.port);
    setUseTls(preset.useTls);
    toastInfo(`Preset Selected: ${preset.name}`, preset.note);
  };

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
        smtp_password: smtpPassword,
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
    <PageContainer
      title="SMTP & Email Delivery"
      subtitle="Configure mail servers to automatically dispatch voicemail audio notifications and PBX alert digests."
      eyebrow="Outbound Mail Gateway"
      actions={
        <Inline gap="3" align="center">
          {isSuperAdmin && (
            <Select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="w-64"
            >
              <option value="">Global PBX Default</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  Tenant: {t.name} ({t.domain})
                </option>
              ))}
            </Select>
          )}

          <Button variant="secondary" onClick={() => fetchSettings(true)} isLoading={loading} leftIcon={<RefreshCw size={14} />}>
            Reload
          </Button>

          <Button variant="primary" onClick={() => handleSave()} isLoading={saving} leftIcon={<Save size={16} />}>
            Save Changes
          </Button>
        </Inline>
      }
    >
      <Stack gap="6">
        {/* Status Banner */}
        {selectedTenantId ? (
          isInheritingGlobal ? (
            <Alert variant="info" icon={<Globe className="w-5 h-5" />}>
              <div className="font-bold">Inheriting Global PBX Mail Server</div>
              <div>This tenant does not have a custom SMTP server and delivers emails via the master PBX gateway.</div>
            </Alert>
          ) : isCustomTenantConfigured ? (
            <Alert variant="success" icon={<CheckCircle2 className="w-5 h-5" />}>
              <Inline justify="between" align="center" className="w-full">
                <div>
                  <div className="font-bold">Dedicated Tenant Mail Server Active</div>
                  <div>Emails for this tenant are delivered through this custom configured SMTP server.</div>
                </div>
                <Button variant="secondary" size="sm" onClick={handleResetToGlobal} isLoading={saving} leftIcon={<RotateCcw size={14} />}>
                  Reset to Global
                </Button>
              </Inline>
            </Alert>
          ) : (
            <Alert variant="warning" icon={<AlertTriangle className="w-5 h-5" />}>
              <div className="font-bold">No SMTP Server Configured</div>
              <div>Neither tenant nor global SMTP settings are set. Outbound voicemail delivery is inactive.</div>
            </Alert>
          )
        ) : (
          <Alert variant="info" icon={<Globe className="w-5 h-5" />}>
            <div className="font-bold">Global PBX Default Gateway Settings</div>
            <div>These credentials serve as the master fallback for all tenants that do not have their own dedicated SMTP server.</div>
          </Alert>
        )}

        {/* Quick Presets */}
        <Card>
          <Stack gap="4">
            <Inline justify="between" align="center">
              <div>
                <h3 className="text-sm font-bold text-[var(--pbx-text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={16} className="text-[var(--pbx-accent-primary)]" /> Popular Email Presets
                </h3>
                <p className="text-xs text-[var(--pbx-text-muted)] mt-1">Select a provider to apply standard server host and port configurations.</p>
              </div>
              <Badge variant="neutral">1-Click Preset</Badge>
            </Inline>

            <Grid cols={4} gap="4">
              {PRESETS.map((preset) => {
                const isSelected = activePreset?.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between min-h-[130px] ${
                      isSelected
                        ? 'border-[var(--pbx-accent-primary)] bg-[var(--pbx-accent-light)]'
                        : 'border-[var(--pbx-border)] bg-[var(--pbx-bg-surface)] hover:border-[var(--pbx-text-secondary)]'
                    }`}
                  >
                    <div>
                      <Inline justify="between" align="center" className="mb-2">
                        <span className={`text-xs font-extrabold ${isSelected ? 'text-[var(--pbx-accent-primary)]' : 'text-[var(--pbx-text-primary)]'}`}>
                          {preset.name}
                        </span>
                        {isSelected ? (
                          <Badge variant="primary">
                            <Check size={10} /> Active
                          </Badge>
                        ) : (
                          <Badge variant="neutral">{preset.badge}</Badge>
                        )}
                      </Inline>
                      <code className="text-[11px] text-[var(--pbx-text-secondary)] font-mono">{preset.host}:{preset.port}</code>
                    </div>
                    <div className="text-[11px] text-[var(--pbx-text-muted)] mt-3 pt-2 border-t border-[var(--pbx-border)]">
                      {preset.note}
                    </div>
                  </button>
                );
              })}
            </Grid>
          </Stack>
        </Card>

        {/* Form Grid */}
        <form onSubmit={handleSave}>
          <Stack gap="6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (8 Cols): Server Config & Credentials */}
              <div className="lg:col-span-8 space-y-6">
                <Card>
                  <div className="flex items-center gap-2 pb-4 mb-6 border-b border-slate-100">
                    <Globe size={18} className="text-[var(--pbx-action-primary)]" />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Outbound Server Configuration</h3>
                      <p className="text-xs text-slate-500">Primary SMTP gateway hostname and connection port</p>
                    </div>
                  </div>

                  <Stack gap="4">
                    <Grid cols={3} gap="4">
                      <div className="col-span-2">
                        <FormField label="SMTP Host / Server Domain" required>
                          <Input
                            type="text"
                            value={smtpHost}
                            onChange={(e) => setSmtpHost(e.target.value)}
                            placeholder="smtp.example.com"
                            required
                          />
                        </FormField>
                      </div>
                      <div>
                        <FormField label="Port" required>
                          <Input
                            type="number"
                            value={String(smtpPort)}
                            onChange={(e) => setSmtpPort(Number(e.target.value))}
                            placeholder="587"
                            required
                          />
                        </FormField>
                      </div>
                    </Grid>

                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm text-slate-900">Enforce TLS / STARTTLS Encryption</div>
                        <div className="text-xs text-slate-500">Encrypt outbound emails over SSL/TLS</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={useTls}
                        onChange={(e) => setUseTls(e.target.checked)}
                        className="w-5 h-5 accent-[var(--pbx-action-primary)] cursor-pointer"
                      />
                    </div>
                  </Stack>
                </Card>

                <Card>
                  <div className="flex items-center gap-2 pb-4 mb-6 border-b border-slate-100">
                    <ShieldCheck size={18} className="text-[var(--pbx-action-primary)]" />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">Authentication & Sender Identity</h3>
                      <p className="text-xs text-slate-500">Relay credentials and default email headers</p>
                    </div>
                  </div>

                  <Stack gap="4">
                    <Grid cols={2} gap="4">
                      <FormField label="SMTP Username / API Key">
                        <Input
                          type="text"
                          value={smtpUsername}
                          onChange={(e) => setSmtpUsername(e.target.value)}
                          placeholder="user@domain.com or apikey"
                        />
                      </FormField>

                      <FormField label="SMTP Password / Secret">
                        <Input
                          type="password"
                          value={smtpPassword}
                          onChange={(e) => setSmtpPassword(e.target.value)}
                          placeholder={settings?.smtp_password ? '••••••••' : 'Enter password'}
                        />
                      </FormField>
                    </Grid>

                    <Grid cols={2} gap="4">
                      <FormField label="From Email Address" required>
                        <Input
                          type="email"
                          value={fromEmail}
                          onChange={(e) => setFromEmail(e.target.value)}
                          placeholder="voicemail@mycompany.com"
                          required
                        />
                      </FormField>

                      <FormField label="Sender Display Name">
                        <Input
                          type="text"
                          value={fromName}
                          onChange={(e) => setFromName(e.target.value)}
                          placeholder="e.g. Acme PBX Voicemail"
                        />
                      </FormField>
                    </Grid>
                  </Stack>
                </Card>
              </div>

              {/* Right Column (4 Cols): Live Test & Quick Help */}
              <div className="lg:col-span-4 space-y-6">
                <Card>
                  <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
                    <Send size={16} className="text-[var(--pbx-action-primary)]" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">Live Delivery Test</h3>
                  </div>

                  <p className="text-xs text-slate-500 mb-4">
                    Dispatch an immediate test email to verify host connectivity, TLS negotiation, and credentials before saving.
                  </p>

                  <Stack gap="4">
                    <FormField label="Destination Email Address">
                      <Input
                        type="email"
                        value={testRecipient}
                        onChange={(e) => setTestRecipient(e.target.value)}
                        placeholder="recipient@example.com"
                      />
                    </FormField>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleSendTestEmail}
                      isLoading={testing}
                      className="w-full justify-center"
                    >
                      <Send size={14} /> Send Test Email
                    </Button>

                    {testResult && (
                      <Alert variant={testResult.success ? 'success' : 'danger'}>
                        <div className="font-bold">{testResult.success ? 'Verification Succeeded!' : 'Connection Error:'}</div>
                        <div className="text-xs mt-1">{testResult.success ? testResult.message : testResult.error}</div>
                      </Alert>
                    )}
                  </Stack>
                </Card>

                <Card className="bg-slate-50">
                  <div className="font-bold text-xs text-slate-900 mb-2 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[var(--pbx-action-primary)]" />
                    Voicemail Audio Attachments
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    When an extension receives a voicemail, the FreeSWITCH engine automatically converts the recording to standard WAV format and delivers it with transcript metadata to the extension's notification email address.
                  </p>
                </Card>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <Card>
              <Inline justify="between" align="center">
                <div className="text-xs text-slate-500">
                  {settings?.updated_at ? (
                    <span>Last updated: {new Date(settings.updated_at).toLocaleString()}</span>
                  ) : (
                    <span>Configure your SMTP settings to activate email notifications</span>
                  )}
                </div>

                <Inline gap="3">
                  <Button
                    type="button"
                    onClick={() => fetchSettings(true)}
                    isLoading={loading}
                    variant="secondary"
                  >
                    <RefreshCw size={14} /> Reload Settings
                  </Button>

                  <Button
                    type="submit"
                    isLoading={saving}
                    variant="primary"
                  >
                    <Save size={16} /> Save SMTP Settings
                  </Button>
                </Inline>
              </Inline>
            </Card>
          </Stack>
        </form>
      </Stack>
    </PageContainer>
  );
};
