import React, { useState } from 'react';
import { Send, Copy, Check, FileCode, Cpu } from 'lucide-react';

import { apiService } from '../services/api';

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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <div className="eyebrow">Telephony Engine API</div>
          <h1 className="page-title">FreeSWITCH mod_xml_curl Console</h1>
          <p className="page-sub">Test live HTTP POST requests (`/freeswitch/xml`) sent dynamically by FreeSWITCH during registration and call routing.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request Form */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Cpu className="w-4 h-4 text-[#FF5430]" />
            <span>Simulate FreeSWITCH Request</span>
          </div>

          <form onSubmit={handleTest} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Section</label>
              <input type="text" value="directory" disabled className="form-control bg-slate-50 font-mono text-slate-500" />
            </div>

            <div className="form-group">
              <label className="form-label">SIP Domain (`domain` / `key_value`)</label>
              <input
                type="text"
                placeholder="acme.local"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="form-control font-mono"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">SIP User / Extension (`user`)</label>
              <input
                type="text"
                placeholder="1001"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="form-control font-mono"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              <Send className="w-4 h-4" />
              <span>{loading ? 'Fetching XML...' : 'Execute mod_xml_curl Lookup'}</span>
            </button>
          </form>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5 font-mono">
            <div className="font-bold text-slate-800 font-sans">FreeSWITCH Request Signature:</div>
            <div className="text-[#FF5430] font-bold">POST /freeswitch/xml</div>
            <div className="text-slate-500">Content-Type: application/x-www-form-urlencoded</div>
            <div className="text-slate-700 bg-white p-2 rounded border border-slate-200 break-all">section=directory&domain={domain}&user={user}</div>
          </div>
        </div>

        {/* XML Output Console */}
        <div className="lg:col-span-2 card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <FileCode className="w-4 h-4 text-[#FF5430]" />
                <span>Generated Dynamic FreeSWITCH XML Output</span>
              </div>
              {xmlResult && (
                <button
                  onClick={handleCopy}
                  className="text-xs text-slate-500 hover:text-[#FF5430] flex items-center gap-1 transition-colors border-0 bg-transparent cursor-pointer font-semibold"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied XML' : 'Copy XML'}</span>
                </button>
              )}
            </div>

            {xmlResult ? (
              <pre className="code-box max-h-[420px] overflow-y-auto whitespace-pre-wrap bg-slate-950 text-emerald-400 p-4 rounded-xl border border-slate-800 font-mono text-xs leading-relaxed">
                {xmlResult}
              </pre>
            ) : (
              <div className="h-[340px] border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs">
                <FileCode className="w-10 h-10 mb-2 opacity-30 text-[#FF5430]" />
                <span>Click "Execute mod_xml_curl Lookup" to inspect dynamic FreeSWITCH XML generation.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
