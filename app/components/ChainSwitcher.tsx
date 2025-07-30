'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { useWallets } from '@privy-io/react-auth';
import { polygon, arbitrum, optimism, base, bsc } from 'viem/chains';

// Define supported chains with their metadata
const SUPPORTED_CHAINS = [
  {
    ...polygon,
    icon: '/polygon.svg',
  },
  {
    ...arbitrum,
    icon: '/arbitrum.svg',
  },
  {
    ...optimism,
    icon: '/optimism.svg',
  },
  {
    ...base,
    icon: '/base.svg',
  },
  {
    ...bsc,
    icon: '/bsc.svg',
  },
];

const DEFAULT_CHAIN = SUPPORTED_CHAINS[0]; // Ethereum mainnet

const ChainSwitcher: React.FC = () => {
  const { wallets } = useWallets();
  
  const currentChainId = wallets[0]?.chainId;
  
  const [error, setError] = useState("");
  const [isSwitching, setIsSwitching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current chain from supported chains or fallback to default
  const currentChain = SUPPORTED_CHAINS.find(
    chain => chain.id.toString() === currentChainId?.replace('eip155:', '')
  ) || DEFAULT_CHAIN;

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Monitor chain changes and reset switching state
  useEffect(() => {
    if (isSwitching && currentChainId) {
      // Chain has changed, stop the switching state
      setIsSwitching(false);
      setError("");
    }
  }, [currentChainId, isSwitching]);

  const handleSwitch = async (chainId: number) => {
    const normalizedCurrentChainId = currentChainId?.replace('eip155:', '');
    
    if (chainId.toString() === normalizedCurrentChainId) {
      setIsOpen(false);
      return;
    }
    
    console.log("Switching to chain:", chainId);
    console.log("Current wallet type:", wallets[0]?.walletClientType);
    
    setIsSwitching(true);
    setError("");
    
    try {
      await wallets[0].switchChain(chainId);
      console.log("Successfully switched to chain:", chainId);
      
      // Add a small delay to ensure chain switch is complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsOpen(false);
    } catch (err) {
      console.error("Chain switch error:", err);
      
      let errorMessage = "Failed to switch chains";
      
      if (err instanceof Error) {
        if (err.message.includes('rejected')) {
          errorMessage = "Chain switch was rejected by user";
        } else if (err.message.includes('4902')) {
          errorMessage = "Chain not found in wallet. Please add it manually.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSwitching(false);
    }
  };

  const createFallbackIcon = (chainName: string) => {
    return `data:image/svg+xml;base64,${btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="8" fill="#666"/>
        <text x="8" y="11" text-anchor="middle" fill="white" font-size="8">${chainName.charAt(0)}</text>
      </svg>`
    )}`;
  };

  if (!wallets || wallets.length === 0) {
    return (
      <button disabled className="px-3 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm cursor-not-allowed">
        No Wallet
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {error && (
        <div className="absolute bottom-full mb-2 left-0 bg-red-50 border border-red-200 rounded-lg p-3 z-50 max-w-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500 w-4 h-4 flex-shrink-0" />
            <span className="text-red-800 text-sm">{error}</span>
            <button 
              onClick={() => setError("")} 
              className="text-red-400 hover:text-red-600 ml-auto flex-shrink-0"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSwitching ? (
          <Loader2 className="animate-spin w-4 h-4" />
        ) : (
          <>
            <img 
              src={currentChain.icon} 
              alt={currentChain.name}
              className="w-4 h-4 rounded-full"
              onError={(e) => {
                e.currentTarget.src = createFallbackIcon(currentChain.name);
              }}
            />
            <span className="text-sm font-medium">{currentChain.name}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
            Switch Network
          </div>
          {SUPPORTED_CHAINS.map(chain => {
            const isCurrentChain = chain.id.toString() === currentChainId?.replace('eip155:', '');
            
            return (
              <button
                key={chain.id}
                onClick={() => handleSwitch(chain.id)}
                disabled={isCurrentChain || isSwitching}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors disabled:cursor-not-allowed ${
                  isCurrentChain
                    ? 'bg-blue-50 text-blue-700' 
                    : 'hover:bg-gray-50 disabled:opacity-50'
                }`}
              >
                {/* <img 
                  src={chain.icon} 
                  alt={chain.name}
                  className="w-4 h-4 rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = createFallbackIcon(chain.name);
                  }}
                /> */}
                <div className="flex-1">
                  <div className="font-medium text-sm text-slate-800">{chain.name}</div>
                  <div className="text-xs text-gray-500">
                    {chain.nativeCurrency.symbol}
                  </div>
                </div>
                {isCurrentChain && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChainSwitcher;