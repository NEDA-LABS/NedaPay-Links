"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAccount, useWalletClient, useBalance, usePublicClient } from "wagmi";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { parseEther, formatUnits, isAddress, parseUnits } from "viem";
import { acrossClient } from "@/utils/acrossProtocol";
import { type TransactionProgress } from '@across-protocol/app-sdk';
import { Select } from "@radix-ui/react-select";
import {
  ChevronDownIcon,
  ArrowsUpDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import Header from "@/components/Header";
import { withDashboardLayout } from "@/utils/withDashboardLayout";
import { type Address } from "viem";

// Chain configuration
const chainConfig = {
  10: { name: "Optimism", icon: `<img src="/optimism.svg" />` },
  42161: { name: "Arbitrum", icon: `<img src="/arbitrum.svg" />` },
  8453: { name: "Base", icon: `<img src="/base.svg" />` },
  137: { name: "Polygon", icon: `<img src="/polygon.svg" />` },
  56: { name: "BNB Smart Chain", icon: `<img src="/bnb.svg" />` },
  534352: { name: "Scroll", icon: `<img src="/scroll.svg" />` },
  42220: { name: "Celo", icon: `<img src="/celo.svg" />` },
};

// Token configuration
const TOKENS = {
  ETH: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
    addresses: {
      1: "0x0000000000000000000000000000000000000000",
      10: "0x0000000000000000000000000000000000000000",
      42161: "0x0000000000000000000000000000000000000000",
      8453: "0x0000000000000000000000000000000000000000",
      137: "0x0000000000000000000000000000000000000000",
      56: "0x0000000000000000000000000000000000000000",
    },
    logoSrc: "/eth-logo.svg",
  },
  USDC: {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    addresses: {
      1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      10: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
      42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      137: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      56: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
      42220: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
      534352: "0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4",
    },
    logoSrc: "/usdc-logo.svg",
  },
  USDT: {
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,
    addresses: {
      1: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      10: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
      42161: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      137: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      56: "0x55d398326f99059fF775485246999027B3197955",
      534352: "0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df",
      42220: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e",
    },
    logoSrc: "/usdt-logo.svg",
  },
};

type TokenSymbol = keyof typeof TOKENS;
type ProgressStep = "approve" | "deposit" | "fill";
type ProgressStatus = "pending" | "txSuccess" | "txReverted";

interface Progress {
  step: ProgressStep;
  status: ProgressStatus;
  txReceipt?: any;
  depositId?: string;
  fillTxTimestamp?: number;
  actionSuccess?: boolean;
}

