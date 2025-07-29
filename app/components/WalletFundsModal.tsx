"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePrivy, useWallets, useFundWallet, useSendTransaction } from '@privy-io/react-auth';
import { formatEther, parseEther, isAddress, formatUnits, parseUnits, encodeFunctionData, Chain } from 'viem';
import { base, bsc, scroll } from 'viem/chains';
import toast from 'react-hot-toast';
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ActionButtons,
  Button,
  TokenCard,
  TokenIcon,
  WarningBox,
  Input,
  MaxButton,
  SuccessIcon,
  CloseButton
} from './WalletFundsModalStyles';
import { stablecoins } from '../data/stablecoins';

// Define supported chains
const SUPPORTED_CHAINS: Record<number, Chain> = {
  [base.id]: base,
  [bsc.id]: bsc,
  [scroll.id]: scroll,
};

interface WalletFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress?: string;
}

interface Token {
  symbol: string;
  decimals: number;
  type: string;
  address?: string;
  flag?: string;
  currency?: string;
}

interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
  contractAddress?: string;
  usdValue: number;
  flag?: string;
  currency?: string;
}

interface ExchangeRates {
  [currency: string]: number;
}

const erc20BalanceOfAbi = [{
  "constant": true,
  "inputs": [{ "name": "_owner", "type": "address" }],
  "name": "balanceOf",
  "outputs": [{ "name": "balance", "type": "uint256" }],
  "type": "function"
}];

const erc20TransferAbi = [{
  "constant": false,
  "inputs": [
    { "name": "_to", "type": "address" },
    { "name": "_value", "type": "uint256" }
  ],
  "name": "transfer",
  "outputs": [{ "name": "", "type": "bool" }],
  "type": "function"
}];

