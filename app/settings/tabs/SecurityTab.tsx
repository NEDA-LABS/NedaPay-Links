'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { SettingsDto } from '../utils/types';

type Props = {
  data: Pick<SettingsDto, 'twoFactorEnabled' | 'withdrawalConfirmation'>;
  onChange: (delta: Partial<SettingsDto>) => void;
  onSave: () => void;
  isSaving: boolean;
};

export default function SecurityTab({ data, onChange, onSave, isSaving }: Props) {
  const { getAccessToken } = usePrivy();
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationToken, setVerificationToken] = useState('');

  // lifted 1-to-1 from original component
  const handleEnable2FA = async () => {
    try {
      const tk = await getAccessToken();
      const res = await fetch('/api/settings/2fa', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tk}` },
      });
      if (!res.ok) throw new Error('2fa setup failed');
      const { secret, qrCode } = await res.json();
      setQrCodeUrl(qrCode);
      setShow2FASetup(true);
    } catch (e: any) {
      alert('Error setting up 2FA: ' + e.message);
    }
  };

  const handleDisable2FA = async () => {
    const token = prompt('Enter your 2FA token to disable:');
    if (!token) return;
    try {
      const tk = await getAccessToken();
      const res = await fetch('/api/settings/2fa', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error('disable failed');
      const msg = await res.json();
      alert(msg.message);
      onChange({ twoFactorEnabled: false });
      setShow2FASetup(false);
    } catch (e: any) {
      alert('Error disabling 2FA: ' + e.message);
    }
  };

  const handleVerify2FA = async () => {
    try {
      const tk = await getAccessToken();
      const res = await fetch('/api/settings/2fa', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken }),
      });
      if (!res.ok) throw new Error('verify failed');
      const msg = await res.json();
      alert(msg.message);
      onChange({ twoFactorEnabled: true });
      setShow2FASetup(false);
      setVerificationToken('');
    } catch (e: any) {
      alert('Error verifying 2FA: ' + e.message);
    }
  };

  return (
    <>
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Security Settings</h2>
        <p className="text-gray-600 text-sm mt-1">Manage security options for your merchant account</p>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={data.twoFactorEnabled}
                onChange={(e) => (e.target.checked ? handleEnable2FA() : handleDisable2FA())}
              />
              <span className="text-gray-700 font-medium">Enable Two-Factor Authentication</span>
            </label>
            <p className="text-gray-500 text-sm mt-1 ml-6">Add an extra layer of security to your account</p>
          </div>
          {show2FASetup && (
            <div className="ml-6 p-4 bg-blue-50 rounded-lg shadow-sm">
              <p className="text-blue-700 font-medium mb-2">Two-Factor Authentication Setup</p>
              <p className="text-blue-600 text-sm mb-4">Scan the QR code with your authenticator app and enter the verification code</p>
              <div className="flex justify-center mb-4">
                <img src={qrCodeUrl} alt="2FA QR Code" className="w-40 h-40 rounded-lg border border-gray-200" />
              </div>
              <div className="flex justify-center space-x-4">
                <input
                  type="text"
                  className="p-3 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter verification code"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                />
                <button
                  className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow hover:bg-blue-700 transition-all"
                  onClick={handleVerify2FA}
                >
                  Verify
                </button>
              </div>
            </div>
          )}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={data.withdrawalConfirmation}
                onChange={(e) => onChange({ withdrawalConfirmation: e.target.checked })}
              />
              <span className="text-gray-700 font-medium">Require confirmation for withdrawals</span>
            </label>
            <p className="text-gray-500 text-sm mt-1 ml-6">Send email confirmation for all withdrawal requests</p>
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