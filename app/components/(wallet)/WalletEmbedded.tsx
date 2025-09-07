'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAccount, useBalance, useSwitchChain, useChainId, usePublicClient } from 'wagmi';
import { useFundWallet, useSendTransaction, useWallets, usePrivy } from '@privy-io/react-auth';
import { formatUnits, parseEther, parseUnits, isAddress, encodeFunctionData } from 'viem';
import { base, bsc, scroll, celo, arbitrum, polygon, optimism, mainnet } from 'viem/chains';
import { Copy, Eye, EyeOff, Download, Send, Plus, Wallet, ArrowUpDown, ExternalLink, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { stablecoins } from '@/data/stablecoins';
import { resolveName } from '@/utils/ensUtils';
import EnsAddressInput from '@/components/(wallet)/EnsAddressInput';

const ERC20_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  }
] as const;

interface TokenBalance {
  symbol: string;
  balance: string;
  usd: string;
  address?: string;
  decimals: number;
  isNative?: boolean;
}

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'overview' | 'send' | 'receive' | 'settings';
}

// Mock prices for native tokens (in a real app, use an API)
const NATIVE_TOKEN_PRICES: Record<number, number> = {
  [mainnet.id]: 2000, // ETH
  [base.id]: 0.0005, // BASE (example)
  [bsc.id]: 300, // BNB
  [scroll.id]: 0.0004, // ETH (example)
  [celo.id]: 0.5, // CELO
  [arbitrum.id]: 0.001, // ETH (example)
  [polygon.id]: 0.7, // MATIC
  [optimism.id]: 0.0006, // ETH (example)
};

// Chain data with future icon support
const CHAIN_DATA = {
  [mainnet.id]: { ...mainnet, icon: null },
  [base.id]: { ...base, icon: null },
  [bsc.id]: { ...bsc, icon: null },
  [scroll.id]: { ...scroll, icon: null },
  [celo.id]: { ...celo, icon: null },
  [arbitrum.id]: { ...arbitrum, icon: null },
  [polygon.id]: { ...polygon, icon: null },
  [optimism.id]: { ...optimism, icon: null },
};

