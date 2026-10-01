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
    <div className="relative bg-slate-900 rounded-lg p-3 my-2 text-white">
      <Button
        variant="ghost"
        size="sm"
        onClick={copy}
        className="absolute top-2 right-2 text-xs py-1 px-2 text-slate-300 hover:text-white"
      >
        {copied ? <><CheckCircle size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
      </Button>
      <pre className="m-0 text-slate-200 text-xs font-mono whitespace-pre-wrap break-all leading-relaxed">{code}</pre>
    </div>
  );
};

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card padding="none" className="mb-3 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-4 bg-transparent border-0 cursor-pointer flex items-center justify-between gap-3"
      >
        <Inline gap="3" align="center">
          <span className="text-[var(--pbx-accent-primary)]">{icon}</span>
          <span className="font-bold text-sm text-[var(--pbx-text-primary)]">{title}</span>
        </Inline>
        {open ? <ChevronDown size={16} className="text-[var(--pbx-text-muted)]" /> : <ChevronRight size={16} className="text-[var(--pbx-text-muted)]" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-[var(--pbx-border)] pt-3">
          {children}
        </div>
      )}
    </Card>
  );
};

const Step: React.FC<{ n: number; title: string; children?: React.ReactNode }> = ({ n, title, children }) => (
  <Inline gap="3" align="flex-start" className="mt-3">
    <div className="w-7 h-7 rounded-full bg-[var(--pbx-accent-primary)] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
      {n}
    </div>
    <div className="flex-1">
      <div className="font-bold text-xs text-[var(--pbx-text-primary)] mb-1">{title}</div>
      <div className="text-xs text-[var(--pbx-text-secondary)] leading-relaxed">{children}</div>
    </div>
  </Inline>
);

const Field: React.FC<{ label: string; value: string; note?: string }> = ({ label, value, note }) => (
  <Inline gap="3" align="flex-start" className="py-2 border-b border-[var(--pbx-border)]">
    <div className="w-40 text-xs font-bold text-[var(--pbx-text-muted)] uppercase tracking-wider pt-0.5">{label}</div>
    <div className="flex-1">
      <code className="code-box">{value}</code>
      {note && <div className="text-[11px] text-[var(--pbx-text-muted)] mt-1">{note}</div>}
    </div>
  </Inline>
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
        <Alert variant="info">
          <div className="font-bold mb-1">Your SIP Server Details</div>
          <Grid cols={2} gap="2" className="text-xs">
            <span>SIP Domain: <strong>{sipDomain}</strong></span>
            <span>Server IP: <strong>{serverIP}</strong></span>
            <span>SIP Port: <strong>5060 (UDP/TCP)</strong></span>
            <span>TLS Port: <strong>5061</strong></span>
          </Grid>
        </Alert>

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
              <strong>Zoiper 5</strong> is recommended — free for basic SIP calls, available for Windows, Mac, iOS, and Android.
              <a href="https://www.zoiper.com/en/voip-softphone/download/current" target="_blank" rel="noreferrer" className="ml-2 font-bold underline inline-flex items-center gap-1">
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
              <strong>X-Lite</strong> (free) and <strong>Bria</strong> (paid) are both from CounterPath.
              <a href="https://www.counterpath.com/x-lite/" target="_blank" rel="noreferrer" className="ml-2 font-bold underline inline-flex items-center gap-1">
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
              <strong>Linphone</strong> is a free, open-source softphone for desktop and mobile.
              <a href="https://www.linphone.org/technical-corner/linphone" target="_blank" rel="noreferrer" className="ml-2 font-bold underline inline-flex items-center gap-1">
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
              <Grid cols={2} gap="3" className="mt-3">
                {[
                  { cmd: 'status', desc: 'Check FS uptime and sessions' },
                  { cmd: 'show registrations', desc: 'List all registered SIP phones' },
                  { cmd: 'show channels', desc: 'Show active calls' },
                  { cmd: 'sofia status', desc: 'SIP gateway/profile status' },
                  { cmd: 'reloadxml', desc: 'Reload dialplan XML config' },
                ].map(({ cmd, desc }) => (
                  <Card key={cmd} padding="sm" className="bg-[var(--pbx-bg-subtle)]">
                    <code className="text-xs font-mono font-bold text-[var(--pbx-accent-primary)] block mb-1">{cmd}</code>
                    <div className="text-xs text-[var(--pbx-text-muted)]">{desc}</div>
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
                <Stack gap="2" className="mt-2">
                  {solutions.map((s, i) => (
                    <Inline key={i} gap="2" align="center" className="text-xs text-[var(--pbx-text-secondary)]">
                      <span className="text-[var(--pbx-accent-primary)] font-bold">&rarr;</span>
                      <span>{s}</span>
                    </Inline>
                  ))}
                </Stack>
              </Section>
            ))}
          </Stack>
        )}

        {/* Quick Reference */}
        <Card className="bg-slate-900 text-white border-slate-800">
          <Stack gap="4">
            <Inline gap="2" align="center">
              <BookOpen size={16} className="text-sky-400" />
              <span className="font-bold text-sm text-slate-100">Quick SIP Credentials Reference</span>
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
                <Card key={k} padding="sm" className="bg-slate-800 border-slate-700">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{k}</div>
                  <div className="text-xs font-mono font-semibold text-slate-100">{v}</div>
                </Card>
              ))}
            </Grid>
          </Stack>
        </Card>
      </Stack>
    </PageContainer>
  );
};
