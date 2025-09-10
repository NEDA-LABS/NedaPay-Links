'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { ApiKey } from '../utils/types';

type Props = {
  keys: ApiKey[];
  webhookUrl: string;
  onChangeWebhook: (v: string) => void;
  onSave: () => void;
  isSaving: boolean;
};

export default function ApiTab({ keys, webhookUrl, onChangeWebhook, onSave, isSaving }: Props) {
  const { getAccessToken } = usePrivy();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(keys);

  const generateApiKey = async () => {
    try {
      const tk = await getAccessToken();
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment: 'live', name: 'Live API Key' }),
      });
      if (!res.ok) throw new Error('gen failed');
      const { keyId, environment, name } = await res.json();
      setApiKeys((prev) => [...prev, { id: keyId, keyId, environment, name, createdAt: new Date().toISOString() }]);
      alert(`API key generated: ${keyId}`);
    } catch (e: any) {
      alert('Error generating key: ' + e.message);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    try {
      const tk = await getAccessToken();
      const res = await fetch('/api/settings/api-keys', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId }),
      });
      if (!res.ok) throw new Error('revoke failed');
      const msg = await res.json();
      alert(msg.message);
      setApiKeys((prev) => prev.filter((k) => k.keyId !== keyId));
    } catch (e: any) {
      alert('Error revoking key: ' + e.message);
    }
  };

  return (
    <>
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">API Keys</h2>
        <p className="text-gray-600 text-sm mt-1">Manage API keys for integrating with your systems</p>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          {apiKeys.map((k) => (
            <div key={k.id} className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="font-medium text-gray-800">{k.name}</h3>
                  <p className="text-xs text-gray-500">Environment: {k.environment}</p>
                  {k.lastUsed && <p className="text-xs text-gray-500">Last used: {new Date(k.lastUsed).toLocaleString()}</p>}
                </div>
                <button
                  className="text-red-600 text-sm font-medium hover:text-red-700"
                  onClick={() => revokeApiKey(k.keyId)}
                >
                  Revoke
                </button>
              </div>
              <div className="bg-white p-2 rounded border border-gray-300 font-mono text-sm break-all">{k.keyId}</div>
            </div>
          ))}
          <div>
            <button
              className="bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow hover:bg-green-700 transition-all"
              onClick={generateApiKey}
            >
              Generate New API Key
            </button>
          </div>
          <div>
            <h3 className="font-medium text-gray-800 mb-2">Webhook URL</h3>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500"
              value={webhookUrl}
              onChange={(e) => onChangeWebhook(e.target.value)}
              placeholder="https://your-website.com/nedapay-webhook"
            />
            <p className="text-gray-500 text-sm mt-1">We'll send payment notifications to this URL</p>
          </div>
          <div className="pt-4">
            <button
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg shadow hover:shadow-lg transition-all disabled:opacity-50"
              onClick={onSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}