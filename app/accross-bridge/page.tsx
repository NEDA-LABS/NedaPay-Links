"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAccount, useWalletClient, useBalance, usePublicClient } from "wagmi";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { parseEther, formatUnits, isAddress, parseUnits } from "viem";
import { acrossClient } from "@/utils/acrossProtocol";
import { type TransactionProgress } from '@across-protocol/app-sdk';
import { Listbox, Transition } from "@headlessui/react";
import toast, { Toaster } from 'react-hot-toast';
import {
  ChevronDownIcon,
  ArrowsUpDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import Header from "@/components/Header";
import { withDashboardLayout } from "@/utils/withDashboardLayout";
import { type Address } from "viem";
import Image from "next/image";
// Chain configuration with SVG components
const chainConfig = {
  10: { 
    name: "Optimism", 
    icon: (
      <div className="w-6 h-6 rounded-full bg-[#FF0420] flex items-center justify-center">
        <Image src="/optimism.svg" alt="Optimism" width={24} height={24} />
      </div>
    ) 
  },
  42161: { 
    name: "Arbitrum", 
    icon: (
      <div className="w-6 h-6 rounded-full bg-[#2D374B] flex items-center justify-center">
        <Image src="/arbitrum.svg" alt="Arbitrum" width={24} height={24} />
      </div>
    ) 
  },
  8453: { 
    name: "Base", 
    icon: (
      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
        <Image src="/base.svg" alt="Base" width={24} height={24} />
      </div>
    ) 
  },
  137: { 
    name: "Polygon", 
    icon: (
      <div className="w-6 h-6 rounded-full bg-[#8247E5] flex items-center justify-center">
        <Image src="/polygon.svg" alt="Polygon" width={24} height={24} />
      </div>
    ) 
  },
  56: { 
    name: "BNB Chain", 
    icon: (
      <div className="w-6 h-6 rounded-full bg-[#F0B90B] flex items-center justify-center">
        <Image src="/bnb.svg" alt="BNB Chain" width={24} height={24} />
      </div>
    ) 
  },
  534352: { 
    name: "Scroll", 
    icon: (
      <div className="w-6 h-6 rounded-full bg-[#EACD98] flex items-center justify-center">
        <Image src="/scroll.svg" alt="Scroll" width={24} height={24} />
      </div>
    ) 
  },
  42220: { 
    name: "Celo", 
    icon: (
      <div className="w-6 h-6 rounded-full bg-[#FCFF52] flex items-center justify-center">
        <Image src="/celo.svg" alt="Celo" width={24} height={24} />
      </div>
    ) 
  },
};

// Token configuration with SVG components
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
    icon: (
      <div className="w-6 h-6 rounded-full bg-[#627EEA] flex items-center justify-center">
        <Image src="/eth-logo.svg" alt="ETH" width={20} height={20} />
      </div>
    )
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
    icon: (
      <div className="w-6 h-6 rounded-full bg-[#2775CA] flex items-center justify-center">
        <Image src="/usdc-logo.svg" alt="USDC" width={24} height={24} />
      </div>
    )
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
    icon: (
      <div className="w-6 h-6 rounded-full bg-[#26A17B] flex items-center justify-center">
        <Image src="/usdt-logo.svg" alt="USDT" width={24} height={24} />
      </div>
    )
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
  const [fromChainId, setFromChainId] = useState<number>(42161);
  const [toChainId, setToChainId] = useState<number>(10);
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
  const [routeSupported, setRouteSupported] = useState(true);
  const [tokenSupported, setTokenSupported] = useState(true);

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

  // Token options for custom select
  const tokenOptions = useMemo(
    () =>
      availableTokens.map((token) => ({
        value: token.symbol,
        label: token.symbol,
        icon: token.icon,
        name: token.name,
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
      toast.success(`Switched to ${chainConfig[fromChainId as keyof typeof chainConfig]?.name}`);
    } catch (err: any) {
      const errorMsg = `Failed to switch chain: ${err.message || "Unknown error"}`;
      setError(errorMsg);
      toast.error(errorMsg);
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
        toast.error("Failed to fetch supported chains");
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
    
    // Check if route is supported
    const fromSupported = supportedChains.some(chain => chain.chainId === fromChainId);
    const toSupported = supportedChains.some(chain => chain.chainId === toChainId);
    setRouteSupported(fromSupported && toSupported);
    
    // Check if token is supported on both chains
    const tokenSupported = availableTokens.some(token => token.symbol === selectedToken);
    setTokenSupported(tokenSupported);
  }, [fromChainId, toChainId, amount, selectedToken, supportedChains, availableTokens]);

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
    if (!routeSupported) {
      errors.push("This route is not supported by Across Protocol");
    }
    if (!tokenSupported) {
      errors.push("This token is not supported on selected chains");
    }
    return { isValid: errors.length === 0, errors };
  }, [amount, fromChainId, toChainId, recipient, balance, tokenDetails, routeSupported, tokenSupported]);

  // Helper function to get token address
  const getTokenAddress = useCallback((token: typeof tokenDetails, chainId: number): string => {
    const address = token.addresses[chainId as keyof typeof token.addresses];
    if (!address) {
      throw new Error(`Token ${token.symbol} not supported on chain ${chainId}`);
    }
    return address;
  }, []);

  // Get quote
  const getQuote = useCallback(async () => {
    if (!validation.isValid || !amount || needsChainSwitch) return;
    setLoading(true);
    setError("");
    setQuote(null);
    
    try {
      const inputToken = getTokenAddress(tokenDetails, fromChainId);
      const outputToken = getTokenAddress(tokenDetails, toChainId);

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
      toast.success("Quote received successfully");
    } catch (err: any) {
      const errorMessage = err.message || "Failed to get quote";
      setError(errorMessage);
      toast.error(errorMessage);
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
            const msg = "Token approval successful! 🎉";
            setSuccess(msg);
            toast.success(msg);
          }
          if (p.step === "deposit" && p.status === "txSuccess") {
            const msg = "Deposit successful! Waiting for fill... ⏳";
            setSuccess(msg);
            toast.success(msg);
          }
          if (p.step === "fill" && p.status === "txSuccess") {
            const msg = "Bridge complete! Funds received ✅";
            setSuccess(msg);
            toast.success(msg);
            setQuote(null);
            setAmount("");
            setProgress(null);
          }
          if (p.status === "txError") {
            const errorMsg = `Transaction failed at ${p.step} step`;
            setError(errorMsg);
            setProgress(null);
            toast.error(errorMsg);
          }
        },
      });
    } catch (err: any) {
      const errorMsg = err.message || "Bridge execution failed";
      setError(errorMsg);
      setProgress(null);
      toast.error(errorMsg);
    } finally {
      setExecuting(false);
    }
  }, [quote, walletClient, address, recipient, needsChainSwitch]);

  // Swap chains
  const swapChains = () => {
    const temp = fromChainId;
    setFromChainId(toChainId);
    setToChainId(temp);
    toast("Chains swapped", { icon: "🔄" });
  };

  // Set max amount
  const setMaxAmount = useCallback(() => {
    if (!balance) return;
    const buffer = selectedToken === "ETH" ? 0.001 : 0;
    const balanceValue = Number(formatUnits(balance.value, tokenDetails.decimals));
    const maxAmount = Math.max(0, balanceValue - buffer);
    setAmount(maxAmount.toFixed(tokenDetails.decimals > 6 ? 6 : tokenDetails.decimals));
    toast("Max amount set", { icon: "⬆️" });
  }, [balance, tokenDetails, selectedToken]);

  // Chain selection component
  const ChainSelect = ({ value, onChange, label, disabled }: { 
    value: number; 
    onChange: (value: number) => void; 
    label: string;
    disabled?: boolean;
  }) => (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className="relative">
        <Listbox.Label className="block text-sm font-medium text-gray-300 mb-2">{label}</Listbox.Label>
        <Listbox.Button className="relative w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-4 pr-10 text-left shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
          <span className="flex items-center gap-3">
            {chainConfig[value as keyof typeof chainConfig]?.icon}
            <span className="font-medium text-white text-sm">{chainConfig[value as keyof typeof chainConfig]?.name}</span>
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </span>
        </Listbox.Button>
        <Transition
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          // className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl shadow-lg overflow-hidden"
        >
          <Listbox.Options className="max-h-60 overflow-auto">
            {Object.entries(chainConfig).map(([id, chain]) => (
              <Listbox.Option
                key={id}
                value={Number(id)}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-3 pl-4 pr-4 ${
                    active ? 'bg-gray-700 text-blue-300' : 'text-gray-200'
                  }`
                }
              >
                {({ selected }) => (
                  <div className="flex items-center gap-3">
                    {chain.icon}
                    <span className={`block truncate ${selected ? 'font-medium text-blue-400' : 'font-normal'}`}>
                      {chain.name}
                    </span>
                  </div>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );

  // Token selection component
  const TokenSelect = ({ value, onChange, disabled }: { 
    value: TokenSymbol; 
    onChange: (value: TokenSymbol) => void; 
    disabled?: boolean;
  }) => (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className="relative">
        <Listbox.Button className="relative w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-4 pr-10 text-left shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
          <span className="flex items-center gap-3">
            {TOKENS[value].icon}
            <span className="font-medium text-white">{value}</span>
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </span>
        </Listbox.Button>
        <Transition
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          // className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl shadow-lg overflow-hidden"
        >
          <Listbox.Options className="max-h-60 overflow-auto">
            {tokenOptions.map((token) => (
              <Listbox.Option
                key={token.value}
                value={token.value}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-3 pl-4 pr-4 ${
                    active ? 'bg-gray-700 text-blue-300' : 'text-gray-200'
                  }`
                }
              >
                {({ selected }) => (
                  <div className="flex items-center gap-3">
                    {token.icon}
                    <span className={`block truncate ${selected ? 'font-medium text-blue-400' : 'font-normal'}`}>
                      {token.label} - {token.name}
                    </span>
                  </div>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );

  // Render loading state
  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Render login state
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-xl p-8 text-center border border-gray-700">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to Across Bridge</h1>
            <p className="text-gray-400">Connect your wallet to start bridging assets across chains</p>
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
    <div className="min-h-screen">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1F2937',
            color: '#F9FAFB',
            border: '1px solid #374151',
            borderRadius: '0.75rem',
            padding: '16px',
          },
        }}
      />
      <Header />
      <main className="max-w-2xl mx-auto p-1 pt-8">
        <div className="bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 overflow-hidden">
          <div className="p-6 md:p-8 space-y-6">
            <div className="pb-4 border-b border-gray-700">
              <h1 className="text-2xl font-bold text-white">Cross-Chain Bridge</h1>
              <p className="text-gray-400 mt-1">Transfer assets between networks instantly</p>
            </div>
            
            {/* Chain Selection */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div className="md:col-span-2">
                  <ChainSelect 
                    value={fromChainId} 
                    onChange={setFromChainId} 
                    label="From" 
                    disabled={executing || isSwitchingChain}
                  />
                </div>
                <div className="flex justify-center md:col-span-1">
                  <button
                    onClick={swapChains}
                    className="p-3 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                    disabled={loading || executing || isSwitchingChain}
                  >
                    <ArrowsUpDownIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="md:col-span-2">
                  <ChainSelect 
                    value={toChainId} 
                    onChange={setToChainId} 
                    label="To" 
                    disabled={executing || isSwitchingChain}
                  />
                </div>
              </div>
              
              {!routeSupported && (
                <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-3 flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-yellow-300 text-sm">
                    This route is not supported by Across Protocol. Please select different chains.
                  </p>
                </div>
              )}
            </div>
            
            {/* Token Selection */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-300">Token</label>
                <div className="flex items-center">
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-lg flex items-center">
                    <InformationCircleIcon className="h-4 w-4 mr-1" />
                    Supported on both chains
                  </span>
                </div>
              </div>
              <TokenSelect 
                value={selectedToken} 
                onChange={setSelectedToken as (value: string) => void} 
                disabled={executing || isSwitchingChain || !routeSupported}
              />
              
              {!tokenSupported && (
                <div className="bg-red-900/30 border border-red-700 rounded-xl p-3 flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-red-300 text-sm">
                    {selectedToken} is not supported on both selected chains. Please choose a different token.
                  </p>
                </div>
              )}
            </div>
            
            {/* Amount Input */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-300">Amount</label>
                {balance && (
                  <div className="flex items-center">
                    <span className="text-sm text-gray-400">
                      Balance: {Number(formatUnits(balance.value, tokenDetails.decimals)).toFixed(6)} {tokenDetails.symbol}
                    </span>
                    <button
                      onClick={setMaxAmount}
                      className="ml-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300 transition-colors"
                      disabled={executing || isSwitchingChain || !balance || !routeSupported || !tokenSupported}
                    >
                      MAX
                    </button>
                  </div>
                )}
              </div>
              <div className="relative flex">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl py-4 px-4 text-xl font-semibold text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={executing || isSwitchingChain || !routeSupported || !tokenSupported}
                />
              </div>
            </div>
            
            {/* Advanced Options */}
            <div className="border-t border-gray-700 pt-4">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                <span>Advanced Options</span>
                <ChevronDownIcon className={`ml-2 h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>
              {showAdvanced && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Recipient Address (Optional)
                    </label>
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="0x... (defaults to your address)"
                      className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl py-3 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={executing || isSwitchingChain}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Chain Switch Notice */}
            {needsChainSwitch && (
              <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-300 text-sm">
                      Your wallet is connected to a different chain. Switch to {chainConfig[fromChainId as keyof typeof chainConfig]?.name} to continue.
                    </p>
                    <button
                      onClick={switchChain}
                      disabled={isSwitchingChain}
                      className="mt-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors flex items-center"
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
              <div className="bg-red-900/30 border border-red-700 rounded-xl p-4">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    {validation.errors.map((error, index) => (
                      <p key={index} className="text-red-300 text-sm">{error}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Quote Display */}
            {loading && !quote && (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center justify-center">
                <ArrowPathIcon className="animate-spin h-5 w-5 mr-2 text-blue-400" />
                <span className="text-gray-400">Fetching Quote...</span>
              </div>
            )}
            
            {quote && (
              <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-700 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Bridge Quote</h3>
                  <div className="flex items-center text-green-400">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">~{Math.round(quote.estimatedFillTimeSec / 60)} min</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">You'll Receive</div>
                    <div className="text-2xl font-bold text-white">
                      {Number(formatUnits(quote.deposit.outputAmount, tokenDetails.decimals)).toFixed(6)} {tokenDetails.symbol}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      on {chainConfig[toChainId as keyof typeof chainConfig]?.name}
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Bridge Fee</div>
                    <div className="text-2xl font-bold text-white">
                      {Number(formatUnits(quote.fees.totalRelayFee.total, tokenDetails.decimals)).toFixed(6)} {tokenDetails.symbol}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ~{((Number(formatUnits(quote.fees.totalRelayFee.total, tokenDetails.decimals)) / Number(amount)) * 100).toFixed(3)}%
                    </div>
                  </div>
                </div>
                <button
                  onClick={executeBridge}
                  disabled={executing || needsChainSwitch || !validation.isValid}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-lg flex items-center justify-center"
                >
                  {executing ? (
                    <>
                      <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                      {progress?.step === "approve" && "Approving..."}
                      {progress?.step === "deposit" && "Depositing..."}
                      {progress?.step === "fill" && "Completing..."}
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
              <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-blue-300">Bridge Progress</h4>
                  <div className="flex items-center text-blue-400">
                    <ArrowPathIcon className="animate-spin h-4 w-4 mr-1" />
                    <span className="text-sm capitalize">{progress.step}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <div className={`flex items-center ${progress.step === "approve" ? "text-blue-400" : progress.status === "txSuccess" ? "text-green-400" : "text-gray-500"}`}>
                    {progress.step === "approve" ? 
                      <ArrowPathIcon className="animate-spin h-4 w-4 mr-1" /> : 
                      progress.status === "txSuccess" ? 
                      <CheckCircleIcon className="h-4 w-4 mr-1" /> : 
                      <div className="h-4 w-4 mr-1 rounded-full border-2 border-gray-500" />
                    }
                    Approve
                  </div>
                  <div className={`flex items-center ${progress.step === "deposit" ? "text-blue-400" : progress.status === "txSuccess" ? "text-green-400" : "text-gray-500"}`}>
                    {progress.step === "deposit" ? 
                      <ArrowPathIcon className="animate-spin h-4 w-4 mr-1" /> : 
                      progress.status === "txSuccess" ? 
                      <CheckCircleIcon className="h-4 w-4 mr-1" /> : 
                      <div className="h-4 w-4 mr-1 rounded-full border-2 border-gray-500" />
                    }
                    Deposit
                  </div>
                  <div className={`flex items-center ${progress.step === "fill" ? "text-blue-400" : progress.status === "txSuccess" ? "text-green-400" : "text-gray-500"}`}>
                    {progress.step === "fill" ? 
                      <ArrowPathIcon className="animate-spin h-4 w-4 mr-1" /> : 
                      progress.status === "txSuccess" ? 
                      <CheckCircleIcon className="h-4 w-4 mr-1" /> : 
                      <div className="h-4 w-4 mr-1 rounded-full border-2 border-gray-500" />
                    }
                    Complete
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