function BridgePage() {
  const { login, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // Form state
  const [fromChainId, setFromChainId] = useState(42161);
  const [toChainId, setToChainId] = useState(10);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [selectedToken, setSelectedToken] = useState<TokenSymbol>("ETH");

  // UI state
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [progress, setProgress] = useState<TransactionProgress | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [needsChainSwitch, setNeedsChainSwitch] = useState(false);
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);
  const [supportedChains, setSupportedChains] = useState<any[]>([]);

  // Compute available tokens
  const availableTokens = useMemo(() => {
    return Object.values(TOKENS).filter(
      (token) => token.addresses[fromChainId as keyof typeof token.addresses] && token.addresses[toChainId as keyof typeof token.addresses]
    );
  }, [fromChainId, toChainId]);

  // Reset selectedToken if not available
  useEffect(() => {
    if (availableTokens.length > 0 && !availableTokens.some((t) => t.symbol === selectedToken)) {
      setSelectedToken(availableTokens[0].symbol as TokenSymbol);
    }
  }, [availableTokens, selectedToken]);

  // Token options for react-select
  const tokenOptions = useMemo(
    () =>
      availableTokens.map((token) => ({
        value: token.symbol,
        label: token.symbol,
        icon: token.logoSrc,
      })),
    [availableTokens]
  );

  // Get token details
  const tokenDetails = TOKENS[selectedToken];
  const tokenAddress = tokenDetails.addresses[fromChainId as keyof typeof tokenDetails.addresses] as `0x${string}`;

  // Balance fetching
  const { data: balance } = useBalance({
    address,
    chainId: fromChainId,
    token: tokenAddress === "0x0000000000000000000000000000000000000000" ? undefined : tokenAddress,
  });

  const wallet = wallets?.[0];

  // Handle chain switching
  const switchChain = useCallback(async () => {
    if (!wallet || !address) return;
    setIsSwitchingChain(true);
    setError("");
    try {
      await wallet.switchChain(fromChainId);
      setNeedsChainSwitch(false);
    } catch (err: any) {
      setError(`Failed to switch chain: ${err.message || "Unknown error"}`);
    } finally {
      setIsSwitchingChain(false);
    }
  }, [wallet, fromChainId, address]);

  // Check if chain needs switching
  useEffect(() => {
    if (wallet?.chainId && wallet.chainId.toString() !== fromChainId.toString()) {
      setNeedsChainSwitch(true);
    } else {
      setNeedsChainSwitch(false);
    }
  }, [wallet?.chainId, fromChainId]);

  // Fetch supported chains
  useEffect(() => {
    const fetchSupportedChains = async () => {
      try {
        const chains = await acrossClient.getSupportedChains({});
        setSupportedChains(chains);
      } catch (err) {
        console.error("Failed to fetch supported chains:", err);
      }
    };
    if (ready && authenticated) {
      fetchSupportedChains();
    }
  }, [ready, authenticated]);

  // Clear states when chains or token changes
  useEffect(() => {
    setQuote(null);
    setError("");
    setSuccess("");
  }, [fromChainId, toChainId, amount, selectedToken]);

  // Validation
  const validation = useMemo(() => {
    const errors: string[] = [];
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      errors.push("Please enter a valid amount");
    }
    if (fromChainId === toChainId) {
      errors.push("Source and destination chains must be different");
    }
    if (recipient && !isAddress(recipient)) {
      errors.push("Invalid recipient address");
    }
    if (balance && amount) {
      const tokenDecimals = tokenDetails.decimals;
      const balanceValue = Number(formatUnits(balance.value, tokenDecimals));
      if (Number(amount) > balanceValue) {
        errors.push("Insufficient balance");
      }
    }
    return { isValid: errors.length === 0, errors };
  }, [amount, fromChainId, toChainId, recipient, balance, tokenDetails]);

  // Automatic quote generation
  useEffect(() => {
    if (validation.isValid && !needsChainSwitch) {
      const timer = setTimeout(() => {
        getQuote();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [fromChainId, toChainId, selectedToken, amount, validation.isValid, needsChainSwitch]);

  // Helper function to get token address with proper validation
  const getTokenAddress = useCallback((token: typeof tokenDetails, chainId: number): string => {
    const address = token.addresses[chainId as keyof typeof token.addresses];
    
    // If no address found for this chain, throw error
    if (!address) {
      throw new Error(`Token ${token.symbol} not supported on chain ${chainId}`);
    }
    
    // Return the address as string (Across API might expect string format)
    return address;
  }, []);

  // Get quote
  const getQuote = useCallback(async () => {
    if (!validation.isValid || !amount || needsChainSwitch) return;
    setLoading(true);
    setError("");
    setQuote(null);
    
    try {
      // Get input and output token addresses with proper validation
      const inputToken = getTokenAddress(tokenDetails, fromChainId);
      const outputToken = getTokenAddress(tokenDetails, toChainId);

      console.log('Quote params:', {
        fromChainId,
        toChainId,
        inputToken,
        outputToken,
        selectedToken: tokenDetails.symbol,
        amount
      });

      const quoteParams = {
        route: {
          originChainId: fromChainId,
          destinationChainId: toChainId,
          inputToken: inputToken as Address,
          outputToken: outputToken as Address,
        },
        inputAmount: parseUnits(amount.toString(), tokenDetails.decimals),
      };

      const q = await acrossClient.getQuote(quoteParams);
      
      if (q.isAmountTooLow) {
        throw new Error(`Amount too low. Minimum: ${formatUnits(q.limits.minDeposit, tokenDetails.decimals)} ${tokenDetails.symbol}`);
      }
      
      setQuote(q);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to get quote";
      setError(errorMessage);
      console.error("Quote error:", err);
      
      // Log additional debug info
      console.error("Debug info:", {
        fromChainId,
        toChainId,
        selectedToken,
        tokenDetails,
        inputToken: tokenDetails.addresses[fromChainId as keyof typeof tokenDetails.addresses],
        outputToken: tokenDetails.addresses[toChainId as keyof typeof tokenDetails.addresses],
      });
    } finally {
      setLoading(false);
    }
  }, [amount, fromChainId, toChainId, validation.isValid, tokenDetails, needsChainSwitch, getTokenAddress]);

  // Execute bridge
  const executeBridge = useCallback(async () => {
    if (!quote || !walletClient || !address || needsChainSwitch) return;
    setExecuting(true);
    setError("");
    setSuccess("");
    setProgress(null);
    try {
      const deposit = { ...quote.deposit, recipient: recipient || address };
      await acrossClient.executeQuote({
        walletClient,
        deposit,
        onProgress: (p: TransactionProgress) => {
          setProgress(p);
          if (p.step === "approve" && p.status === "txSuccess") {
            setSuccess("Token approval successful! 🎉");
          }
          if (p.step === "deposit" && p.status === "txSuccess") {
            setSuccess("Deposit successful! Waiting for fill... ⏳");
          }
          if (p.step === "fill" && p.status === "txSuccess") {
            setSuccess("Bridge complete! Funds received on destination chain ✅");
            setQuote(null);
            setAmount("");
            setProgress(null);
          }
          if (p.status === "txError") {
            setError(`Transaction failed at ${p.step} step`);
            setProgress(null);
          }
        },
      });
    } catch (err: any) {
      setError(err.message || "Bridge execution failed");
      setProgress(null);
      console.error("Execution error:", err);
    } finally {
      setExecuting(false);
    }
  }, [quote, walletClient, address, recipient, needsChainSwitch]);

  // Swap chains
  const swapChains = () => {
    const temp = fromChainId;
    setFromChainId(toChainId);
    setToChainId(temp);
  };

  // Set max amount
  const setMaxAmount = useCallback(() => {
    if (!balance) return;
    const buffer = selectedToken === "ETH" ? 0.001 : 0;
    const balanceValue = Number(formatUnits(balance.value, tokenDetails.decimals));
    const maxAmount = Math.max(0, balanceValue - buffer);
    setAmount(maxAmount.toFixed(tokenDetails.decimals > 6 ? 6 : tokenDetails.decimals));
  }, [balance, tokenDetails, selectedToken]);

  // Custom styles for react-select
  const customSelectStyles = {
    control: (provided: any) => ({
      ...provided,
      backgroundColor: '#F9FAFB',
      border: '2px solid #E5E7EB',
      borderRadius: '0 0.75rem 0.75rem 0',
      height: '100%',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#3B82F6',
      },
    }),
    menu: (provided: any) => ({
      ...provided,
      borderRadius: '0.75rem',
      overflow: 'hidden',
      zIndex: 100,
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      display: 'flex',
      alignItems: 'center',
      padding: '0.75rem',
      backgroundColor: state.isSelected ? '#3B82F6' : state.isFocused ? '#EFF6FF' : 'white',
      color: state.isSelected ? 'white' : '#111827',
    }),
    singleValue: (provided: any) => ({
      ...provided,
      display: 'flex',
      alignItems: 'center',
    }),
  };

  // Render loading state
  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Render login state
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Across Bridge</h1>
            <p className="text-gray-600">Connect your wallet to start bridging assets across chains</p>
          </div>
          <button
            onClick={login}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <main className="max-w-2xl mx-auto p-4 pt-8">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-8 space-y-2 md:space-y-6">
            {/* Chain Selection */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-4 items-center">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                  <div className="relative">
                    <select
                      value={fromChainId}
                      onChange={(e) => setFromChainId(Number(e.target.value))}
                      className="w-full appearance-none bg-gray-50 border-2 border-gray-200 rounded-xl py-3 pl-4 pr-10 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={executing || isSwitchingChain}
                    >
                      {Object.entries(chainConfig).map(([id, chain]) => (
                        <option key={id} value={id}>
                          {chain.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <div className="flex justify-center md:col-span-1">
                  <button
                    onClick={swapChains}
                    className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                    disabled={loading || executing || isSwitchingChain}
                  >
                    <ArrowsUpDownIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                  <div className="relative">
                    <select
                      value={toChainId}
                      onChange={(e) => setToChainId(Number(e.target.value))}
                      className="w-full appearance-none bg-gray-50 border-2 border-gray-200 rounded-xl py-3 pl-4 pr-10 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={executing || isSwitchingChain}
                    >
                      {Object.entries(chainConfig).map(([id, chain]) => (
                        <option key={id} value={id}>
                          {chain.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
            {/* Amount Input */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">Send</label>
                {balance && (
                  <span className="text-sm text-gray-500">
                    Balance: {Number(formatUnits(balance.value, tokenDetails.decimals)).toFixed(6)} {tokenDetails.symbol}
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-[90%] md:w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-4 px-1 text-2xl font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={executing || isSwitchingChain}
                />
                <select
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value as TokenSymbol)}
                  disabled={executing || isSwitchingChain}
                  className="w-[50%] md:w-full items-center bg-gray-50 border-2 border-gray-200 rounded-xl py-4 px-1 text-base font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ml-2"
                >
                  <option value="" disabled>Select Token</option>
                  {tokenOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={setMaxAmount}
                  className="ml-2 px-4 py-4 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition-colors"
                  disabled={executing || isSwitchingChain || !balance}
                >
                  MAX
                </button>
              </div>
            </div>
            {/* Advanced Options */}
            <div className="border-t pt-4">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <span>Advanced Options</span>
                <ChevronDownIcon className={`ml-2 h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>
              {showAdvanced && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recipient Address (Optional)
                    </label>
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="0x... (defaults to your address)"
                      className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-3 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={executing || isSwitchingChain}
                    />
                  </div>
                </div>
              )}
            </div>
            {/* Chain Switch Notice */}
            {needsChainSwitch && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-700 text-sm">
                      Your wallet is connected to a different chain. Switch to {chainConfig[fromChainId as keyof typeof chainConfig]?.name} to continue.
                    </p>
                    <button
                      onClick={switchChain}
                      disabled={isSwitchingChain}
                      className="mt-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors flex items-center"
                    >
                      {isSwitchingChain ? (
                        <>
                          <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                          Switching...
                        </>
                      ) : (
                        `Switch to ${chainConfig[fromChainId as keyof typeof chainConfig]?.name}`
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Validation Errors */}
            {!validation.isValid && !needsChainSwitch && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    {validation.errors.map((error, index) => (
                      <p key={index} className="text-red-700 text-sm">{error}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {/* Quote Display */}
            {loading && !quote && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-center">
                <ArrowPathIcon className="animate-spin h-5 w-5 mr-2 text-gray-600" />
                <span className="text-gray-600">Fetching Quote...</span>
              </div>
            )}
            {quote && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Bridge Quote</h3>
                  <div className="flex items-center text-green-600">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">~{quote.estimatedFillTimeSec}s</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">You'll Receive</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {Number(formatUnits(quote.deposit.outputAmount, tokenDetails.decimals)).toFixed(6)} {tokenDetails.symbol}
                    </div>
                    <div className="text-xs text-gray-500">
                      on {chainConfig[toChainId as keyof typeof chainConfig]?.name}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Bridge Fee</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {Number(formatUnits(quote.fees.totalRelayFee.total, tokenDetails.decimals)).toFixed(6)} {tokenDetails.symbol}
                    </div>
                    <div className="text-xs text-gray-500">
                      ~{((Number(formatUnits(quote.fees.totalRelayFee.total, tokenDetails.decimals)) / Number(amount)) * 100).toFixed(3)}%
                    </div>
                  </div>
                </div>
                <button
                  onClick={executeBridge}
                  disabled={executing || needsChainSwitch}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-lg flex items-center justify-center"
                >
                  {executing ? (
                    <>
                      <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                      {progress?.step === "approve" && "Approving..."}
                      {progress?.step === "deposit" && "Depositing..."}
                      {progress?.step === "fill" && "Waiting for Fill..."}
                    </>
                  ) : (
                    <>
                      Bridge Now
                      <ArrowRightIcon className="h-5 w-5 ml-2" />
                    </>
                  )}
                </button>
              </div>
            )}
            {/* Progress Display */}
            {progress && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-blue-900">Bridge Progress</h4>
                  <div className="flex items-center text-blue-600">
                    <ArrowPathIcon className="animate-spin h-4 w-4 mr-1" />
                    <span className="text-sm capitalize">{progress.step}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <div className={`flex items-center ${progress.step === "approve" ? "text-blue-600" : "text-green-600"}`}>
                    {progress.step === "approve" ? <ArrowPathIcon className="animate-spin h-4 w-4 mr-1" /> : <CheckCircleIcon className="h-4 w-4 mr-1" />}
                    Approve
                  </div>
                  <div className={`flex items-center ${progress.step === "deposit" && progress.status === "txPending" ? "text-blue-600" : progress.step === "deposit" && progress.status === "txSuccess" ? "text-green-600" : "text-gray-400"}`}>
                    {progress.step === "deposit" && progress.status === "txPending" ? <ArrowPathIcon className="animate-spin h-4 w-4 mr-1" /> : progress.step === "deposit" && progress.status === "txSuccess" ? <CheckCircleIcon className="h-4 w-4 mr-1" /> : <div className="h-4 w-4 mr-1 rounded-full border-2 border-gray-300" />}
                    Deposit
                  </div>
                  <div className={`flex items-center ${progress.step === "fill" && progress.status === "txPending" ? "text-blue-600" : progress.step === "fill" && progress.status === "txSuccess" ? "text-green-600" : "text-gray-400"}`}>
                    {progress.step === "fill" && progress.status === "txPending" ? <ArrowPathIcon className="animate-spin h-4 w-4 mr-1" /> : progress.step === "fill" && progress.status === "txSuccess" ? <CheckCircleIcon className="h-4 w-4 mr-1" /> : <div className="h-4 w-4 mr-1 rounded-full border-2 border-gray-300" />}
                    Fill
                  </div>
                </div>
              </div>
            )}
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start">
                  <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-red-900 mb-1">Error</h4>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}
            {/* Success Display */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-green-900 mb-1">Success</h4>
                    <p className="text-green-700 text-sm">{success}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default withDashboardLayout(BridgePage);