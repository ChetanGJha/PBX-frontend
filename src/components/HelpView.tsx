import React, { useState } from 'react';
import {
  HelpCircle, Smartphone, Monitor, ChevronRight, ChevronDown, Copy, CheckCircle,
  PhoneCall, Wifi, Settings, BookOpen, ExternalLink, AlertTriangle, Info
} from 'lucide-react';

interface HelpViewProps {
  user?: any;
  token?: string;
}

const CodeBlock: React.FC<{ code: string; lang?: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ position: 'relative', background: '#0F172A', borderRadius: '8px', padding: '14px 16px', marginTop: '8px', marginBottom: '8px' }}>
      <button
        onClick={copy}
        style={{ position: 'absolute', top: '8px', right: '8px', background: copied ? '#16A34A' : '#334155', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#FFF', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
      >
        {copied ? <><CheckCircle size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
      </button>
      <pre style={{ margin: 0, color: '#E2E8F0', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.6 }}>{code}</pre>
    </div>
  );
};

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '12px', marginBottom: '12px', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', textAlign: 'left', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#FF5722' }}>{icon}</span>
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>{title}</span>
        </div>
        {open ? <ChevronDown size={16} style={{ color: '#64748B' }} /> : <ChevronRight size={16} style={{ color: '#64748B' }} />}
      </button>
      {open && (
        <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid #F1F5F9' }}>
          {children}
        </div>
      )}
    </div>
  );
};

