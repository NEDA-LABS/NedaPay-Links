"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { formatEther, parseEther, isAddress } from 'viem';
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

interface WalletFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress?: string;
}

interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
  contractAddress?: string;
  usdValue?: number;
}

const WalletFundsModal: React.FC<WalletFundsModalProps> = ({
  isOpen,
  onClose,
  walletAddress
}) => {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [step, setStep] = useState<'select' | 'transfer' | 'confirm'>('select');
  const [gasEstimate, setGasEstimate] = useState<string>('');
  const [isValidAddress, setIsValidAddress] = useState(false);

  const embeddedWallet = wallets.find(wallet => 
    wallet.walletClientType === 'privy' && wallet.address === walletAddress
  );

  const fetchBalances = useCallback(async () => {
    if (!walletAddress || !embeddedWallet) return;

    setIsLoading(true);
    try {
      const provider = await embeddedWallet.getEthereumProvider();
      const ethBalance = await provider.request({
        method: 'eth_getBalance',
        params: [walletAddress, 'latest']
      });

      const ethBalanceFormatted = formatEther(BigInt(ethBalance));
      
      const tokenBalances: TokenBalance[] = [
        {
          symbol: 'ETH',
          balance: ethBalanceFormatted,
          decimals: 18,
          usdValue: 0
        }
      ];

      setBalances(tokenBalances);
      if (tokenBalances.length > 0) {
        setSelectedToken(tokenBalances[0]);
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
      toast.error('Failed to fetch wallet balances');
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, embeddedWallet]);

  const estimateGas = useCallback(async () => {
    if (!embeddedWallet || !recipientAddress || !amount || !selectedToken || !isValidAddress) {
      return;
    }

    try {
      const provider = await embeddedWallet.getEthereumProvider();
      const gasPrice = await provider.request({
        method: 'eth_gasPrice',
        params: []
      });

      const gasLimit = await provider.request({
        method: 'eth_estimateGas',
        params: [{
          from: walletAddress,
          to: recipientAddress,
          value: `0x${parseEther(amount).toString(16)}`
        }]
      });

      const totalGas = BigInt(gasPrice) * BigInt(gasLimit);
      setGasEstimate(formatEther(totalGas));
    } catch (error) {
      console.error('Gas estimation failed:', error);
      setGasEstimate('0.001');
    }
  }, [embeddedWallet, recipientAddress, amount, selectedToken, isValidAddress, walletAddress]);

  const executeTransfer = async () => {
    if (!embeddedWallet || !recipientAddress || !amount || !selectedToken) {
      toast.error('Missing required information');
      return;
    }

    setIsTransferring(true);
    try {
      const provider = await embeddedWallet.getEthereumProvider();
      
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletAddress,
          to: recipientAddress,
          value: `0x${parseEther(amount).toString(16)}`,
          gas: '0x5208'
        }]
      });

      toast.success(`Transfer successful! TX: ${txHash}`);
      setStep('confirm');
      
      setTimeout(() => {
        fetchBalances();
      }, 2000);

    } catch (error: any) {
      console.error('Transfer failed:', error);
      toast.error(error.message || 'Transfer failed');
    } finally {
      setIsTransferring(false);
    }
  };

  useEffect(() => {
    if (recipientAddress) {
      setIsValidAddress(isAddress(recipientAddress));
    } else {
      setIsValidAddress(false);
    }
  }, [recipientAddress]);

  useEffect(() => {
    if (isOpen && walletAddress) {
      fetchBalances();
    }
  }, [isOpen, walletAddress, fetchBalances]);

  useEffect(() => {
    if (step === 'transfer' && amount && recipientAddress && isValidAddress) {
      const timer = setTimeout(() => {
        estimateGas();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step, amount, recipientAddress, isValidAddress, estimateGas]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const totalBalance = balances.reduce((sum, token) => sum + (token.usdValue || 0), 0);
  const maxWithdrawable = selectedToken ? 
    (parseFloat(selectedToken.balance) - parseFloat(gasEstimate || '0.001')).toFixed(6) : 
    '0';

  const getTokenIcon = (symbol: string) => {
    const colors = {
      'USDC': 'bg-blue-500',
      'cNGN': 'bg-purple-500',
      'ETH': 'bg-gray-700'
    };
    return colors[symbol as keyof typeof colors] || 'bg-gray-400';
  };

  const modalContent = (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>
            <h1>Wallet</h1>
            <div className="flex items-center mt-2 text-gray-500">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm font-medium truncate max-w-xs">{walletAddress}</span>
              <button className="ml-2 p-1 hover:bg-gray-100 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <div className="text-4xl font-bold text-gray-900 mb-6">
            ${totalBalance.toFixed(2)}
          </div>

          {step === 'select' && (
            <>
              <ActionButtons>
                <Button
                  onClick={() => setStep('transfer')}
                  disabled={!selectedToken || parseFloat(selectedToken?.balance || '0') <= 0}
                  variant="secondary"
                >
                  Transfer
                </Button>
                <Button variant="primary">
                  Fund
                </Button>
              </ActionButtons>

              <div className="flex mb-6 border-b">
                <button className="text-[--text-primary] font-semibold pb-2 border-b-2 border-[--border-color] mr-8">
                  Balances
                </button>
                <button className="text-[--text-secondary] font-semibold pb-2">
                  Transactions
                </button>
              </div>

              <div className="space-y-4">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex items-center justify-between p-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-[--bg-secondary] rounded-full mr-3"></div>
                          <div className="space-y-2">
                            <div className="h-4 border-[--border-color] rounded w-12"></div>
                            <div className="bg-[--bg-secondary] rounded w-4"></div>
                          </div>
                        </div>
                        <div className="h-5 bg-[--bg-secondary] rounded w-16"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  balances.map((token, index) => (
                    <TokenCard
                      key={index}
                      selected={selectedToken?.symbol === token.symbol}
                      onClick={() => setSelectedToken(token)}
                    >
                      <div className="flex items-center">
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
                          ${(token.usdValue || 0).toFixed(2)}
                        </div>
                      </div>
                    </TokenCard>
                  ))
                )}
              </div>
            </>
          )}

          {step === 'transfer' && selectedToken && (
            <div className="space-y-6 flex-1 flex flex-col">
              <button
                onClick={() => setStep('select')}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Balances
              </button>

              <WarningBox>
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
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
                  <button
                    onClick={() => setAmount(maxWithdrawable)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
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
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Network Fee:</span>
                    <span className="font-medium text-gray-900">{gasEstimate} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">You'll Send:</span>
                    <span className="font-medium text-gray-900">{amount} {selectedToken.symbol}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">Total Cost:</span>
                      <span className="font-bold text-gray-900">
                        {(parseFloat(amount || '0') + parseFloat(gasEstimate)).toFixed(6)} ETH
                      </span>
                    </div>
                  </div>
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
              <Button
                onClick={onClose}
                variant="primary"
              >
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