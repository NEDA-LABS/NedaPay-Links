import React from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface VerificationStepProps {
  institution: string;
  setInstitution: (value: string) => void;
  accountIdentifier: string;
  setAccountIdentifier: (value: string) => void;
  accountName: string;
  setAccountName: (value: string) => void;
  isAccountVerified: boolean;
  setIsAccountVerified: React.Dispatch<React.SetStateAction<boolean>>;
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
  setIsAccountVerified,
  isLoading,
  handleVerifyAccount,
  institutions,
  fetchInstitutions,
  fiat
}) => {
  const isMobileNetwork = institution && institutions.find(i => i.code === institution)?.type === "mobile_money";
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-emerald-400 bg-gradient-to-r from-emerald-900/50 to-green-900/50 rounded-full px-3 py-1">
          Step 2
        </span>
        <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
          Recipient Details
        </h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label
            htmlFor="institution"
            className="block text-sm font-semibold mb-3 text-gray-100"
          >
            Choose Bank or Mobile Network
          </label>
          <select
            id="institution"
            value={institution}
            onChange={(e) => {
              setInstitution(e.target.value);
              setAccountIdentifier("");
            }}
            onFocus={fetchInstitutions}
            className="w-full px-4 py-3 text-base text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all bg-gray-100 placeholder:text-gray-500"
            required
            disabled={isAccountVerified}
          >
            <option value="" className="bg-gray-100 text-gray-500">Select Institution</option>
            {institutions.map((inst) => (
              <option key={inst.code} value={inst.code} className="bg-gray-100 text-gray-900">
                {inst.name} {inst.type === "mobile_money" ? "(Mobile Network)" : "(Bank)"}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label
            htmlFor="accountNumber"
            className="block text-sm font-semibold mb-3 text-gray-100"
          >
            {isMobileNetwork ? "Mobile Number" : "Bank Account Number"}
          </label>
          <input
            type="text"
            id="accountNumber"
            value={accountIdentifier}
            onChange={(e) => {
              setAccountIdentifier(e.target.value);
            }}
            className="w-full px-4 py-3 text-base text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all bg-gray-100 placeholder:text-gray-500"
            placeholder={isMobileNetwork ? "e.g. +2551234567890" : "e.g. 1234567890"}
            required
            disabled={isAccountVerified}
          />
          <p className="text-xs text-gray-500 mt-1">
            {isMobileNetwork 
              ? "Include country code (e.g., +2551234567890)" 
              : "Enter full account number without spaces"}
          </p>
        </div>
        
        <div>
          <label
            htmlFor="accountName"
            className="block text-sm font-semibold mb-3 text-gray-100"
          >
            Account Holder Name
          </label>
          <input
            type="text"
            id="accountName"
            value={accountName}
            onChange={(e) => {
              setAccountName(e.target.value);
            }}
            className="w-full px-4 py-3 text-base text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all bg-gray-100 placeholder:text-gray-500"
            placeholder="As it appears on your account"
            required
            disabled={isAccountVerified}
          />
        </div>
      </div>
      
      <div className="space-y-3">
        {!isAccountVerified ? (
          <button
            type="button"
            onClick={handleVerifyAccount}
            disabled={
              isLoading ||
              !institution ||
              !accountIdentifier ||
              !accountName
            }
            className="w-full px-4 py-3 bg-gradient-to-r from-indigo-700 to-purple-700 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-base transform hover:-translate-y-0.5 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Account Details"
            )}
          </button>
        ) : (
          <div className="p-4 bg-gradient-to-r from-emerald-900/30 to-green-900/30 rounded-xl border border-emerald-700 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-emerald-400 font-medium text-sm">
                  Account verified successfully
                </p>
                <p className="text-emerald-500 text-xs mt-1">
                  {accountName} • {accountIdentifier}
                </p>
              </div>
            </div>
          </div>
        )}

        {isAccountVerified && (
          <button
            type="button"
            onClick={() => setIsAccountVerified(false)}
            className="w-full text-sm text-gray-100 hover:text-gray-300 underline transition-colors duration-200"
          >
            Edit account details
          </button>
        )}
      </div>

      {/* {isMobileNetwork && (
        <div className="p-3 bg-gradient-to-r from-amber-900/20 to-orange-900/20 rounded-lg border border-amber-700/50">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-amber-400 text-xs">
              Mobile money transfers may have additional fees from the network provider.
            </p>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default VerificationStep;