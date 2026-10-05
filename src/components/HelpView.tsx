import React, { useState } from 'react';
import {
  Smartphone, Monitor, ChevronRight, ChevronDown, Copy, CheckCircle,
  PhoneCall, Wifi, Settings, BookOpen, ExternalLink, AlertTriangle
} from 'lucide-react';
import { PageContainer } from './layout/PageContainer';
import { Stack, Inline, Grid } from './layout/Stack';
import { Button, Card, Alert } from './ui';

interface HelpViewProps {
  user?: any;
  token?: string;
}

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ position: 'relative', backgroundColor: 'var(--pbx-color-neutral-900)', borderRadius: 'var(--pbx-radius-lg)', padding: '14px 16px', margin: '8px 0', color: '#FFFFFF' }}>
      <Button
        variant="ghost"
        size="sm"
        onClick={copy}
        style={{ position: 'absolute', top: '10px', right: '12px', fontSize: '11px', color: 'var(--pbx-color-neutral-300)', padding: '4px 8px' }}
      >
        {copied ? <><CheckCircle size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
      </Button>
      <pre style={{ margin: 0, color: 'var(--pbx-color-neutral-200)', fontSize: '12px', fontFamily: 'var(--pbx-font-mono)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.6 }}>{code}</pre>
    </div>
  );
};

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card padding="none" style={{ marginBottom: '16px', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '16px 20px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          outline: 'none',
        }}
      >
        <Inline gap="3" align="center">
          <span style={{ color: 'var(--pbx-action-primary)', display: 'flex' }}>{icon}</span>
          <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--pbx-text-primary)' }}>{title}</span>
        </Inline>
        {open ? <ChevronDown size={16} style={{ color: 'var(--pbx-text-muted)' }} /> : <ChevronRight size={16} style={{ color: 'var(--pbx-text-muted)' }} />}
      </button>
      {open && (
        <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid var(--pbx-border-default)', paddingTop: '16px' }}>
          {children}
        </div>
      )}
    </Card>
  );
};

const Step: React.FC<{ n: number; title: string; children?: React.ReactNode }> = ({ n, title, children }) => (
  <Inline gap="3" align="flex-start" style={{ marginTop: '12px' }}>
    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--pbx-action-primary)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0, marginTop: '2px' }}>
      {n}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--pbx-text-primary)', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '12px', color: 'var(--pbx-text-secondary)', lineHeight: 1.5 }}>{children}</div>
    </div>
  </Inline>
);

