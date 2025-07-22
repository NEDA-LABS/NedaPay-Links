import React from 'react';
import { Loader2 } from 'lucide-react';

interface VerificationStepProps {
  institution: string;
  setInstitution: (value: string) => void;
  accountIdentifier: string;
  setAccountIdentifier: (value: string) => void;
  accountName: string;
  setAccountName: (value: string) => void;
  isAccountVerified: boolean;
  isLoading: boolean;
  handleVerifyAccount: () => void;
  institutions: Array<{ name: string; code: string; type: string }>;
  fetchInstitutions: () => void;
  fiat: string;
}

const VerificationStep: React.FC<VerificationStepProps> = ({
  institution,
  setInstitution,
  accountIdentifier,
  setAccountIdentifier,
  accountName,
  setAccountName,
  isAccountVerified,
  isLoading,
  handleVerifyAccount,
  institutions,
  fetchInstitutions,
  fiat
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-700 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full px-3 py-1">
          Step 2
        </span>
        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          Recipient Details
        </h3>
      </div>
      
      <div>
        <label
          htmlFor="institution"
          className="block text-sm font-semibold mb-3 text-gray-700"
        >
          Choose Bank or Mobile Network
        </label>
        <select
          id="institution"
          value={institution}
          onChange={(e) => {
            setInstitution(e.target.value);
          }}
          onFocus={fetchInstitutions}
          className="w-full px-4 py-4 text-base text-slate-800 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
          required
        >
          <option value="">Select Institution</option>
          {institutions.map((inst) => (
            <option key={inst.code} value={inst.code}>
              {inst.name} {inst.type === "mobile" ? "(Mobile Network)" : "(Bank)"}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label
          htmlFor="accountNumber"
          className="block text-sm font-semibold mb-3 text-gray-700"
        >
          Account or Mobile Number
        </label>
        <input
          type="text"
          id="accountNumber"
          value={accountIdentifier}
          onChange={(e) => {
            setAccountIdentifier(e.target.value);
          }}
          className="w-full px-4 py-4 text-base text-slate-800 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
          placeholder="Enter account or mobile number"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          For mobile numbers include country code (e.g., +2341234567890)
        </p>
      </div>
      
      <div>
        <label
          htmlFor="accountName"
          className="block text-sm font-semibold mb-3 text-gray-700"
        >
          Account Name
        </label>
        <input
          type="text"
          id="accountName"
          value={accountName}
          onChange={(e) => {
            setAccountName(e.target.value);
          }}
          className="w-full px-4 py-4 text-base text-slate-800 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
          placeholder="Enter the exact account holder's name"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Ensure the name matches exactly
        </p>
      </div>
      
      <div>
        <button
          type="button"
          onClick={handleVerifyAccount}
          disabled={
            isLoading ||
            !institution ||
            !accountIdentifier ||
            !accountName
          }
          className="w-full px-4 py-4 !bg-gradient-to-r !from-indigo-600 !to-purple-600 hover:!from-indigo-700 hover:!to-purple-700 !text-white !rounded-xl !font-medium !shadow-lg hover:!shadow-xl !transition-all !duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-base transform hover:-translate-y-0.5"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </div>
          ) : (
            "Verify Account"
          )}
        </button>
        
        {isAccountVerified && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 mt-3 backdrop-blur-sm">
            <p className="text-green-800 font-medium text-sm">
              ✓ Account verified successfully
            </p>
            <p className="text-green-700 text-xs mt-1">
              Please double-check that this is your account
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationStep;