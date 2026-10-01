import React, { useState } from 'react';
import { Send, Copy, Check, FileCode, Cpu } from 'lucide-react';
import { apiService } from '../services/api';
import { PageContainer } from './layout/PageContainer';
import { Stack, Grid } from './layout/Stack';
import { Button, Card, Input, FormField } from './ui';

export const XmlCurlTester: React.FC = () => {
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
      title="FreeSWITCH mod_xml_curl Directory Console"
      subtitle="Simulate FreeSWITCH HTTP POST requests (`POST /freeswitch/xml`) to inspect dynamic XML directory responses and multi-tenant context variables."
      eyebrow="Telephony Engine Debugger"
    >
      <Grid cols={3} gap="6">
        {/* Request Form */}
        <Card title="Simulate FreeSWITCH Event Request">
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

              <Card padding="sm" className="bg-[var(--pbx-bg-subtle)]">
                <Stack gap="1" className="font-mono text-xs">
                  <div className="font-bold text-[var(--pbx-text-primary)] font-sans">FreeSWITCH Request Format:</div>
                  <div className="text-[var(--pbx-accent-primary)] font-bold">POST /freeswitch/xml</div>
                  <div className="text-[var(--pbx-text-muted)]">Content-Type: application/x-www-form-urlencoded</div>
                  <code className="code-box break-all">section=directory&domain={domain}&user={user}</code>
                </Stack>
              </Card>
            </Stack>
          </form>
        </Card>

        {/* XML Output Console */}
        <div className="col-span-2">
          <Card
            title="Generated FreeSWITCH XML Response"
            actions={
              xmlResult ? (
                <Button variant="ghost" size="sm" onClick={handleCopy} leftIcon={copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}>
                  {copied ? 'Copied' : 'Copy XML'}
                </Button>
              ) : undefined
            }
          >
            {xmlResult ? (
              <pre className="max-h-[420px] overflow-y-auto whitespace-pre-wrap bg-slate-950 text-emerald-400 p-4 rounded-xl border border-slate-800 font-mono text-xs leading-relaxed">
                {xmlResult}
              </pre>
            ) : (
              <div className="h-[320px] border border-dashed border-[var(--pbx-border)] rounded-xl flex flex-col items-center justify-center text-[var(--pbx-text-muted)] text-xs">
                <FileCode size={32} className="mb-2 opacity-40 text-[var(--pbx-accent-primary)]" />
                <span>Click "Execute mod_xml_curl Lookup" to test dynamic XML generation.</span>
              </div>
            )}
          </Card>
        </div>
      </Grid>
    </PageContainer>
  );
};
