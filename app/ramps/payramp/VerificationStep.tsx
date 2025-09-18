import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';

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

// Country codes for supported African countries
const COUNTRY_CODES = [
  { code: '+255', country: 'Tanzania', flag: '🇹🇿', currency: 'TZS' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪', currency: 'KES' },
  { code: '+256', country: 'Uganda', flag: '🇺🇬', currency: 'UGX' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬', currency: 'NGN' },
  { code: '+233', country: 'Ghana', flag: '🇬🇭', currency: 'GHS' },
];

// Get country code based on currency
const getCountryCodeByCurrency = (currency: string) => {
  return COUNTRY_CODES.find(cc => cc.currency === currency)?.code || '+255';
};

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

  
  // Mobile number specific states
  const [selectedCountryCode, setSelectedCountryCode] = useState(() => getCountryCodeByCurrency(fiat));
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inputError, setInputError] = useState('');

  // Format phone number as user types with country-specific formatting
  const formatPhoneNumber = (value: string, countryCode: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Country-specific formatting
    switch (countryCode) {
      case '+254': // Kenya
        if (digits.length > 3 && digits.length <= 6) {
          return digits.replace(/(\d{3})(\d+)/, '$1 $2');
        } else if (digits.length > 6) {
          return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3');
        }
        break;
      case '+255': // Tanzania
        if (digits.length > 3 && digits.length <= 6) {
          return digits.replace(/(\d{3})(\d+)/, '$1 $2');
        } else if (digits.length > 6) {
          return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3');
        }
        break;
      case '+256': // Uganda
        if (digits.length > 3 && digits.length <= 6) {
          return digits.replace(/(\d{3})(\d+)/, '$1 $2');
        } else if (digits.length > 6) {
          return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3');
        }
        break;
      case '+234': // Nigeria
        if (digits.length > 3 && digits.length <= 7) {
          return digits.replace(/(\d{3})(\d+)/, '$1 $2');
        } else if (digits.length > 7) {
          return digits.replace(/(\d{3})(\d{4})(\d+)/, '$1 $2 $3');
        }
        break;
      case '+233': // Ghana
        if (digits.length > 2 && digits.length <= 5) {
          return digits.replace(/(\d{2})(\d+)/, '$1 $2');
        } else if (digits.length > 5) {
          return digits.replace(/(\d{2})(\d{3})(\d+)/, '$1 $2 $3');
        }
        break;
      default:
        // Generic formatting
        if (digits.length > 3 && digits.length <= 6) {
          return digits.replace(/(\d{3})(\d+)/, '$1 $2');
        } else if (digits.length > 6) {
          return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3');
        }
    }
    return digits;
  };

  // Validate phone number based on country
  const validatePhoneNumber = (digits: string, countryCode: string) => {
    const minLength = countryCode === '+233' ? 9 : 8; // Ghana has 9 digits, others 8+
    const maxLength = countryCode === '+234' ? 11 : 10; // Nigeria can have 11, others max 10
    
    if (digits.length > 0 && digits.length < minLength) {
      return 'Phone number is too short';
    } else if (digits.length > maxLength) {
      return 'Phone number is too long';
    }
    return '';
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Prevent input if it would exceed reasonable length
    const digits = value.replace(/\D/g, '');
    if (digits.length > 15) return;
    
    const formatted = formatPhoneNumber(value, selectedCountryCode);
    setPhoneNumber(formatted);
    
    // Clear previous errors
    setInputError('');
    
    // Update the parent component's accountIdentifier with full number
    const cleanDigits = formatted.replace(/\D/g, '');
    const fullNumber = selectedCountryCode + cleanDigits;
    setAccountIdentifier(fullNumber);
    
    // Validate phone number
    const validationError = validatePhoneNumber(cleanDigits, selectedCountryCode);
    if (validationError) {
      setInputError(validationError);
    }
  };

  const handleRegularAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccountIdentifier(e.target.value);
    setInputError('');
  };

  // Update country code and rebuild full number
  const handleCountryCodeChange = (newCode: string) => {
    setSelectedCountryCode(newCode);
    setIsDropdownOpen(false);
    
    // Reformat existing phone number with new country code
    if (phoneNumber) {
      const digits = phoneNumber.replace(/\D/g, '');
      const reformatted = formatPhoneNumber(digits, newCode);
      setPhoneNumber(reformatted);
      
      const fullNumber = newCode + digits;
      setAccountIdentifier(fullNumber);
      
      // Revalidate with new country code
      const validationError = validatePhoneNumber(digits, newCode);
      setInputError(validationError);
    }
  };

  // Auto-select country code based on currency when switching to mobile network
  useEffect(() => {
    if (isMobileNetwork) {
      // Auto-select country code based on currency
      const currencyBasedCode = getCountryCodeByCurrency(fiat);
      setSelectedCountryCode(currencyBasedCode);
      
      // If there's an existing accountIdentifier, try to parse it
      if (accountIdentifier && accountIdentifier.startsWith('+')) {
        const countryCode = COUNTRY_CODES.find(cc => accountIdentifier.startsWith(cc.code));
        if (countryCode) {
          const remainingNumber = accountIdentifier.slice(countryCode.code.length);
          setPhoneNumber(formatPhoneNumber(remainingNumber, countryCode.code));
        }
      }
    } else if (!isMobileNetwork) {
      // Reset mobile-specific states when switching to bank
      setPhoneNumber('');
      setSelectedCountryCode(getCountryCodeByCurrency(fiat));
      setInputError('');
    }
  }, [isMobileNetwork, institution, fiat]);

  // Update country code when currency changes
  useEffect(() => {
    const currencyBasedCode = getCountryCodeByCurrency(fiat);
    setSelectedCountryCode(currencyBasedCode);
    
    // If there's an existing phone number, reformat it with the new country code
    if (phoneNumber && isMobileNetwork) {
      const digits = phoneNumber.replace(/\D/g, '');
      const reformatted = formatPhoneNumber(digits, currencyBasedCode);
      setPhoneNumber(reformatted);
      
      const fullNumber = currencyBasedCode + digits;
      setAccountIdentifier(fullNumber);
      
      // Revalidate with new country code
      const validationError = validatePhoneNumber(digits, currencyBasedCode);
      setInputError(validationError);
    }
  }, [fiat]);

  // Reset states when institution changes
  const handleInstitutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setInstitution(e.target.value);
    setAccountIdentifier("");
    setPhoneNumber('');
    setInputError('');
  };

  const selectedCountry = COUNTRY_CODES.find(c => c.code === selectedCountryCode);
  console.log("isAccountVerified vvv",isAccountVerified) //debugg
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
          {fiat === "TZS" ? (<span className="text-white text-xs md:text-sm bg-blue-800/50 rounded-xl px-2 py-1">cashouts to Bank in Tanzania are unavailable at the moment!</span>) : null}
          <select
            id="institution"
            value={institution}
            onChange={handleInstitutionChange}
            onFocus={fetchInstitutions}
            className="w-full px-4 py-3 text-base text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all bg-gray-100 placeholder:text-gray-500"
            required
            disabled={isAccountVerified}
          >
            <option value="" className="bg-gray-100 text-gray-500">Select Institution</option>
            {institutions
              .sort((a, b) => {
                // For Kenyan institutions, put MPESA first
                if (fiat === "KES") {
                  if (a.name.toLowerCase().includes('mpesa') || a.name.toLowerCase().includes('m-pesa')) return -1;
                  if (b.name.toLowerCase().includes('mpesa') || b.name.toLowerCase().includes('m-pesa')) return 1;
                }
                // Then sort by type (mobile money first, then banks)
                if (a.type === "mobile_money" && b.type !== "mobile_money") return -1;
                if (b.type === "mobile_money" && a.type !== "mobile_money") return 1;
                // Finally sort alphabetically
                return a.name.localeCompare(b.name);
              })
              .map((inst) => (
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

          {isMobileNetwork ? (
            <div className="space-y-2">
              {/* Country Code + Phone Number Input */}
              <div className="flex">
                {/* Country Code Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-3 bg-gray-200 border border-gray-300 border-r-0 rounded-l-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all min-w-[100px]"
                    disabled={isAccountVerified}
                  >
                    <span className="text-lg">{selectedCountry?.flag}</span>
                    <span className="text-gray-900 font-medium text-sm">{selectedCountryCode}</span>
                    <ChevronDown size={14} className="text-gray-600" />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && !isAccountVerified && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                      {COUNTRY_CODES.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => handleCountryCodeChange(country.code)}
                          className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 text-left transition-colors"
                        >
                          <span className="text-lg">{country.flag}</span>
                          <span className="font-medium text-gray-900 text-sm">{country.code}</span>
                          <span className="text-xs text-gray-600">{country.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Phone Number Input */}
                <input
                  type="tel"
                  id="accountNumber"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  className={`flex-1 w-50 md:w-full px-4 py-3 text-base text-gray-900 rounded-r-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all bg-gray-100 placeholder:text-gray-500 ${
                    inputError ? 'border-red-400 focus:ring-red-400' : ''
                  }`}
                  placeholder="123 456 789"
                  required
                  disabled={isAccountVerified}
                />
              </div>

              {/* Full Number Preview */}
              {phoneNumber && (
                <div className="bg-gray-700/50 px-3 py-2 rounded-lg border border-gray-600">
                  <span className="text-xs text-gray-300">Full Number: </span>
                  <span className="text-sm font-mono text-white">{selectedCountryCode + phoneNumber.replace(/\D/g, '')}</span>
                </div>
              )}

              {/* Error Message */}
              {inputError && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <p className="text-xs text-red-400">{inputError}</p>
                </div>
              )}

              {/* Help Text */}
              {/* <p className="text-xs text-gray-300 mt-1">
                Enter your mobile number without the country code
              </p> */}
            </div>
          ) : (
            <div>
              {/* Bank Account Input */}
              <input
                type="text"
                id="accountNumber"
                value={accountIdentifier}
                onChange={handleRegularAccountChange}
                className="w-full px-4 py-3 text-base text-gray-900 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all bg-gray-100 placeholder:text-gray-500"
                placeholder="1234567890"
                required
                disabled={isAccountVerified}
              />
              <p className="text-xs text-gray-300 mt-1">
                Enter full account number without spaces
              </p>
            </div>
          )}
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
              // (isMobileNetwork && inputError)
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