import { logger } from '../../lib/logger';
import React, { useState, useEffect } from 'react';
import { Key, Copy, CheckCircle, AlertCircle, RefreshCw, Lock, Globe, FileText, Plus } from 'lucide-react';

interface ApiKey {
  key: string;
  name: string;
  createdAt: string;
  isActive: boolean;
}

export default function APISettings() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = window.location.origin;

  const fetchKeys = async () => {
    try {
      const response = await fetch('/api/v1/api-keys');
      const data = await response.json();
      if (data.success) {
        setApiKeys(data.data);
      }
    } catch (err) {
      logger.error('Failed to fetch API keys:', err);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) {
      setError('Please enter a name for the API key');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/api-keys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() })
      });
      const data = await response.json();
      if (data.success) {
        setGeneratedKey(data.data.key);
        setApiKeys([...apiKeys, data.data]);
        setNewKeyName('');
        // Auto‑dismiss after 10 seconds
        setTimeout(() => setGeneratedKey(null), 10000);
      } else {
        setError(data.error || 'Failed to generate key');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleRevokeKey = async (key: string) => {
    if (!confirm(`Are you sure you want to revoke this API key?`)) return;
    try {
      const response = await fetch(`/api/v1/api-keys/${key}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setApiKeys(apiKeys.filter(k => k.key !== key));
      } else {
        alert(data.error || 'Failed to revoke key');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl">
            <Globe className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">API Gateway</h3>
            <p className="text-[11px] text-slate-400">Manage API keys and view API documentation.</p>
          </div>
        </div>
      </div>

      {/* API Base URL */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        <p className="text-xs font-bold text-slate-500">API Base URL</p>
        <p className="text-sm font-mono text-indigo-600 mt-0.5">{baseUrl}/api/v1</p>
        <p className="text-[10px] text-slate-400 mt-1">Include your API key in the <code className="bg-slate-100 px-1 rounded">X-API-Key</code> header.</p>
      </div>

      {/* Generate Key */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        <h4 className="font-bold text-slate-700 text-sm mb-3">Generate New API Key</h4>
        {error && (
          <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 mb-3">
            {error}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="e.g., Production Server"
            className="flex-1 p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            onClick={handleGenerateKey}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
          >
            {isLoading ? 'Generating...' : <><Key className="w-4 h-4" /> Generate</>}
          </button>
        </div>

        {generatedKey && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <p className="text-xs font-bold text-emerald-800">✅ API Key Generated</p>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-sm font-mono bg-white px-3 py-1 rounded-lg border border-emerald-100 flex-1 overflow-x-auto">
                {generatedKey}
              </code>
              <button
                onClick={() => handleCopyKey(generatedKey)}
                className="p-2 bg-white rounded-lg border border-emerald-200 hover:bg-emerald-50 transition-all"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-500" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-emerald-700 mt-2">
              ⚠️ Copy this key now. It will not be shown again.
            </p>
          </div>
        )}
      </div>

      {/* Existing Keys */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        <h4 className="font-bold text-slate-700 text-sm mb-3">Active API Keys</h4>
        {apiKeys.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No API keys generated yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">API Key</th>
                  <th className="px-3 py-2 text-left">Created</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apiKeys.map((key) => (
                  <tr key={key.key} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-700">{key.name}</td>
                    <td className="px-3 py-2 font-mono text-slate-500">{key.key.slice(0, 12)}…</td>
                    <td className="px-3 py-2 text-slate-500">{new Date(key.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                        key.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {key.isActive ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => handleCopyKey(key.key)}
                        className="text-indigo-600 hover:text-indigo-800 mr-2"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {key.isActive && (
                        <button
                          onClick={() => handleRevokeKey(key.key)}
                          className="text-rose-600 hover:text-rose-800"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Documentation Link */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
        <a
          href="/api/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <FileText className="w-4 h-4" />
          View API Documentation (Swagger)
        </a>
        <p className="text-[10px] text-slate-400 mt-0.5">
          Interactive OpenAPI docs – test endpoints directly with your API key.
        </p>
      </div>
    </div>
  );
}
