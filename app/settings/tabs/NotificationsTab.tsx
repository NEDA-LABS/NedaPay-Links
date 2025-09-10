'use client';

import { SettingsDto } from '../utils/types';

type Props = {
  data: Pick<SettingsDto,
    'transactionNotifications' | 'settlementNotifications' | 'securityAlerts' | 'marketingUpdates'
  >;
  onChange: (delta: Partial<SettingsDto>) => void;
  onSave: () => void;
  isSaving: boolean;
};

export default function NotificationsTab({ data, onChange, onSave, isSaving }: Props) {
  return (
    <>
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Notification Settings</h2>
        <p className="text-gray-600 text-sm mt-1">Configure how you receive notifications</p>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          {(['transactionNotifications', 'settlementNotifications', 'securityAlerts', 'marketingUpdates'] as const).map((k) => (
            <div key={k}>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={data[k]}
                  onChange={(e) => onChange({ [k]: e.target.checked })}
                />
                <span className="text-gray-700 font-medium">
                  {k === 'transactionNotifications' && 'Transaction Notifications'}
                  {k === 'settlementNotifications' && 'Settlement Notifications'}
                  {k === 'securityAlerts' && 'Security Alerts'}
                  {k === 'marketingUpdates' && 'Marketing Updates'}
                </span>
              </label>
              <p className="text-gray-500 text-sm mt-1 ml-6">
                {k === 'transactionNotifications' && 'Receive notifications for all incoming payments'}
                {k === 'settlementNotifications' && 'Receive notifications when funds are settled to your wallet'}
                {k === 'securityAlerts' && 'Receive notifications about security events'}
                {k === 'marketingUpdates' && 'Receive updates about new features and promotions'}
              </p>
            </div>
          ))}
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