const Step: React.FC<{ n: number; title: string; children?: React.ReactNode }> = ({ n, title, children }) => (
  <div style={{ display: 'flex', gap: '14px', marginTop: '16px' }}>
    <div style={{ background: '#FF5722', color: '#FFF', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>{n}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A', marginBottom: '6px' }}>{title}</div>
      <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>{children}</div>
    </div>
  </div>
);

const Field: React.FC<{ label: string; value: string; note?: string }> = ({ label, value, note }) => (
  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
    <div style={{ minWidth: '160px', fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', paddingTop: '2px' }}>{label}</div>
    <div style={{ flex: 1 }}>
      <code style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '5px', padding: '2px 8px', fontSize: '12px', color: '#1E293B', fontFamily: 'JetBrains Mono, monospace' }}>{value}</code>
      {note && <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px' }}>{note}</div>}
    </div>
  </div>
);

export const HelpView: React.FC<HelpViewProps> = ({ user }) => {
  const sipDomain = user?.sip_domain || 'sip.yourpbx.com';
  const serverIP = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;

  const tabs = ['Zoiper 5', 'X-Lite / Bria', 'Linphone', 'FreeSWITCH Test', 'Troubleshooting'];
  const [activeTab, setActiveTab] = useState('Zoiper 5');

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <HelpCircle style={{ color: '#FF5722' }} size={28} /> Help & Configuration Guide
        </h1>
        <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
          Step-by-step softphone configuration, call testing, and FreeSWITCH troubleshooting.
        </p>
      </div>

      {/* Info Banner */}
      <div style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <Info size={20} style={{ color: '#2563EB', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: '13px', color: '#1E3A8A', marginBottom: '4px' }}>Your SIP Server Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', fontSize: '13px', color: '#1E40AF' }}>
            <span>🌐 SIP Domain: <strong>{sipDomain}</strong></span>
            <span>🖥️ Server IP: <strong>{serverIP}</strong></span>
            <span>🔒 SIP Port: <strong>5060 (UDP/TCP)</strong></span>
            <span>🔐 TLS Port: <strong>5061</strong></span>
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '2px solid #E2E8F0', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? 700 : 500,
              fontSize: '13px',
              color: activeTab === tab ? '#FF5722' : '#64748B',
              borderBottom: `2px solid ${activeTab === tab ? '#FF5722' : 'transparent'}`,
              marginBottom: '-2px',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {tab === 'Zoiper 5' && <Smartphone size={14} />}
            {tab === 'X-Lite / Bria' && <Monitor size={14} />}
            {tab === 'Linphone' && <PhoneCall size={14} />}
            {tab === 'FreeSWITCH Test' && <Wifi size={14} />}
            {tab === 'Troubleshooting' && <AlertTriangle size={14} />}
            {tab}
          </button>
        ))}
      </div>

      {/* Zoiper 5 */}
      {activeTab === 'Zoiper 5' && (
        <div>
          <div style={{ background: '#FFF3E0', border: '1px solid #FFCC80', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#E65100' }}>
            <strong>Zoiper 5</strong> is recommended — free for basic SIP calls, available for Windows, Mac, iOS, and Android.
            <a href="https://www.zoiper.com/en/voip-softphone/download/current" target="_blank" rel="noreferrer" style={{ marginLeft: '8px', color: '#E65100', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Download Zoiper 5 <ExternalLink size={12} />
            </a>
          </div>

          <Section title="Step 1 – Create an Extension" icon={<Settings size={18} />} defaultOpen>
            <Step n={1} title="Log in as Super Admin or Tenant Admin">
              Navigate to <strong>Extensions</strong> in the sidebar and click <strong>+ Add Extension</strong>.
            </Step>
            <Step n={2} title="Fill in extension details">
              Use any 4-digit number (e.g. <code>1001</code>), set a display name, and copy the SIP password — you'll need it for Zoiper.
            </Step>
            <Step n={3} title="Note your credentials">
              <Field label="Extension" value="1001 (example)" />
              <Field label="SIP Password" value="The password you set during extension creation" />
              <Field label="SIP Domain / Server" value={sipDomain} />
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
              <Field label="Caller ID" value="1001" />
            </Step>
            <Step n={3} title="Advanced Transport Settings (if needed)">
              Go to <strong>Settings → Advanced → Network</strong>:
              <Field label="Transport" value="UDP (default), or TCP" />
              <Field label="SIP Port" value="5060" />
              <Field label="STUN" value="Disable for LAN, enable for WAN/internet" />
            </Step>
            <Step n={4} title="Save and Register">
              Click <strong>Register</strong>. You should see a green ✅ <strong>Online</strong> status next to the account.
            </Step>
          </Section>

          <Section title="Step 3 – Configure Zoiper 5 (Mobile: iOS/Android)" icon={<Smartphone size={18} />}>
            <Step n={1} title="Install Zoiper 5 from App Store / Play Store" />
            <Step n={2} title="Open → Tap the + button → SIP">
              Enter your extension number in the username field.
            </Step>
            <Step n={3} title="Fill in credentials">
              <Field label="Username" value="1001" />
              <Field label="Password" value="(your SIP password)" />
              <Field label="Domain" value={sipDomain} />
            </Step>
            <Step n={4} title="Save and wait for green indicator">
              Ensure your phone is on WiFi or mobile data that can reach the PBX server.
            </Step>
          </Section>
        </div>
      )}

      {/* X-Lite / Bria */}
      {activeTab === 'X-Lite / Bria' && (
        <div>
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#15803D' }}>
            <strong>X-Lite</strong> (free) and <strong>Bria</strong> (paid, feature-rich) are both from CounterPath.
            <a href="https://www.counterpath.com/x-lite/" target="_blank" rel="noreferrer" style={{ marginLeft: '8px', color: '#15803D', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Download X-Lite <ExternalLink size={12} />
            </a>
          </div>

          <Section title="X-Lite / Bria SIP Account Setup" icon={<Monitor size={18} />} defaultOpen>
            <Step n={1} title="Open X-Lite → Menu → SIP Account Settings → Add">
              A new account dialog will open.
            </Step>
            <Step n={2} title="Account settings tab">
              <Field label="Display Name" value="John Doe (extension user)" />
              <Field label="User Name" value="1001" note="Your extension number" />
              <Field label="Password" value="(your SIP password)" />
              <Field label="Authorization Name" value="1001" note="Same as username" />
              <Field label="Domain" value={sipDomain} />
            </Step>
            <Step n={3} title="Transport tab">
              <Field label="Protocol" value="UDP or TCP" />
              <Field label="Outbound Proxy" value={sipDomain} note="Optional — use if behind NAT" />
              <Field label="STUN Server" value="stun.l.google.com:19302" note="For NAT traversal" />
            </Step>
            <Step n={4} title="OK → Account should show READY status" />
          </Section>
        </div>
      )}

      {/* Linphone */}
      {activeTab === 'Linphone' && (
        <div>
          <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#5B21B6' }}>
            <strong>Linphone</strong> is a free, open-source softphone for desktop and mobile.
            <a href="https://www.linphone.org/technical-corner/linphone" target="_blank" rel="noreferrer" style={{ marginLeft: '8px', color: '#5B21B6', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Download Linphone <ExternalLink size={12} />
            </a>
          </div>

          <Section title="Linphone SIP Account Setup" icon={<PhoneCall size={18} />} defaultOpen>
            <Step n={1} title="Open Linphone → Preferences → SIP Accounts → Add">
              Choose <strong>Use existing SIP account</strong>.
            </Step>
            <Step n={2} title="Account details">
              <Field label="Your SIP Identity" value={`sip:1001@${sipDomain}`} note="Format: sip:extension@domain" />
              <Field label="SIP Proxy" value={`sip:${sipDomain}`} />
              <Field label="Route" value={sipDomain} />
              <Field label="Password" value="(your SIP password)" />
            </Step>
            <Step n={3} title="Apply and check status indicator in top bar" />
          </Section>
        </div>
      )}

      {/* FreeSWITCH Test Procedure */}
      {activeTab === 'FreeSWITCH Test' && (
        <div>
          <Section title="Full End-to-End Call Test Procedure" icon={<Wifi size={18} />} defaultOpen>
            <Step n={1} title="Verify FreeSWITCH is running">
              In the FreeSWITCH Console section of this portal, run:
              <CodeBlock code="status" />
              You should see uptime info and the number of sessions.
            </Step>
            <Step n={2} title="Verify extension is provisioned in FreeSWITCH directory">
              Run this in the console or via the XML Curl Tester:
              <CodeBlock code="xml_locate directory domain name=YOUR_SIP_DOMAIN user id=1001" />
              You should get an XML response containing the user's password hash.
            </Step>
            <Step n={3} title="Register Zoiper on Extension 1001">
              Configure Zoiper for ext 1001 (see Zoiper tab). Verify green status.
            </Step>
            <Step n={4} title="Register a Second Softphone on Extension 1002">
              Create extension 1002 in the portal. Configure a second Zoiper instance or use a different device.
            </Step>
            <Step n={5} title="Make an Internal Extension Call">
              From Zoiper on 1001, dial <code>1002</code> — the second phone should ring. Answer and verify two-way audio.
            </Step>
            <Step n={6} title="Test IVR / DID Routing">
              Assign a DID to your IVR. Call the DID from an external phone. You should hear the greeting audio and be able to press keys for routing.
            </Step>
            <Step n={7} title="Check CDR in Reports">
              Navigate to <strong>Reports</strong> → <strong>CDR Report</strong> after making calls. You should see call records with duration, caller ID, and status.
            </Step>
          </Section>

          <Section title="FreeSWITCH Console Commands Reference" icon={<Settings size={18} />}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              {[
                { cmd: 'status', desc: 'Check FS uptime and sessions' },
                { cmd: 'show registrations', desc: 'List all registered SIP phones' },
                { cmd: 'show channels', desc: 'Show active calls' },
                { cmd: 'sofia status', desc: 'SIP gateway/profile status' },
                { cmd: 'sofia status profile internal', desc: 'Internal SIP profile details' },
                { cmd: 'sofia status gateway GATEWAY_NAME', desc: 'SIP trunk gateway status' },
                { cmd: 'originate sofia/internal/1001@DOMAIN &bridge(sofia/internal/1002@DOMAIN)', desc: 'Test call between extensions' },
                { cmd: 'reloadxml', desc: 'Reload dialplan XML config' },
                { cmd: 'fsctl loglevel debug', desc: 'Enable verbose logging' },
                { cmd: 'event plain all', desc: 'Stream all FS events' },
              ].map(({ cmd, desc }) => (
                <div key={cmd} style={{ background: '#F8FAFC', borderRadius: '8px', padding: '10px 12px', border: '1px solid #E2E8F0' }}>
                  <code style={{ fontSize: '11px', color: '#FF5722', fontFamily: 'JetBrains Mono, monospace', display: 'block', marginBottom: '4px' }}>{cmd}</code>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>{desc}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="SIP Registration Troubleshooting via Console" icon={<AlertTriangle size={18} />}>
            <Step n={1} title="Enable SIP packet tracing">
              <CodeBlock code={`sofia profile internal siptrace on`} />
            </Step>
            <Step n={2} title="Watch for REGISTER packets">
              The console will show incoming REGISTER requests and responses. Look for <code>401 Unauthorized</code> (wrong password) or <code>200 OK</code> (success).
            </Step>
            <Step n={3} title="Verify mod_xml_curl is returning correct directory XML">
              The mod_xml_curl endpoint is: <code>{serverIP}:8000/freeswitch/xml</code>. Use the XML Curl Tester to verify your extension resolves correctly.
            </Step>
          </Section>
        </div>
      )}

      {/* Troubleshooting */}
      {activeTab === 'Troubleshooting' && (
        <div>
          {[
            {
              problem: 'Softphone shows "Registration Failed" or "Timeout"',
              solutions: [
                'Check that FreeSWITCH is running and port 5060 (UDP) is accessible from your machine.',
                'Try TCP transport instead of UDP in softphone settings.',
                'Verify the SIP domain matches your tenant\'s SIP domain in the portal.',
                'If behind a NAT/firewall, ensure ports 5060 (SIP) and 10000–20000 (RTP audio) are open.',
              ]
            },
            {
              problem: 'Registered but calls fail (no audio / call drops)',
              solutions: [
                'RTP media ports (10000–20000 UDP) may be blocked by firewall.',
                'Enable STUN/ICE in the softphone if you are outside the LAN.',
                'Check FS console "show channels" to see if call legs are being created.',
                'Run "sofia status profile internal" and verify the IP address shown is reachable.',
              ]
            },
            {
              problem: 'Extension not found (404 from FS)',
              solutions: [
                'Verify the extension was saved in the portal (check Extensions list).',
                'Use the XML Curl Tester to check that mod_xml_curl returns a valid directory XML for the extension.',
                'Run "reloadxml" in FS console after any changes.',
                'Ensure the tenant SIP domain in the portal matches what FS uses.',
              ]
            },
            {
              problem: '"403 Forbidden" on SIP REGISTER',
              solutions: [
                'The SIP password entered in the softphone does not match what\'s in the database.',
                'Use the Reset Password feature in Extensions to set a new SIP password and re-enter it in the softphone.',
              ]
            },
            {
              problem: 'IVR / DID not routing calls correctly',
              solutions: [
                'Verify the DID is assigned to the IVR menu in the DIDs section.',
                'Check that the IVR has a greeting audio file set.',
                'Ensure DTMF nodes are configured for the desired keys.',
                'Check call routing table under Call Routing section.',
              ]
            },
          ].map(({ problem, solutions }) => (
            <Section key={problem} title={problem} icon={<AlertTriangle size={16} />}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {solutions.map((s, i) => (
                  <li key={i} style={{ display: 'flex', gap: '10px', padding: '8px 0', borderBottom: '1px solid #F1F5F9', fontSize: '13px', color: '#374151' }}>
                    <span style={{ color: '#FF5722', flexShrink: 0 }}>→</span>
                    {s}
                  </li>
                ))}
              </ul>
            </Section>
          ))}

          <Section title="Network Requirements" icon={<Wifi size={18} />}>
            <div style={{ marginTop: '12px' }}>
              {[
                { port: '5060 UDP/TCP', desc: 'SIP signaling — MUST be open inbound/outbound' },
                { port: '5061 TCP', desc: 'SIP TLS signaling (encrypted)' },
                { port: '10000-20000 UDP', desc: 'RTP audio media — MUST be open for audio to work' },
                { port: '8000 TCP', desc: 'PBX Management API (internal use)' },
                { port: '7443 TCP', desc: 'FreeSWITCH ESL (Event Socket Layer)' },
              ].map(({ port, desc }) => (
                <div key={port} style={{ display: 'flex', gap: '16px', padding: '10px 0', borderBottom: '1px solid #F1F5F9', alignItems: 'center' }}>
                  <code style={{ minWidth: '160px', background: '#FFF3E0', color: '#E65100', borderRadius: '5px', padding: '3px 8px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}>{port}</code>
                  <span style={{ fontSize: '13px', color: '#374151' }}>{desc}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* Quick Reference Card */}
      <div style={{ background: '#0F172A', borderRadius: '12px', padding: '20px 24px', marginTop: '24px' }}>
        <div style={{ fontWeight: 700, fontSize: '14px', color: '#E2E8F0', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={16} style={{ color: '#38BDF8' }} /> Quick SIP Credentials Reference
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {[
            ['SIP Server / Domain', sipDomain],
            ['SIP Port (UDP)', '5060'],
            ['SIP TLS Port', '5061'],
            ['Transport Protocol', 'UDP (recommended), TCP'],
            ['Codec Priority', 'PCMA (G.711a), PCMU (G.711u), G.722'],
            ['DTMF Mode', 'RFC 2833 (out-of-band)'],
            ['NAT Traversal', 'Enable STUN if behind NAT/router'],
            ['Registration Expiry', '300 seconds (5 minutes)'],
          ].map(([k, v]) => (
            <div key={k} style={{ background: '#1E293B', borderRadius: '8px', padding: '10px 14px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{k}</div>
              <div style={{ fontSize: '13px', color: '#F1F5F9', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
