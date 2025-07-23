import React, { useState } from 'react';
import TokenBalanceCard from './TokenBalanceCard';
import { ChainConfig } from './offrampHooks/constants';
import { useBalances } from './offrampHooks/useBalance';

interface ChainSelectorProps {
  chains: ChainConfig[];
  onSelectChain: (chain: ChainConfig, token: string) => void;
  userAddress: string;
}

const ChainSelector: React.FC<ChainSelectorProps> = ({ chains, onSelectChain, userAddress }) => {
  const { balances, loading } = useBalances(chains, userAddress);
  // Track selected token per chain
  const [selectedTokens, setSelectedTokens] = useState<Record<string, string>>({});

  const handleChainClick = (chain: ChainConfig) => {
    // Get the selected token for this chain, or default to the first token
    const selectedToken = selectedTokens[chain.id] || chain.tokens[0];
    
    // Ensure we have a valid token before proceeding
    if (selectedToken && chain.tokens.includes(selectedToken)) {
      onSelectChain(chain, selectedToken);
    } else if (chain.tokens.length > 0) {
      // Fallback to first token if selected token is invalid
      onSelectChain(chain, chain.tokens[0]);
    }
  };

  const handleTokenSelect = (chainId: string, token: string) => {
    setSelectedTokens(prev => ({
      ...prev,
      [chainId]: token
    }));
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Select Network
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {chains.map(chain => {
          const currentSelectedToken = selectedTokens[chain.id] || chain.tokens[0];
          
          return (
            <div
              key={chain.id}
              className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div 
                className="flex items-center gap-3 mb-3 cursor-pointer"
                onClick={() => handleChainClick(chain)}
              >
                <img
                  src={chain.icon}
                  alt={chain.name}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <h3 className="font-medium text-gray-900">{chain.name}</h3>
                  <p className="text-xs text-gray-500">{chain.nativeCurrency.symbol}</p>
                </div>
              </div>
              <div className="space-y-2">
                {chain.tokens.map(token => (
                  <TokenBalanceCard
                    key={`${chain.id}-${token}`}
                    token={token}
                    balance={balances[chain.id]?.[token] || '0'}
                    loading={loading}
                    isSelected={token === currentSelectedToken}
                    onClick={() => handleTokenSelect(chain.id.toString(), token)}
                  />
                ))}
              </div>
              {/* Add a select button for this chain */}
              <button
                onClick={() => handleChainClick(chain)}
                className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm transform hover:-translate-y-0.5"
              >
                Select {chain.name} with {currentSelectedToken}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChainSelector;