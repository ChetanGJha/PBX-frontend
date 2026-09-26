import React, { useState } from 'react';
import { Terminal, Send, Copy, Check, FileCode, Cpu } from 'lucide-react';
import { apiService } from '../services/api';

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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Terminal className="w-6 h-6 text-emerald-400" />
          <span>FreeSWITCH mod_xml_curl Directory Console</span>
        </h2>
        <p className="text-xs text-slate-400">
          Simulate FreeSWITCH HTTP POST requests (`POST /freeswitch/xml`) to inspect dynamic XML directory responses and multi-tenant context variables.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request Form */}
        <div className="glass-card p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Simulate FreeSWITCH Event Request</span>
          </div>

          <form onSubmit={handleTest} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Section</label>
              <input type="text" value="directory" disabled className="input-field opacity-60 font-mono" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">SIP Domain (`domain` / `key_value`)</label>
              <input
                type="text"
                placeholder="acme.local"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="input-field font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">SIP User / Extension (`user`)</label>
              <input
                type="text"
                placeholder="1001"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="input-field font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-600/30"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Fetching XML...' : 'Execute mod_xml_curl Lookup'}</span>
            </button>
          </form>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300">FreeSWITCH Request Format:</div>
            <div className="font-mono text-cyan-300">POST /freeswitch/xml</div>
            <div className="font-mono text-slate-400">Content-Type: application/x-www-form-urlencoded</div>
            <div className="font-mono text-slate-400">section=directory&domain={domain}&user={user}</div>
          </div>
        </div>

        {/* XML Output Console */}
        <div className="lg:col-span-2 glass-card p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span>Generated FreeSWITCH XML Response</span>
              </div>
              {xmlResult && (
                <button
                  onClick={handleCopy}
                  className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy XML'}</span>
                </button>
              )}
            </div>

            {xmlResult ? (
              <pre className="code-block text-xs max-h-[420px] overflow-y-auto whitespace-pre-wrap text-emerald-300 font-mono">
                {xmlResult}
              </pre>
            ) : (
              <div className="h-[320px] border border-dashed border-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-500 text-xs">
                <FileCode className="w-8 h-8 mb-2 opacity-40" />
                <span>Click "Execute mod_xml_curl Lookup" to test dynamic XML generation.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