const WalletFundsModal: React.FC<WalletFundsModalProps> = ({
  isOpen,
  onClose,
  walletAddress
}) => {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const [fundAmount, setFundAmount] = useState('0.01');
  const { fundWallet } = useFundWallet({
    onUserExited: (data) => {
      console.log('Funding flow exited:', data);
      if (data.balance) {
        toast.success('Funding completed! Refreshing balances...');
        setTimeout(() => {
          fetchBalances();
        }, 2000);
      }
    }
  });
  const { exportWallet } = usePrivy();
  const { sendTransaction } = useSendTransaction({
    onSuccess: (data) => {
      console.log('Transaction successful:', data);
      toast.success(`Transfer successful! TX: ${data.hash}`);
      setStep('confirm');
      setTimeout(() => {
        fetchBalances();
      }, 2000);
    },
    onError: (error) => {
      console.error('Transaction failed:', error);
      toast.error(error || 'Transfer failed');
      setIsTransferring(false);
    }
  });

  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [step, setStep] = useState<'select' | 'transfer' | 'confirm' | 'export'>('select');
  const [gasEstimate, setGasEstimate] = useState<string>('');
  const [isValidAddress, setIsValidAddress] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({ USD: 1 });
  const [currentChain, setCurrentChain] = useState<Chain>(base);

  const embeddedWallet = wallets.find(wallet => 
    wallet.walletClientType === 'privy' && wallet.address === walletAddress
  );

  // Fetch exchange rates from API
  const fetchExchangeRates = useCallback(async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      const filteredRates: ExchangeRates = {
        USD: 1,
        EUR: data.rates.EUR || 1,
        GBP: data.rates.GBP || 1,
        TZS: data.rates.TZS || 1,
        NGN: data.rates.NGN || 1,
        ZAR: data.rates.ZAR || 1,
        IDR: data.rates.IDR || 1,
        CAD: data.rates.CAD || 1,
        BRL: data.rates.BRL || 1,
        TRY: data.rates.TRY || 1,
        NZD: data.rates.NZD || 1,
        MXN: data.rates.MXN || 1,
      };
      setExchangeRates(filteredRates);
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      setExchangeRates({ USD: 1 });
    }
  }, []);

  // Convert token balance to USD
  const convertToUSD = (balance: number, currency: string): number => {
    if (!exchangeRates[currency]) return balance;
    const usdAmount = balance / exchangeRates[currency];
    return usdAmount;
  };

  const fetchBalances = useCallback(async () => {
    if (!walletAddress || !embeddedWallet) return;
    
    setIsLoading(true);
    try {
      const provider = await embeddedWallet.getEthereumProvider();
      const chainId = await provider.request({ method: 'eth_chainId' });
      const currentChain = SUPPORTED_CHAINS[parseInt(chainId, 16)] || base;
      setCurrentChain(currentChain);

      const tokens: Token[] = [
        { 
          symbol: currentChain.nativeCurrency.symbol, 
          decimals: currentChain.nativeCurrency.decimals, 
          type: 'native', 
          currency: 'USD' 
        },
        ...stablecoins
          .filter(sc => sc.chainIds.includes(currentChain.id))
          .map(sc => ({
            symbol: sc.baseToken,
            address: sc.addresses[currentChain.id as keyof typeof sc.addresses],
            decimals: typeof sc.decimals === 'number' 
              ? sc.decimals 
              : sc.decimals?.[currentChain.id as keyof typeof sc.decimals] || 18,
            type: 'erc20',
            flag: sc.flag,
            currency: sc.currency || 'USD'
          }))
      ];

      // Batch eth_call requests for ERC20 tokens
      const erc20Tokens = tokens.filter(t => t.type === 'erc20' && t.address);
      const nativeBalancePromise = provider.request({
        method: 'eth_getBalance',
        params: [walletAddress, 'latest']
      });

      const erc20BalancePromises = erc20Tokens.map(token => {
        const data = encodeFunctionData({
          abi: erc20BalanceOfAbi,
          functionName: 'balanceOf',
          args: [walletAddress]
        });
        return provider.request({
          method: 'eth_call',
          params: [{ to: token.address!, data }, 'latest']
        }).catch(error => {
          console.error(`Error fetching balance for ${token.symbol}:`, error);
          return '0';
        });
      });

      const [nativeBalanceHex, ...erc20BalanceHexes] = await Promise.all([
        nativeBalancePromise,
        ...erc20BalancePromises
      ]);

      const tokenBalances = tokens.map((token, index) => {
        const balanceHex = token.type === 'native' 
          ? nativeBalanceHex 
          : erc20BalanceHexes[index - 1];
        const balance = BigInt(balanceHex || '0');
        const formattedBalance = formatUnits(balance, token.decimals);
        const balanceNumber = parseFloat(formattedBalance);
        const usdValue = token.currency 
          ? convertToUSD(balanceNumber, token.currency) 
          : balanceNumber;
          
        return {
          symbol: token.symbol,
          balance: formattedBalance,
          decimals: token.decimals,
          contractAddress: token.type === 'erc20' ? token.address : undefined,
          usdValue,
          flag: token.flag,
          currency: token.currency
        };
      });

      setBalances(tokenBalances);
      if (tokenBalances.length > 0 && !selectedToken) {
        setSelectedToken(tokenBalances[0]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, embeddedWallet, exchangeRates, selectedToken]);

  const handleFundWallet = async () => {
    try {
      if (!walletAddress) {
        toast.error('Wallet address not found');
        return;
      }
      
      // Convert to number and validate
      const amountNum = parseFloat(fundAmount);
      if (isNaN(amountNum)) {
        toast.error('Please enter a valid amount');
        return;
      }
      
      await fundWallet(walletAddress, {
        chain: currentChain,
        amount: fundAmount
      });
    } catch (error) {
      console.error('Error opening funding modal:', error);
      toast.error('Failed to open funding flow');
    }
  };

  const handleExportWallet = async () => {
    try {
      if (!embeddedWallet) {
        toast.error('Wallet not found');
        return;
      }
      const confirmExport = window.confirm(
        'Are you sure you want to export your private key? This will reveal sensitive information that should be kept secure.'
      );
      if (!confirmExport) return;
      await exportWallet({ address: embeddedWallet.address });
    } catch (error) {
      console.error('Error exporting wallet:', error);
      toast.error('Failed to export wallet');
    }
  };

  const estimateGas = useCallback(async () => {
    if (!embeddedWallet || !recipientAddress || !amount || !selectedToken || !isValidAddress) return;
    try {
      const provider = await embeddedWallet.getEthereumProvider();
      const gasPrice = await provider.request({ method: 'eth_gasPrice', params: [] });
      let gasLimit;
      
      if (selectedToken.symbol === currentChain.nativeCurrency.symbol) {
        gasLimit = await provider.request({
          method: 'eth_estimateGas',
          params: [{
            from: walletAddress,
            to: recipientAddress,
            value: `0x${parseEther(amount).toString(16)}`
          }]
        });
      } else {
        const amountWei = parseUnits(amount, selectedToken.decimals);
        const transferData = encodeFunctionData({
          abi: erc20TransferAbi,
          functionName: 'transfer',
          args: [recipientAddress, amountWei]
        });
        gasLimit = await provider.request({
          method: 'eth_estimateGas',
          params: [{
            from: walletAddress,
            to: selectedToken.contractAddress,
            data: transferData
          }]
        });
      }
      const totalGas = BigInt(gasPrice) * BigInt(gasLimit);
      setGasEstimate(formatEther(totalGas));
    } catch (error) {
      console.error('Gas estimation failed:', error);
      setGasEstimate('0.001');
    }
  }, [embeddedWallet, recipientAddress, amount, selectedToken, isValidAddress, walletAddress, currentChain]);

  const executeTransfer = async () => {
    if (!embeddedWallet || !recipientAddress || !amount || !selectedToken) {
      toast.error('Missing required information');
      return;
    }
    
    const nativeToken = currentChain.nativeCurrency.symbol;
    const nativeTokenBalance = balances.find(b => b.symbol === nativeToken)?.balance || '0';
    const estimatedGas = parseFloat(gasEstimate || '0.001');
    
    let isInsufficient = false;
    let insufficientMessage = '';
    
    if (selectedToken.symbol === nativeToken) {
      const totalCost = parseFloat(amount) + estimatedGas;
      if (parseFloat(selectedToken.balance) < totalCost) {
        isInsufficient = true;
        insufficientMessage = `Insufficient ${nativeToken} for transfer and gas`;
      }
    } else {
      if (parseFloat(selectedToken.balance) < parseFloat(amount)) {
        isInsufficient = true;
        insufficientMessage = `Insufficient ${selectedToken.symbol} balance`;
      } else if (parseFloat(nativeTokenBalance) < estimatedGas) {
        isInsufficient = true;
        insufficientMessage = `Insufficient ${nativeToken} for gas`;
      }
    }
    
    if (isInsufficient) {
      toast.error(insufficientMessage);
      if (selectedToken.symbol === nativeToken || 
          (selectedToken.symbol !== nativeToken && parseFloat(nativeTokenBalance) < estimatedGas)) {
        const suggestedAmount = (estimatedGas + 0.001).toFixed(4);
        const fundAndRetry = window.confirm(
          `You need more ${nativeToken} to complete this transaction. Would you like to fund your wallet with ${suggestedAmount} ${nativeToken}?`
        );
        if (fundAndRetry) {
          try {
            await fundWallet(walletAddress!, { 
              chain: currentChain, 
              amount: suggestedAmount 
            });
          } catch (error) {
            console.error('Error opening funding modal:', error);
            toast.error('Failed to open funding flow');
          }
        }
      }
      return;
    }
    
    setIsTransferring(true);
    try {
      if (selectedToken.symbol === currentChain.nativeCurrency.symbol) {
        await sendTransaction({
          to: recipientAddress,
          value: parseEther(amount),
          chainId: currentChain.id,
        });
      } else {
        const amountWei = parseUnits(amount, selectedToken.decimals);
        const transferData = encodeFunctionData({
          abi: erc20TransferAbi,
          functionName: 'transfer',
          args: [recipientAddress, amountWei]
        });
        await sendTransaction({
          to: selectedToken.contractAddress!,
          data: transferData,
          chainId: currentChain.id,
        });
      }
    } catch (error: any) {
      console.error('Transfer failed:', error);
      toast.error(error.message || 'Transfer failed');
      setIsTransferring(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  useEffect(() => {
    setIsValidAddress(recipientAddress ? isAddress(recipientAddress) : false);
  }, [recipientAddress]);

  useEffect(() => {
    if (isOpen && walletAddress) {
      fetchExchangeRates();
      fetchBalances();
    }
  }, [isOpen, walletAddress, fetchBalances]);

  useEffect(() => {
    if (step === 'transfer' && amount && recipientAddress && isValidAddress) {
      const timer = setTimeout(() => estimateGas(), 500);
      return () => clearTimeout(timer);
    }
  }, [step, amount, recipientAddress, isValidAddress, estimateGas]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const totalBalance = balances.reduce((sum, token) => sum + (token.usdValue || 0), 0);
  const maxWithdrawable = selectedToken ? 
    (selectedToken.symbol === currentChain.nativeCurrency.symbol ? 
      Math.max(0, parseFloat(selectedToken.balance) - parseFloat(gasEstimate || '0.001')).toFixed(6) : 
      selectedToken.balance) : 
    '0';

  const getTokenIcon = (symbol: string) => {
    const colors = {
      'USDC': 'bg-blue-500',
      'cNGN': 'bg-purple-500',
      'ETH': 'bg-gray-700',
      'BNB': 'bg-yellow-500',
      'ETHW': 'bg-gray-500',
      'NGNC': 'bg-green-500',
      'ZARP': 'bg-yellow-500',
      'IDRX': 'bg-red-500',
      'EURC': 'bg-blue-600',
      'CADC': 'bg-red-600',
      'BRL': 'bg-green-600',
      'TRYB': 'bg-orange-500',
      'NZDD': 'bg-black',
      'MXNe': 'bg-pink-500',
      'USDT': 'bg-green-500'
    };
    return colors[symbol as keyof typeof colors] || 'bg-gray-400';
  };

  const modalContent = (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>
            <h1>{currentChain.name} Wallet</h1>
            <div className="flex items-center mt-2 text-gray-500">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium truncate max-w-xs">{walletAddress}</span>
              <button className="ml-2 p-1 hover:bg-gray-100 rounded" onClick={() => copyToClipboard(walletAddress || '')}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <div className="text-4xl font-bold text-gray-900 mb-6">
            ${totalBalance.toFixed(8)}
          </div>

          {step === 'select' && (
            <>
              <ActionButtons>
                <Button
                  onClick={() => setStep('transfer')}
                  disabled={!selectedToken || parseFloat(selectedToken?.balance || '0') <= 0}
                  variant="secondary"
                >
                  Send
                </Button>
                <div className="flex">
                  <Input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="0.01"
                    step="0.001"
                    min="0.001"
                    className="mr-2"
                  />
                  <Button variant="primary" onClick={handleFundWallet}>
                    Fund Wallet
                  </Button>
                </div>
                <Button variant="secondary" onClick={() => setShowExportOptions(!showExportOptions)}>
                  Export Keys
                </Button>
              </ActionButtons>

              {showExportOptions && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">Export Private Key</p>
                      <p className="text-sm text-red-700 mt-1">
                        This will reveal your private key. Keep it safe and never share it with anyone.
                      </p>
                      <div className="mt-3 flex space-x-3">
                        <button onClick={handleExportWallet} className="text-sm font-medium text-red-800 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded">
                          Export Private Key
                        </button>
                        <button onClick={() => setShowExportOptions(false)} className="text-sm font-medium text-red-600 hover:text-red-700">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex mb-6 !border-b">
                <button className="text-[--text-primary] font-semibold pb-2 !border-b-2 !border-[--border-color] !mr-8">
                  Balances
                </button>
                <button className="text-[--text-secondary] font-semibold pb-2">
                  Transactions
                </button>
              </div>

              <div className="space-y-4 relative">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <svg className="animate-spin h-8 w-8 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
                {balances.length > 0 ? (
                  balances.map((token, index) => (
                    <TokenCard
                      key={index}
                      selected={selectedToken?.symbol === token.symbol}
                      onClick={() => setSelectedToken(token)}
                    >
                      <div className="flex items-center">
                        {token.flag && <span className="mr-2">{token.flag}</span>}
                        <TokenIcon color={getTokenIcon(token.symbol)}>
                          <span className="text-white font-bold text-sm">{token.symbol.slice(0, 2)}</span>
                        </TokenIcon>
                        <div>
                          <div className="font-semibold text-gray-900">{token.symbol}</div>
                          <div className="text-sm text-gray-500">{parseFloat(token.balance).toFixed(6)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">
                          ${token.usdValue.toFixed(4)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {token.currency || 'USD'}
                        </div>
                      </div>
                    </TokenCard>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No balances available
                  </div>
                )}
              </div>

              {selectedToken && selectedToken.symbol === currentChain.nativeCurrency.symbol && 
               parseFloat(selectedToken.balance) < 0.01 && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="red" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-amber-800">Low Balance</p>
                      <p className="text-sm text-amber-700 mt-1">
                        Your wallet has a low {currentChain.nativeCurrency.symbol} balance. Consider funding it to cover transaction fees.
                      </p>
                      <button onClick={handleFundWallet} className="mt-2 text-sm font-medium text-amber-800 hover:text-amber-900 underline">
                        Fund Wallet Now
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 'transfer' && selectedToken && (
            <div className="space-y-6 flex-1 flex flex-col">
              <button onClick={() => setStep('select')} className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Balances
              </button>

              <WarningBox>
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-800">Embedded Wallet Warning</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Make sure to withdraw your funds before losing access to your account.
                    </p>
                  </div>
                </div>
              </WarningBox>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Recipient Address
                </label>
                <Input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x1234..."
                  error={!!recipientAddress && !isValidAddress}
                />
                {recipientAddress && !isValidAddress && (
                  <p className="text-red-500 text-sm mt-2">Invalid address format</p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Amount ({selectedToken.symbol})
                  </label>
                  <button onClick={() => setAmount(maxWithdrawable)} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Max: {maxWithdrawable}
                  </button>
                </div>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.000001"
                  max={maxWithdrawable}
                />
              </div>

              {gasEstimate && amount && (
                <div className="bg-[--bg-secondary] rounded-2xl p-4 space-y-2">
                  {selectedToken.symbol === currentChain.nativeCurrency.symbol ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Network Fee:</span>
                        <span className="font-medium text-gray-900">{gasEstimate} {currentChain.nativeCurrency.symbol}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">You'll Send:</span>
                        <span className="font-medium text-gray-900">{amount} {currentChain.nativeCurrency.symbol}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-900">Total Cost:</span>
                          <span className="font-bold text-gray-900">
                            {(parseFloat(amount || '0') + parseFloat(gasEstimate)).toFixed(6)} {currentChain.nativeCurrency.symbol}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Transfer Amount:</span>
                        <span className="font-medium text-gray-900">{amount} {selectedToken.symbol}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Estimated Gas:</span>
                        <span className="font-medium text-gray-900">{gasEstimate} {currentChain.nativeCurrency.symbol}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              <Button
                onClick={executeTransfer}
                disabled={!isValidAddress || !amount || parseFloat(amount) <= 0 || isTransferring}
                variant="primary"
              >
                {isTransferring ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  `Send ${amount || '0'} ${selectedToken.symbol}`
                )}
              </Button>
            </div>
          )}

          {step === 'confirm' && (
            <div className="text-center space-y-6 py-8">
              <SuccessIcon>
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </SuccessIcon>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Transfer Complete!
                </h3>
                <p className="text-gray-600">
                  Your {selectedToken?.symbol} has been successfully sent to the recipient.
                </p>
              </div>
              <Button onClick={onClose} variant="primary">
                Done
              </Button>
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );

  const modalRoot = document.getElementById('modal-root');
  return modalRoot ? createPortal(modalContent, modalRoot) : modalContent;
};

export default WalletFundsModal;