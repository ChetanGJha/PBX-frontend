import React, { useState } from 'react';
import { Send, Copy, Check, FileCode } from 'lucide-react';
import { apiService } from '../services/api';
import { PageContainer } from './layout/PageContainer';
import { Stack, Grid } from './layout/Stack';
import { Button, Card, Input, FormField } from './ui';

export const XmlCurlConsole: React.FC = () => {
  const [domain, setDomain] = useState('acme.local');
  const [user, setUser] = useState('1001');
  const [xmlResult, setXmlResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setXmlResult(null);
    try {
      const xml = await apiService.testXmlCurl(domain, user);
      setXmlResult(xml);
    } catch (err: any) {
      setXmlResult(`<!-- Error connecting to XML-CURL Endpoint: ${err.message} -->`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (xmlResult) {
      navigator.clipboard.writeText(xmlResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <PageContainer
      title="FreeSWITCH mod_xml_curl Console"
      subtitle="Test live HTTP POST requests (`/freeswitch/xml`) sent dynamically by FreeSWITCH during registration and call routing."
      eyebrow="Telephony Engine API"
    >
      <Grid cols={3} gap="6">
        {/* Request Form */}
        <Card title="Simulate FreeSWITCH Request">
          <form onSubmit={handleTest}>
            <Stack gap="4">
              <FormField label="Section">
                <Input value="directory" disabled className="bg-slate-50 font-mono" />
              </FormField>

              <FormField label="SIP Domain (`domain` / `key_value`)" required>
                <Input
                  required
                  placeholder="acme.local"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="font-mono"
                />
              </FormField>

              <FormField label="SIP User / Extension (`user`)" required>
                <Input
                  required
                  placeholder="1001"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  className="font-mono"
                />
              </FormField>

              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
                leftIcon={<Send size={14} />}
                className="w-full justify-center"
              >
                Execute mod_xml_curl Lookup
              </Button>

              <Card padding="sm" style={{ backgroundColor: 'var(--pbx-bg-subtle)' }}>
                <Stack gap="1" style={{ fontFamily: 'var(--pbx-font-mono)', fontSize: '12px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--pbx-text-primary)', fontFamily: 'var(--pbx-font-sans)' }}>FreeSWITCH Request Signature:</div>
                  <div style={{ color: 'var(--pbx-action-primary)', fontWeight: 700 }}>POST /freeswitch/xml</div>
                  <div style={{ color: 'var(--pbx-text-muted)' }}>Content-Type: application/x-www-form-urlencoded</div>
                  <code className="code-box break-all">section=directory&domain={domain}&user={user}</code>
                </Stack>
              </Card>
            </Stack>
          </form>
        </Card>

        {/* XML Output Console */}
        <div style={{ gridColumn: 'span 2' }}>
          <Card
            title="Generated Dynamic FreeSWITCH XML Output"
            actions={
              xmlResult ? (
                <Button variant="ghost" size="sm" onClick={handleCopy} leftIcon={copied ? <Check size={14} style={{ color: '#059669' }} /> : <Copy size={14} />}>
                  {copied ? 'Copied XML' : 'Copy XML'}
                </Button>
              ) : undefined
            }
          >
            {xmlResult ? (
              <pre style={{ maxHeight: '420px', overflowY: 'auto', whiteSpace: 'pre-wrap', backgroundColor: '#020617', color: '#34D399', padding: '16px', borderRadius: 'var(--pbx-radius-xl)', border: '1px solid #1E293B', fontFamily: 'var(--pbx-font-mono)', fontSize: '12px', lineHeight: 1.6 }}>
                {xmlResult}
              </pre>
            ) : (
              <div style={{ height: '340px', border: '1px dashed var(--pbx-border-default)', borderRadius: 'var(--pbx-radius-xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--pbx-text-muted)', fontSize: '12px' }}>
                <FileCode size={40} style={{ marginBottom: '8px', opacity: 0.3, color: 'var(--pbx-action-primary)' }} />
                <span>Click "Execute mod_xml_curl Lookup" to inspect dynamic FreeSWITCH XML generation.</span>
              </div>
            )}
          </Card>
        </div>
      </Grid>
    </PageContainer>
  );
};