const Field: React.FC<{ label: string; value: string; note?: string }> = ({ label, value, note }) => (
  <div
    style={{
      padding: '10px 0',
      borderBottom: '1px solid var(--pbx-border-default)',
      display: 'grid',
      gridTemplateColumns: '160px 1fr',
      alignItems: 'center',
      gap: '12px',
    }}
  >
    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--pbx-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {label}
    </div>
    <div>
      <code
        style={{
          fontFamily: 'var(--pbx-font-mono)',
          fontSize: '12px',
          padding: '4px 10px',
          borderRadius: 'var(--pbx-radius-md)',
          backgroundColor: 'var(--pbx-bg-subtle)',
          border: '1px solid var(--pbx-border-default)',
          color: 'var(--pbx-text-primary)',
          fontWeight: 500,
          display: 'inline-block',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </code>
      {note && <div style={{ fontSize: '11px', color: 'var(--pbx-text-muted)', marginTop: '4px' }}>{note}</div>}
    </div>
  </div>
);

export const HelpView: React.FC<HelpViewProps> = ({ user }) => {
  const sipDomain = user?.sip_domain || 'sip.yourpbx.com';
  const serverIP = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;

  const tabs = ['Zoiper 5', 'X-Lite / Bria', 'Linphone', 'FreeSWITCH Test', 'Troubleshooting'];
  const [activeTab, setActiveTab] = useState('Zoiper 5');

  return (
    <PageContainer
      title="Help & Configuration Guide"
      subtitle="Step-by-step softphone configuration, call testing, and FreeSWITCH troubleshooting."
      eyebrow="Documentation & Support"
    >
      <Stack gap="6">
        {/* Info Banner */}
        <Card padding="md" style={{ backgroundColor: 'var(--pbx-color-primary-50)', borderColor: 'var(--pbx-action-primary)' }}>
          <Stack gap="2">
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--pbx-action-primary)' }}>Your SIP Server Details</div>
            <Grid cols={2} gap="3" style={{ fontSize: '12px', color: 'var(--pbx-text-primary)' }}>
              <div>SIP Domain: <strong>{sipDomain}</strong></div>
              <div>Server IP: <strong>{serverIP}</strong></div>
              <div>SIP Port: <strong>5060 (UDP/TCP)</strong></div>
              <div>TLS Port: <strong>5061</strong></div>
            </Grid>
          </Stack>
        </Card>

        {/* Navigation Tabs */}
        <Inline gap="2">
          {tabs.map(tab => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveTab(tab)}
              leftIcon={
                tab === 'Zoiper 5' ? <Smartphone size={14} /> :
                tab === 'X-Lite / Bria' ? <Monitor size={14} /> :
                tab === 'Linphone' ? <PhoneCall size={14} /> :
                tab === 'FreeSWITCH Test' ? <Wifi size={14} /> :
                <AlertTriangle size={14} />
              }
            >
              {tab}
            </Button>
          ))}
        </Inline>

        {/* Zoiper 5 */}
        {activeTab === 'Zoiper 5' && (
          <Stack gap="4">
            <Alert variant="warning">
              <strong>Zoiper 5</strong> is recommended — free for basic SIP calls, available for Windows, Mac, iOS, and Android.{' '}
              <a href="https://www.zoiper.com/en/voip-softphone/download/current" target="_blank" rel="noreferrer" style={{ marginLeft: '8px', fontWeight: 700, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Download Zoiper 5 <ExternalLink size={12} />
              </a>
            </Alert>

            <Section title="Step 1 – Create an Extension" icon={<Settings size={18} />} defaultOpen>
              <Step n={1} title="Log in as Super Admin or Tenant Admin">
                Navigate to <strong>Extensions</strong> in the sidebar and click <strong>+ Add Extension</strong>.
              </Step>
              <Step n={2} title="Fill in extension details">
                Use any 4-digit number (e.g. <code>1001</code>), set a display name, and copy the SIP password.
              </Step>
              <Step n={3} title="Note your credentials">
                <Field label="Extension" value="1001 (example)" />
                <Field label="SIP Password" value="The password you set during creation" />
                <Field label="SIP Domain" value={sipDomain} />
              </Step>
            </Section>

            <Section title="Step 2 – Configure Zoiper 5 (Desktop)" icon={<Monitor size={18} />} defaultOpen>
              <Step n={1} title="Open Zoiper 5 → Settings → Accounts → Add Account">
                Choose <strong>SIP</strong> when prompted.
              </Step>
              <Step n={2} title="Enter account details">
                <Field label="Account Name" value="Terrix PBX" note="Any label you prefer" />
                <Field label="Domain" value={sipDomain} note="Your SIP domain" />
                <Field label="Username" value="1001" note="Your extension number" />
                <Field label="Password" value="(your SIP password)" />
              </Step>
              <Step n={3} title="Save and Register">
                Click <strong>Register</strong>. You should see a green <strong>Online</strong> status.
              </Step>
            </Section>
          </Stack>
        )}

        {/* X-Lite / Bria */}
        {activeTab === 'X-Lite / Bria' && (
          <Stack gap="4">
            <Alert variant="success">
              <strong>X-Lite</strong> (free) and <strong>Bria</strong> (paid) are both from CounterPath.{' '}
              <a href="https://www.counterpath.com/x-lite/" target="_blank" rel="noreferrer" style={{ marginLeft: '8px', fontWeight: 700, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Download X-Lite <ExternalLink size={12} />
              </a>
            </Alert>

            <Section title="X-Lite / Bria SIP Account Setup" icon={<Monitor size={18} />} defaultOpen>
              <Step n={1} title="Open X-Lite → Menu → SIP Account Settings → Add" />
              <Step n={2} title="Account settings tab">
                <Field label="User Name" value="1001" note="Your extension number" />
                <Field label="Password" value="(your SIP password)" />
                <Field label="Domain" value={sipDomain} />
              </Step>
            </Section>
          </Stack>
        )}

        {/* Linphone */}
        {activeTab === 'Linphone' && (
          <Stack gap="4">
            <Alert variant="info">
              <strong>Linphone</strong> is a free, open-source softphone for desktop and mobile.{' '}
              <a href="https://www.linphone.org/technical-corner/linphone" target="_blank" rel="noreferrer" style={{ marginLeft: '8px', fontWeight: 700, textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Download Linphone <ExternalLink size={12} />
              </a>
            </Alert>

            <Section title="Linphone SIP Account Setup" icon={<PhoneCall size={18} />} defaultOpen>
              <Step n={1} title="Open Linphone → Preferences → SIP Accounts → Add" />
              <Step n={2} title="Account details">
                <Field label="SIP Identity" value={`sip:1001@${sipDomain}`} />
                <Field label="SIP Proxy" value={`sip:${sipDomain}`} />
                <Field label="Password" value="(your SIP password)" />
              </Step>
            </Section>
          </Stack>
        )}

        {/* FreeSWITCH Test */}
        {activeTab === 'FreeSWITCH Test' && (
          <Stack gap="4">
            <Section title="Full End-to-End Call Test Procedure" icon={<Wifi size={18} />} defaultOpen>
              <Step n={1} title="Verify FreeSWITCH is running">
                In the FreeSWITCH Console section of this portal, run:
                <CodeBlock code="status" />
              </Step>
              <Step n={2} title="Verify extension is provisioned in directory">
                <CodeBlock code="xml_locate directory domain name=YOUR_SIP_DOMAIN user id=1001" />
              </Step>
            </Section>

            <Section title="FreeSWITCH Console Commands Reference" icon={<Settings size={18} />}>
              <Grid cols={2} gap="3" style={{ marginTop: '12px' }}>
                {[
                  { cmd: 'status', desc: 'Check FS uptime and sessions' },
                  { cmd: 'show registrations', desc: 'List all registered SIP phones' },
                  { cmd: 'show channels', desc: 'Show active calls' },
                  { cmd: 'sofia status', desc: 'SIP gateway/profile status' },
                  { cmd: 'reloadxml', desc: 'Reload dialplan XML config' },
                ].map(({ cmd, desc }) => (
                  <Card key={cmd} padding="sm" style={{ backgroundColor: 'var(--pbx-bg-subtle)' }}>
                    <code style={{ fontSize: '12px', fontFamily: 'var(--pbx-font-mono)', fontWeight: 700, color: 'var(--pbx-action-primary)', display: 'block', marginBottom: '4px' }}>{cmd}</code>
                    <div style={{ fontSize: '12px', color: 'var(--pbx-text-muted)' }}>{desc}</div>
                  </Card>
                ))}
              </Grid>
            </Section>
          </Stack>
        )}

        {/* Troubleshooting */}
        {activeTab === 'Troubleshooting' && (
          <Stack gap="4">
            {[
              {
                problem: 'Softphone shows "Registration Failed" or "Timeout"',
                solutions: [
                  'Check that FreeSWITCH is running and port 5060 (UDP) is accessible.',
                  'Try TCP transport instead of UDP in softphone settings.',
                  'Verify the SIP domain matches your tenant\'s SIP domain in the portal.',
                ]
              },
              {
                problem: '"403 Forbidden" on SIP REGISTER',
                solutions: [
                  'The SIP password entered in the softphone does not match what\'s in the database.',
                  'Use the Reset Password feature in Extensions to set a new SIP password.',
                ]
              },
            ].map(({ problem, solutions }) => (
              <Section key={problem} title={problem} icon={<AlertTriangle size={16} />}>
                <Stack gap="2" style={{ marginTop: '8px' }}>
                  {solutions.map((s, i) => (
                    <Inline key={i} gap="2" align="center" style={{ fontSize: '12px', color: 'var(--pbx-text-secondary)' }}>
                      <span style={{ color: 'var(--pbx-action-primary)', fontWeight: 700 }}>&rarr;</span>
                      <span>{s}</span>
                    </Inline>
                  ))}
                </Stack>
              </Section>
            ))}
          </Stack>
        )}

        {/* Quick Reference */}
        <Card padding="md" style={{ backgroundColor: 'var(--pbx-color-neutral-900)', borderColor: 'var(--pbx-color-neutral-800)', color: '#FFFFFF' }}>
          <Stack gap="4">
            <Inline gap="2" align="center">
              <BookOpen size={16} style={{ color: 'var(--pbx-action-primary)' }} />
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#FFFFFF' }}>Quick SIP Credentials Reference</span>
            </Inline>

            <Grid cols={2} gap="3">
              {[
                ['SIP Server / Domain', sipDomain],
                ['SIP Port (UDP)', '5060'],
                ['SIP TLS Port', '5061'],
                ['Transport Protocol', 'UDP, TCP'],
                ['Codec Priority', 'PCMA, PCMU, G.722'],
                ['Registration Expiry', '300 seconds'],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: '12px 14px', borderRadius: 'var(--pbx-radius-md)', backgroundColor: 'var(--pbx-color-neutral-800)', border: '1px solid var(--pbx-color-neutral-700)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--pbx-color-neutral-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>{k}</div>
                  <div style={{ fontSize: '13px', fontFamily: 'var(--pbx-font-mono)', fontWeight: 600, color: '#FFFFFF' }}>{v}</div>
                </div>
              ))}
            </Grid>
          </Stack>
        </Card>
      </Stack>
    </PageContainer>
  );
};