export default function WalletModal({ isOpen, onClose, defaultTab = 'overview' }: WalletModalProps) {
  const { wallets } = useWallets();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const { fundWallet } = useFundWallet();
  const { sendTransaction } = useSendTransaction();
  const { exportWallet, user } = usePrivy();

  const [activeTab, setActiveTab] = useState<'overview' | 'send' | 'receive' | 'settings'>(defaultTab);
  const [activeChain, setActiveChain] = useState<any>(base);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);

  // Fund states
  const [fundAmount, setFundAmount] = useState('');
  const [fundAsset, setFundAsset] = useState<'native-currency' | 'USDC'>('USDC');

  // Send states (updated to support ENS)
  const [sendToRaw, setSendToRaw] = useState(''); // user input (ENS or address)
  const [sendToResolved, setSendToResolved] = useState<`0x${string}` | null>(null); // validated address
  const [sendAmount, setSendAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);

  // Export states
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const isPrivyEmbedded = wallets?.[0]?.walletClientType.toLowerCase() === 'privy';
  const SUPPORTED_CHAINS = [base, bsc, scroll, celo, arbitrum, polygon, optimism, mainnet];

  // ENS display for your own address (unchanged)
  const [ensName, setEnsName] = useState<string | null>(null);
  useEffect(() => {
    const resolveEnsName = async () => {
      if (!address) return;
      try {
        const name = await resolveName({ address: address as `0x${string}` });
        setEnsName(name);
      } catch {
        setEnsName(null);
      }
    };
    resolveEnsName();
  }, [address]);

  // native token balance
  const { data: nativeBalance, refetch: refetchNativeBalance } = useBalance({
    address,
    chainId: activeChain.id,
  });

  useEffect(() => {
    if (chainId) {
      const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
      if (chain) setActiveChain(chain);
      else setActiveChain(base);
    }
  }, [chainId]);

  useEffect(() => {
    if (isOpen) setActiveTab(defaultTab);
  }, [isOpen, defaultTab]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // when balances first load, pick a default token
  useEffect(() => {
    if (balances.length > 0 && !selectedToken) {
      const nativeToken = balances.find((b) => b.isNative);
      setSelectedToken(nativeToken || balances[0]);
    }
  }, [balances, selectedToken]);

  const relevantTokens = useMemo(() => {
    return stablecoins.filter(
      (sc) => sc.chainIds.includes(activeChain.id) && sc.addresses[activeChain.id as keyof typeof sc.addresses]
    );
  }, [activeChain.id]);

  const loadTokenBalances = async () => {
    if (!address || !isOpen) return;
    try {
      const tokenBalances: TokenBalance[] = [];

      if (nativeBalance) {
        const formatted = parseFloat(formatUnits(nativeBalance.value, nativeBalance.decimals));
        const price = NATIVE_TOKEN_PRICES[activeChain.id] || 1;
        tokenBalances.push({
          symbol: nativeBalance.symbol,
          balance: formatted.toFixed(6),
          usd: (formatted * price).toFixed(2),
          decimals: nativeBalance.decimals,
          isNative: true
        });
      }

      for (const token of relevantTokens) {
        try {
          const decimals =
            typeof token.decimals === 'object'
              ? (token.decimals as any)[activeChain.id] ?? 6
              : token.decimals;

          const balance = await publicClient?.readContract({
            address: token.addresses[activeChain.id as keyof typeof token.addresses] as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address as `0x${string}`],
          });

          if (balance) {
            const formatted = parseFloat(formatUnits(balance as bigint, decimals));
            if (formatted > 0) {
              tokenBalances.push({
                symbol: token.baseToken,
                balance: formatted.toFixed(6),
                usd: (formatted * 1).toFixed(2),
                address: token.addresses[activeChain.id as keyof typeof token.addresses],
                decimals,
                isNative: false
              });
            }
          }
        } catch (error) {
          console.error(`Error loading ${token.baseToken} balance:`, error);
        }
      }

      setBalances(tokenBalances);
    } catch (error) {
      console.error('Error loading balances:', error);
      toast.error('Failed to load balances');
    }
  };

  useEffect(() => {
    if (!isOpen || !address) return;
    setIsLoading(true);
    loadTokenBalances().finally(() => setIsLoading(false));
  }, [isOpen, address, activeChain, nativeBalance, relevantTokens]);

  useEffect(() => {
    if (isOpen && address) refetchNativeBalance();
  }, [activeChain, isOpen, address, refetchNativeBalance]);

  const switchChain = async (chain: any) => {
    try {
      setIsSwitchingChain(true);
      setIsLoading(true);
      setIsChainDropdownOpen(false);
      if (switchChainAsync) await switchChainAsync({ chainId: chain.id });
      setActiveChain(chain);
      setBalances([]);
      toast.success(`Switched to ${chain.name}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to switch chain');
    } finally {
      setIsSwitchingChain(false);
      setIsLoading(false);
    }
  };

  const handleExportWallet = async () => {
    if (!address) return toast.error('No wallet connected');
    try {
      setIsExporting(true);
      await exportWallet({ address });
      toast.success('Private key exported successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to export wallet');
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleFund = async () => {
    if (!address || !fundAmount) return toast.error('Missing amount');
    try {
      setIsLoading(true);
      await fundWallet(address, {
        chain: activeChain,
        amount: fundAmount,
        asset: fundAsset
      });
      toast.success('Funding flow opened');
      setFundAmount('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to initiate funding');
    } finally {
      setIsLoading(false);
    }
  };

  // --- SEND (updated to use resolved address) ---
  const isValidRecipient = !!sendToResolved && isAddress(sendToResolved);

  const handleSend = async () => {
    if (!isValidRecipient || !sendAmount || !selectedToken) {
      return toast.error('Please fill all fields correctly');
    }

    try {
      setIsLoading(true);
      const to = sendToResolved as `0x${string}`;

      if (selectedToken.isNative) {
        const { hash } = await sendTransaction({
          to,
          value: parseEther(sendAmount)
        });
        toast.success(`Transaction sent: ${hash.slice(0, 10)}...`);
      } else {
        const amount = parseUnits(sendAmount, selectedToken.decimals);
        const data = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [to, amount]
        });

        const { hash } = await sendTransaction({
          to: selectedToken.address as `0x${string}`,
          data,
        });
        toast.success(`Token transfer sent: ${hash.slice(0, 10)}...`);
      }

      setSendToRaw('');
      setSendToResolved(null);
      setSendAmount('');
    } catch (e: any) {
      toast.error(e.message || 'Transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="h-6 w-6" />
                <h2 className="text-xl font-bold">Wallet</h2>
              </div>
              <div className="flex items-center gap-4">
                {address && (
                  <div className="text-sm opacity-90">
                    {ensName || formatAddress(address)}
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Chain Switcher - Professional Dropdown */}
            <div className="mt-4 relative">
              <button
                onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
                disabled={isSwitchingChain || isLoading}
                className="w-full bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-2 flex items-center justify-between transition-all duration-200 disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  {isSwitchingChain ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-1" />
                  ) : (
                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">
                      {activeChain.name[0]}
                    </div>
                  )}
                  <span className="font-medium">
                    {isSwitchingChain ? 'Switching...' : activeChain.name}
                  </span>
                </div>
                <ChevronDown 
                  className={`h-4 w-4 transition-transform ${isChainDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>

              {isChainDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {SUPPORTED_CHAINS.map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => switchChain(chain)}
                      className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                        activeChain.id === chain.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {/* Placeholder for chain icons - you can add them later */}
                      <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {chain.name[0]}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{chain.name}</div>
                        <div className="text-xs opacity-70">Chain ID: {chain.id}</div>
                      </div>
                      {activeChain.id === chain.id && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b dark:border-gray-700">
            {[
              { id: 'overview', label: 'Overview', icon: Wallet },
              { id: 'send', label: 'Send', icon: Send },
              { id: 'receive', label: 'Receive', icon: Download },
              { id: 'settings', label: 'Settings', icon: ArrowUpDown }
            ].map(({ id, label, icon: Icon}) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex-1 flex items-center justify-center gap-1 p-2 text-sm font-medium transition ${
                  activeTab === id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-400'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 min-h-[400px] max-h-[500px] overflow-y-auto">
            {activeTab === 'overview' && (
              <div className="space-y-2 md:space-y-6">
                {/* Balances */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Your Assets</h3>
                  {isLoading || isSwitchingChain ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
                      <p className="text-gray-500 dark:text-gray-400 mt-2">
                        {isSwitchingChain ? 'Switching chain...' : 'Loading balances...'}
                      </p>
                    </div>
                  ) : balances.length > 0 ? (
                    <div className="space-y-3">
                      {balances.map((balance, index) => (
                        <div key={`${balance.symbol}-${index}`}
                             className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/70 transition">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                              {balance.symbol[0]}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">{balance.symbol}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {balance.isNative ? 'Native Token' : 'ERC-20'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900 dark:text-white">{balance.balance}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">≈ ${balance.usd}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Wallet className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No supported tokens found on {activeChain.name}</p>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setActiveTab('send')}
                    className="flex items-center justify-center gap-2 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition font-medium"
                  >
                    <Send className="h-4 w-4" />
                    Send
                  </button>
                  <button
                    onClick={() => setActiveTab('receive')}
                    className="flex items-center justify-center gap-2 p-4 bg-green-600 hover:bg-green-700 text-white rounded-xl transition font-medium"
                  >
                    <Download className="h-4 w-4" />
                    Receive
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'send' && (
              <div className="space-y-2 md:space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Send Tokens</h3>

                {/* Token Selection - Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Token</label>
                  <div className="relative">
                    <select
                      value={selectedToken ? `${selectedToken.symbol}-${selectedToken.isNative}` : ''}
                      onChange={(e) => {
                        const [symbol, isNative] = e.target.value.split('-');
                        const token = balances.find(b => b.symbol === symbol && b.isNative === (isNative === 'true'));
                        setSelectedToken(token || null);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-800 appearance-none"
                    >
                      <option value="">Select a token</option>
                      {balances.map((balance, index) => (
                        <option key={`${balance.symbol}-${index}`} value={`${balance.symbol}-${balance.isNative}`}>
                          {balance.symbol} ({balance.balance} available)
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Recipient (ENS or Address) */}
                <EnsAddressInput
                  value={sendToRaw}
                  onChange={setSendToRaw}
                  onResolved={setSendToResolved}
                  label="Recipient (ENS or Address)"
                  placeholder="vitalik.eth or 0x..."
                />

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                  <input
                    type="number"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder={selectedToken ? `Amount in ${selectedToken.symbol}` : '0.0'}
                    step="any"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-800"
                  />
                  {selectedToken && (
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <span>Available: {selectedToken.balance} {selectedToken.symbol}</span>
                      <button
                        onClick={() => setSendAmount(selectedToken.balance)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      >
                        Max
                      </button>
                    </div>
                  )}
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSend}
                  disabled={!isValidRecipient || !sendAmount || !selectedToken || isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Transaction
                    </>
                  )}
                </button>
              </div>
            )}

            {activeTab === 'receive' && (
              <div className="space-y-2 md:space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Receive Tokens</h3>

                {/* Address Display */}
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-xl">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Your Wallet Address</div>
                    <div className="font-mono text-sm text-gray-900 dark:text-white break-all mb-2">
                      {address}
                    </div>
                    <button
                      onClick={() => address && copyToClipboard(address, 'Address')}
                      className="flex items-center justify-center gap-2 mx-auto p-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Address
                    </button>
                  </div>
                </div>

                {/* Fund Wallet */}
                <div className="border-t dark:border-gray-700 pt-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Fund Your Wallet</h4>
                  <div className="space-y-4">
                    <input
                      type="number"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      placeholder="Amount"
                      step="any"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-800"
                    />
                    
                    {/* Asset Selection Dropdown */}
                    <div className="relative">
                      <select
                        value={fundAsset}
                        onChange={(e) => setFundAsset(e.target.value as any)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-800 appearance-none"
                      >
                        <option value="native-currency">{activeChain.nativeCurrency.symbol}</option>
                        <option value="USDC">USDC</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    
                    <button
                      onClick={handleFund}
                      disabled={!fundAmount || isLoading}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Fund Wallet
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-1 md:space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Wallet Settings</h3>

                {/* Privy dashboard */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Advanced Wallet Management</h4>
                  <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
                    For more advanced wallet features, transaction history, and additional tokens,
                    visit your Privy dashboard.
                  </p>
                  <a
                    href="https://home.privy.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
                  >
                    Open Privy Dashboard
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {user && (user as any).email && (
                    <p className="text-blue-600 dark:text-blue-400 text-xs mt-2">
                      Login with: {(user as any).email.address}
                    </p>
                  )}
                </div>

                {/* Export Private Key */}
                <div className="border border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="text-yellow-600 dark:text-yellow-500 text-xl">⚠️</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Export Private Key</h4>
                      <p className="text-yellow-700 dark:text-yellow-400 text-sm mb-4">
                        Your private key gives full access to your wallet. Never share it with anyone and store it securely.
                      </p>

                      {!privateKey ? (
                        <button
                          onClick={handleExportWallet}
                          disabled={isExporting || !address}
                          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition disabled:opacity-50"
                        >
                          {isExporting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Exporting...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              Export Private Key
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Private Key</span>
                              <button
                                onClick={() => setShowPrivateKey(!showPrivateKey)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                              >
                                {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                            <div className="font-mono text-sm text-gray-900 dark:text-white break-all">
                              {showPrivateKey ? privateKey : '•'.repeat(64)}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => copyToClipboard(privateKey, 'Private key')}
                              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
                            >
                              <Copy className="h-3 w-3" />
                              Copy
                            </button>
                            <button
                              onClick={() => {
                                setPrivateKey('');
                                setShowPrivateKey(false);
                              }}
                              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition text-sm"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Network Info */}
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Network Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Network:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{activeChain.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Chain ID:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{activeChain.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Currency:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{activeChain.nativeCurrency.symbol}</span>
                    </div>
                    {activeChain.blockExplorers?.default && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Explorer:</span>
                        <a
                          href={`${activeChain.blockExplorers.default.url}/address/${address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          View on Explorer
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}