"use client";
export const dynamic = "force-dynamic";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import dynamicImport from "next/dynamic";
import { utils } from "ethers";
import { useAccount } from "wagmi";
import { ChevronDown } from "lucide-react";
import {
  ClipboardCopy,
  CheckCircle,
  QrCode,
  Wallet,
  Download,
  LogIn,
} from "lucide-react";
import QRCode from "qrcode";
import { SUPPORTED_CHAINS } from "@/offramp/offrampHooks/constants";
import { stablecoins } from "@/data/stablecoins";
import { mainnet, base, polygon, arbitrum, celo, scroll, bsc } from "viem/chains";
import Header from "@/components/Header";
import { usePrivy } from "@privy-io/react-auth";
import Image from "next/image";

// const PaymentQRCode = dynamicImport(() => import("./QRCode"), { ssr: false });
const PayWithWallet = dynamicImport(() => import("./PayWithWallet"), { ssr: false });
const OffRampPayment = dynamicImport(() => import("./OfframpPayment"), { ssr: false });

// Supported chains for normal payments
const NORMAL_PAYMENT_CHAINS = [
  mainnet, 
  base, 
  polygon, 
  arbitrum, 
  celo, 
  scroll,
  bsc
];

export default function PayPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const { authenticated, login, ready } = usePrivy();
  const [copied, setCopied] = useState(false);
  const [isValidLink, setIsValidLink] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState("");
  const [showAmountInput, setShowAmountInput] = useState(false);
  const amountParam = searchParams.get("amount");
  const amount = amountParam === "0" ? null : amountParam;
  const currency = searchParams.get("currency");
  const description = searchParams.get("description");
  const to = searchParams.get("to");
  const signature = searchParams.get("sig");
  const offRampType = searchParams.get("offRampType");
  const offRampValue = searchParams.get("offRampValue");
  const offRampProvider = searchParams.get("offRampProvider");
  const accountName = searchParams.get("accountName")
  const chainId = searchParams.get("chainId");
  const { address: connectedAddress } = useAccount();
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [linkType, setLinkType] = useState<'NORMAL' | 'OFF_RAMP'>('NORMAL');
  const [selectedToken, setSelectedToken] = useState("");
  const [selectedChain, setSelectedChain] = useState<number | null>(null);
  const [availableTokens, setAvailableTokens] = useState<any[]>([]);
  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);

  const merchantAddress = to && utils.isAddress(to) ? to : connectedAddress || "";
  const shortAddress = merchantAddress ? `${merchantAddress.slice(0, 6)}...${merchantAddress.slice(-4)}` : "";
  
  // Resolve chain info
  const resolvedChain = linkType === 'OFF_RAMP'
    ? SUPPORTED_CHAINS.find(c => c.id === Number(chainId))
    : selectedChain
      ? NORMAL_PAYMENT_CHAINS.find(c => c.id === selectedChain)
      : chainId
        ? NORMAL_PAYMENT_CHAINS.find(c => c.id === Number(chainId))
        : null;

  useEffect(() => {
    const validateLink = async () => {
      try {
        const response = await fetch(`/api/payment-links/validate/${params.id}?${searchParams.toString()}`);
        const data = await response.json();
        
        if (!response.ok) {
          setIsValidLink(false);
          setErrorMessage(data.error || "Invalid or expired payment link");
        } else {
          setIsValidLink(true);
          setLinkType(data.linkType || 'NORMAL');
          
          // Generate QR code for the full URL
          const fullUrl = window.location.href;
          const url = await QRCode.toDataURL(fullUrl, {
            width: 400,
            margin: 2
          });
          setQrDataUrl(url);
          
          // Set initial token and chain for normal payments
          if (data.linkType === 'NORMAL') {
            // Set initial chain if not specified
            if (!chainId) {
              setSelectedChain(base.id); // Default to Base
            }
            
            // Set initial token if not specified
            if (!currency) {
              const usdcToken = stablecoins.find(t => t.baseToken === 'USDC');
              if (usdcToken) {
                setSelectedToken('USDC');
              }
            }
          }
        }
      } catch (error) {
        setIsValidLink(false);
        setErrorMessage("Error validating payment link");
      } finally {
        setIsLoading(false);
      }
    };

    // Only validate link if Privy is ready and user is authenticated
    if (ready && authenticated) {
      validateLink();
    } else if (ready && !authenticated) {
      setIsLoading(false);
    }
  }, [searchParams, ready, authenticated]);

  // Update available tokens when chain changes
  useEffect(() => {
    if (linkType === 'NORMAL' && selectedChain) {
      const tokensForChain = stablecoins.filter(token => 
        token.chainIds && token.chainIds.includes(selectedChain)
      );
      setAvailableTokens(tokensForChain);
      
      // Auto-select first token if none selected
      if (tokensForChain.length > 0 && !selectedToken) {
        setSelectedToken(tokensForChain[0].baseToken);
      }
    }
  }, [selectedChain, linkType]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isTokenDropdownOpen && !target.closest('.token-dropdown-container')) {
        setIsTokenDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTokenDropdownOpen]);

  // Close dropdown when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isTokenDropdownOpen) {
        setIsTokenDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTokenDropdownOpen]);

  const handleCopy = () => {
    if (merchantAddress) {
      navigator.clipboard.writeText(merchantAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadQRCode = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `payment-${params.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAmount || isNaN(Number(customAmount))) return;
    setShowAmountInput(false);
  };

  // Show loading while Privy is initializing
  if (!ready || isLoading) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {!ready ? "Loading..." : "Validating Payment Link..."}
            </h1>
            <div className="flex justify-center">
              <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if user is not authenticated
  if (!authenticated) {
    return (
      <>
      <Header />
      <div className="min-h-screen bg-gray-800 flex items-center justify-center p-4">      
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <LogIn size={32} className="text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Authentication Required</h1>
            <p className="text-gray-600">
              You need to log in to access this payment page.
            </p>
          </div>
          
          <button
            onClick={login}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <LogIn size={20} />
            Login to Continue
          </button>

          <div className="text-center text-sm text-gray-500">
            <p>Secure authentication powered by Privy</p>
          </div>
        </div>
      </div>
      </>
      
    );
  }

  // console.log("custom amount", customAmount); //debugging
  // console.log("amount", amount);

  if (!isValidLink) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-bold text-red-600">Invalid Payment Link</h1>
            <p className="text-sm text-gray-600">{errorMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <Header />
    <div className="min-h-screen bg-gray-800 flex items-center justify-center p-2">
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 space-y-2">
        <div className="text-center space-y-3">
        <Image src="/symbolnlogo.jpeg" alt="Logo" width={100} height={50} className="z-50 mx-auto rounded-lg"/>
          <h1 className="text-xl font-bold text-gray-900">
            {linkType === 'OFF_RAMP' ? 'Payment Request' : 'Payment Request'}
          </h1>
          {linkType === 'OFF_RAMP' && (
            <p className="text-sm text-gray-600">Pay with stablecoin, Receiver gets Cash</p>
          )}
        </div>

        <div className="flex flex-row items-center justify-between text-center bg-gray-50 p-2 rounded-xl w-[80%] mx-auto">
          <p className="text-sm text-gray-700 mb-1">Amount:</p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-gray-900 flex items-center gap-1">
            {linkType === 'NORMAL' && (currency || selectedToken) && (
                <span className="inline-flex items-center gap-1">
                  <Image 
                    src={stablecoins.find(t => t.baseToken === (currency || selectedToken))?.flag || ''} 
                    alt={`${currency || selectedToken} icon`} 
                    width={16} 
                    height={16} 
                    className="w-4 h-4 rounded-full object-cover inline-block"
                  />
                </span>
              )}
              {amount ? `${amount} ` : 'Any Amount '}
              {linkType === 'NORMAL' && (currency || selectedToken) && (
                <span className="inline-flex items-center gap-1">
                  <span className="text-sm">{currency || selectedToken}</span>
                </span>
              )}
            </p>
          </div>
          {resolvedChain && (
            <p className="text-xs text-gray-900 mt-1">
              {resolvedChain.name} Network
            </p>
          )}
        </div>

        {description && (
          <div className="flex flex-row items-center justify-between text-center bg-gray-50 p-2 rounded-xl w-[80%] mx-auto">
            <p className="text-sm text-gray-700 mb-1">Description:</p>
            <p className="text-lg font-medium text-gray-900">
              {decodeURIComponent(description)}
            </p>
          </div>
        )}

        {linkType === 'OFF_RAMP' && offRampValue && offRampProvider && (
          <div className="text-center bg-blue-50 p-4 rounded-xl">
            <p className="text-sm text-gray-600 mb-1">Recipient</p>
            <p className="text-sm font-medium text-gray-900">
            {accountName} | {offRampValue} | ({offRampProvider})
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {offRampType === 'PHONE' ? 'Mobile Money' : 'Bank Account'}
            </p>
          </div>
        )}

        <div className="w-80 mx-auto space-y-2">
          <div className="flex items-center justify-between gap-4 bg-gray-100 px-4 py-3 rounded-lg group transition-all duration-200 group-hover:border-blue-500 border">
            <div className="flex-1 flex items-center gap-2">
              <Wallet size={18} className="text-blue-500" />
              <span className="text-sm font-medium text-gray-700">
                Merchant Wallet
              </span>
            </div>
            <div className="flex-1 text-center">
              <span className="font-mono text-sm text-gray-800">
                {shortAddress}
              </span>
            </div>
            <div className="flex-1 flex justify-end">
              <button
                onClick={handleCopy}
                className="p-2 !bg-blue-500 rounded-lg text-white hover:!bg-blue-600 hover:text-white transition-colors duration-200"
                aria-label="Copy address"
              >
                {copied ? <CheckCircle size={16} /> : <ClipboardCopy size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-2 rounded-xl">
          <div className="flex items-center justify-center gap-1 mb-4">
            <QrCode size={18} className="text-blue-500" />
            <h2 className="text-sm font-semibold text-gray-700">Scan to Pay</h2>
          </div>
          <div className="flex justify-center">
            {qrDataUrl ? (
              <div className="flex flex-col items-center">
                <img src={qrDataUrl} alt="Payment QR Code" className="w-40 h-40" />
                {/* <button
                  onClick={downloadQRCode}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all duration-300 flex items-center gap-2"
                >
                  <Download size={14} /> Download QR
                </button> */}
              </div>
            ) : (
              <p className="text-red-600 dark:text-red-400 font-semibold">Internal server Error</p>
              // <PaymentQRCode to={merchantAddress} amount={amount || ""} currency={currency || ""} description={description || ""} />
            )}
          </div>
        </div>

        {/* Chain and Token Selection for Normal Links */}
        {linkType === 'NORMAL' && (!chainId || !currency) && (
          <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
            {!chainId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Blockchain Network
                </label>
                <div className="relative">
                  <select
                    value={selectedChain || ""}
                    onChange={(e) => setSelectedChain(Number(e.target.value))}
                    className="w-full text-slate-800 px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    {NORMAL_PAYMENT_CHAINS.map(chain => (
                      <option key={chain.id} value={chain.id}>
                        {chain.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {!currency && selectedChain && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Token
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsTokenDropdownOpen(!isTokenDropdownOpen)}
                    className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {selectedToken ? (
                        <>
                          <Image 
                            src={availableTokens.find(t => t.baseToken === selectedToken)?.flag || ''} 
                            alt={`${selectedToken} icon`} 
                            width={20} 
                            height={20} 
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span>{selectedToken} - {availableTokens.find(t => t.baseToken === selectedToken)?.name}</span>
                        </>
                      ) : (
                        <span>Select a token</span>
                      )}
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isTokenDropdownOpen ? 'transform rotate-180' : ''}`} />
                  </button>
                  
                  {isTokenDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg py-1 max-h-60 overflow-auto">
                      {availableTokens.map(token => (
                        <div
                          key={token.baseToken}
                          onClick={() => {
                            setSelectedToken(token.baseToken);
                            setIsTokenDropdownOpen(false);
                          }}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          <Image 
                            src={token.flag} 
                            alt={`${token.baseToken} icon`} 
                            width={20} 
                            height={20} 
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="flex-1">{token.baseToken} - {token.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {showAmountInput ? (
          <form onSubmit={handleAmountSubmit} className="bg-gray-50 p-4 rounded-xl space-y-3">
            <div>
              <label htmlFor="customAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Enter Amount ({currency || selectedToken})
              </label>
              <input
                type="number"
                id="customAmount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full text-slate-800 px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Enter amount in ${currency || selectedToken}`}
                step="any"
                min="0"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Confirm Amount
              </button>
              <button
                type="button"
                onClick={() => setShowAmountInput(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : linkType === 'NORMAL' ? (
          <>
            {!amount && (
              <button
                onClick={() => setShowAmountInput(true)}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all duration-300"
              >
                {!customAmount ? "Enter Payment Amount" : `[${customAmount}] Change Amount`}
              </button>
            )}
            {(!amount && customAmount) || amount ? (
              <PayWithWallet 
                to={merchantAddress} 
                amount={amount === "0" || amount === null ? customAmount : amount || ""} 
                currency={currency || selectedToken || ""} 
                description={description || ""} 
                linkId={params.id} 
                chainId={chainId ? parseInt(chainId) : selectedChain || undefined}
              />
            ) : null}
          </>
        ) : (
          <OffRampPayment
            to={merchantAddress}
            amount={amount || customAmount || ""}
            currency={currency || ""}
            description={description || ""}
            offRampType={offRampType as 'PHONE' | 'BANK_ACCOUNT'}
            offRampValue={offRampValue || ''}
            offRampProvider={offRampProvider || ''}
            linkId={params.id}
            accountName={accountName || ''}
            chainId={chainId ? parseInt(chainId) : undefined}
          />
        )}

        <div className="text-center text-sm text-gray-600 bg-amber-50 p-4 rounded-xl">
          <p className="mb-1">
            {amount ? (
              <>Send exactly <span className="font-semibold text-blue-600">{amount} {currency || selectedToken}</span> to complete payment.</>
            ) : customAmount ? (
              <>Send <span className="font-semibold text-blue-600">{customAmount} {currency || selectedToken}</span> to complete payment.</>
            ) : (
              <>Enter an amount to complete payment.</>
            )}
          </p>
          <p>Transaction confirmation will appear automatically.</p>
        </div>
      </div>
    </div>
    </>
    
  );
}