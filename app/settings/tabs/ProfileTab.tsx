'use client';

import { SettingsDto } from '../utils/types';

type Props = {
  data: Pick<SettingsDto,
    'businessName' | 'businessEmail' | 'businessPhone' |
    'businessCategory' | 'businessDescription'
  >;
  onChange: (delta: Partial<SettingsDto>) => void;
  onSave: () => void;
  isSaving: boolean;
};

export default function ProfileTab({ data, onChange, onSave, isSaving }: Props) {
  return (
    <>
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-100">Profile</h2>
        <p className="text-gray-100 text-sm mt-1">Manage your business/individual information</p>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-gray-100 font-medium mb-2">User Name</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500"
              value={data.businessName}
              onChange={(e) => onChange({ businessName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-100 font-medium mb-2">Email</label>
            <input
              type="email"
              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500"
              value={data.businessEmail}
              onChange={(e) => onChange({ businessEmail: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-100 font-medium mb-2">Phone</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500"
              value={data.businessPhone}
              onChange={(e) => onChange({ businessPhone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-100 font-medium mb-2">Business Category</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500"
              value={data.businessCategory}
              onChange={(e) => onChange({ businessCategory: e.target.value })}
            >
              <option value="retail">Retail</option>
              <option value="food">Food & Beverage</option>
              <option value="services">Services</option>
              <option value="technology">Technology</option>
              <option value="education">Education</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-100 font-medium mb-2">Business Description</label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500"
              rows={4}
              value={data.businessDescription}
              onChange={(e) => onChange({ businessDescription: e.target.value })}
            />
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