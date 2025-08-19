'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAccount, useBalance, useSwitchChain, useChainId, usePublicClient } from 'wagmi';
import { useFundWallet, useSendTransaction, useWallets, usePrivy } from '@privy-io/react-auth';
import { formatUnits, parseEther, parseUnits, isAddress, encodeFunctionData } from 'viem';
import { base, bsc, scroll, celo, arbitrum, polygon, optimism, mainnet } from 'viem/chains';
import { Copy, Eye, EyeOff, Download, Send, Plus, Wallet, ArrowUpDown, ExternalLink, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { stablecoins } from '@/data/stablecoins';

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

export default function WalletModal({ isOpen, onClose, defaultTab = 'overview' }: WalletModalProps) {
  const { wallets } = useWallets();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const { fundWallet } = useFundWallet();
  const { sendTransaction } = useSendTransaction();
  const { exportWallet } = usePrivy();

  const [activeTab, setActiveTab] = useState<'overview' | 'send' | 'receive' | 'settings'>(defaultTab);
  const [activeChain, setActiveChain] = useState<typeof base | typeof bsc | typeof arbitrum | typeof polygon | typeof optimism | typeof mainnet | typeof scroll | typeof celo>(base); 
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fund states
  const [fundAmount, setFundAmount] = useState('');
  const [fundAsset, setFundAsset] = useState<'native-currency' | 'USDC'>('USDC');
  
  // Send states
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [isValidAddress, setIsValidAddress] = useState(false);
  
  // Export states
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const isPrivyEmbedded = wallets?.[0]?.walletClientType.toLowerCase() === 'privy';
  const SUPPORTED = isPrivyEmbedded ? [base, bsc, arbitrum, polygon, optimism, mainnet] : [base, bsc, scroll, celo, arbitrum, polygon, optimism, mainnet];

  // Use Wagmi's useBalance for native token
  const { data: nativeBalance, refetch: refetchNativeBalance } = useBalance({
    address,
    chainId: activeChain.id,
  });

  // Set active chain when chainId changes
  useEffect(() => {
    if (chainId) {
      const chain = SUPPORTED.find(c => c.id === chainId);
      if (chain) {
        setActiveChain(chain);
      } else {
        console.warn(`Chain with ID ${chainId} not found in supported chains`);
        setActiveChain(base);
      }
    }
  }, [chainId, SUPPORTED]);

  // Reset tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Validate recipient address
  useEffect(() => {
    setIsValidAddress(sendTo ? isAddress(sendTo) : false);
  }, [sendTo]);

  // Initialize selected token when balances load
  useEffect(() => {
    if (balances.length > 0 && !selectedToken) {
      const nativeToken = balances.find(b => b.isNative);
      setSelectedToken(nativeToken || balances[0]);
    }
  }, [balances, selectedToken]);

  // Get relevant stablecoins for active chain
  const relevantTokens = useMemo(() => {
    return stablecoins.filter(
      sc => sc.chainIds.includes(activeChain.id) && sc.addresses[activeChain.id as keyof typeof sc.addresses]
    );
  }, [activeChain.id]);

  // Load token balances
  const loadTokenBalances = async () => {
    if (!address || !isOpen) return;
    
    try {
      const tokenBalances: TokenBalance[] = [];
      
      // Add native token balance
      if (nativeBalance && nativeBalance.value > 0n) {
        const formatted = parseFloat(formatUnits(nativeBalance.value, nativeBalance.decimals));
        tokenBalances.push({
          symbol: nativeBalance.symbol,
          balance: formatted.toFixed(6),
          usd: (formatted * 2000).toFixed(2), // Mock price
          decimals: nativeBalance.decimals,
          isNative: true
        });
      }

      // Add stablecoin balances
      for (const token of relevantTokens) {
        try {
          const decimals = typeof token.decimals === 'object' 
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

  // Load balances when relevant data changes
  useEffect(() => {
    if (!isOpen || !address) return;
    
    setIsLoading(true);
    loadTokenBalances()
      .finally(() => setIsLoading(false));
  }, [isOpen, address, activeChain, nativeBalance, relevantTokens]);

  // Refetch native balance when chain changes
  useEffect(() => {
    if (isOpen && address) {
      refetchNativeBalance();
    }
  }, [activeChain, isOpen, address, refetchNativeBalance]);

  /* ---------- Switch Chain ---------- */
  const switchChain = async (chain: any) => {
    try {
      setIsLoading(true);
      if (switchChainAsync) {
        await switchChainAsync({ chainId: chain.id });
      }
      setActiveChain(chain);
      toast.success(`Switched to ${chain.name}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to switch chain');
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------- Export Private Key ---------- */
  const handleExportWallet = async () => {
    if (!address) return toast.error('No wallet connected');
    
    try {
      setIsExporting(true);
      const exported = await exportWallet({ address });
      // setPrivateKey(exported || '');
      toast.success('Private key exported successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to export wallet');
    } finally {
      setIsExporting(false);
    }
  };

  /* ---------- Copy to Clipboard ---------- */
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  /* ---------- Fund Wallet ---------- */
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

  /* ---------- Send Transaction ---------- */
  const handleSend = async () => {
    if (!sendTo || !sendAmount || !isValidAddress || !selectedToken) {
      return toast.error('Please fill all fields correctly');
    }

    try {
      setIsLoading(true);
      
      if (selectedToken.isNative) {
        // Send native token
        const { hash } = await sendTransaction({ 
          to: sendTo as `0x${string}`, 
          value: parseEther(sendAmount) 
        });
        toast.success(`Transaction sent: ${hash.slice(0, 10)}...`);
      } else {
        // Send ERC20 token
        const amount = parseUnits(sendAmount, selectedToken.decimals);
        const data = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [sendTo as `0x${string}`, amount]
        });
        
        const { hash } = await sendTransaction({
          to: selectedToken.address as `0x${string}`,
          data,
        });
        toast.success(`Token transfer sent: ${hash.slice(0, 10)}...`);
      }
      
      // Reset form
      setSendTo('');
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
                    {formatAddress(address)}
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
            
            {/* Chain Switcher */}
            <div className="flex flex-wrap gap-2 mt-4">
              {SUPPORTED.map((c) => (
                <button
                  key={c.id}
                  onClick={() => switchChain(c)}
                  disabled={isLoading}
                  className={`px-1 py-1 text-sm rounded-lg transition font-medium ${
                    activeChain.id === c.id
                      ? 'bg-white text-blue-600 shadow-lg dark:bg-gray-800 dark:text-blue-400'
                      : 'bg-white/20 text-white hover:bg-white/30 dark:bg-gray-700/50 dark:hover:bg-gray-700'
                  } disabled:opacity-50`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Navigation */}
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

          {/* Tab Content */}
          <div className="p-6 min-h-[400px] max-h-[500px] overflow-y-auto">
            {activeTab === 'overview' && (
              <div className="space-y-2 md:space-y-6">
                {/* Balances */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Your Assets</h3>
                  {isLoading && balances.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
                      <p className="text-gray-500 dark:text-gray-400 mt-2">Loading balances...</p>
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
                
                {/* Token Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Token</label>
                  <select
                    value={selectedToken ? `${selectedToken.symbol}-${selectedToken.isNative}` : ''}
                    onChange={(e) => {
                      const [symbol, isNative] = e.target.value.split('-');
                      const token = balances.find(b => b.symbol === symbol && b.isNative === (isNative === 'true'));
                      setSelectedToken(token || null);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-800"
                  >
                    <option value="">Select a token</option>
                    {balances.map((balance, index) => (
                      <option key={`${balance.symbol}-${index}`} value={`${balance.symbol}-${balance.isNative}`}>
                        {balance.symbol} ({balance.balance} available)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Recipient */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recipient Address</label>
                  <input
                    type="text"
                    value={sendTo}
                    onChange={(e) => setSendTo(e.target.value)}
                    placeholder="0x..."
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-800 ${
                      sendTo && !isValidAddress 
                        ? 'border-red-300 bg-red-50 dark:border-red-500 dark:bg-red-900/20' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {sendTo && !isValidAddress && (
                    <p className="text-red-500 text-sm mt-1">Invalid address format</p>
                  )}
                </div>

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
                  disabled={!sendTo || !sendAmount || !isValidAddress || !selectedToken || isLoading}
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
                    <select
                      value={fundAsset}
                      onChange={(e) => setFundAsset(e.target.value as any)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-800"
                    >
                      <option value="native-currency">{activeChain.nativeCurrency.symbol}</option>
                      <option value="USDC">USDC</option>
                    </select>
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