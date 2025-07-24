import React, { useState, useRef, useEffect } from 'react';
import { useChain } from '@/hooks/useChain';
import { ChevronDown, Loader2 } from 'lucide-react';

const ChainSwitcher: React.FC = () => {
  const {
    currentChain,
    currentChainId,
    supportedChains,
    switchChain,
    isConnected,
    isSwitching,
  } = useChain();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChainSwitch = async (chainId: number) => {
    setIsDropdownOpen(false);
    await switchChain(chainId as any);
  };

  const toggleDropdown = () => {
    if (!isSwitching && isConnected) {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  if (!isConnected) {
    return (
      <button 
        disabled 
        className="px-3 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
      >
        No Wallet
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Button */}
      <button
        onClick={toggleDropdown}
        disabled={isSwitching}
        className={`flex items-center space-x-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm font-medium transition-all duration-200 ${
          isSwitching 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:border-gray-300 focus:ring-1 focus:ring-slate-400'
        }`}
      >
        {isSwitching ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        ) : (
          <img 
            src={currentChain.icon} 
            alt={currentChain.name}
            className="w-4 h-4 rounded-full"
            onError={(e) => {
              e.currentTarget.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="%23007bff"/><text x="8" y="11" text-anchor="middle" fill="white" font-size="8">${currentChain.name[0]}</text></svg>`;
            }}
          />
        )}
        <span className="text-white">
          {isSwitching ? 'Switching...' : currentChain.name}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-white transition-transform duration-200 ${
            isDropdownOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1" style={{zIndex: 1000}}>
          {supportedChains.map((chain) => (
            <button
              key={chain.id}
              onClick={() => handleChainSwitch(chain.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                chain.id === currentChainId ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              <img 
                src={chain.icon} 
                alt={chain.name}
                className="w-4 h-4 rounded-full flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="%23007bff"/><text x="8" y="11" text-anchor="middle" fill="white" font-size="8">${chain.name[0]}</text></svg>`;
                }}
              />
              <div className="flex-1">
                <div className="font-medium text-sm">{chain.name}</div>
                <div className="text-xs text-gray-500">{chain.nativeCurrency.symbol}</div>
              </div>
              {chain.id === currentChainId && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChainSwitcher;