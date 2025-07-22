import React from 'react';
import TokenBalanceCard from './TokenBalanceCard';
import { ChainConfig } from './offrampHooks/constants';
import { useBalances } from './offrampHooks/useBalance';

const ChainSelector: React.FC<{
  chains: ChainConfig[];
  onSelectChain: (chain: ChainConfig) => void;
  userAddress: string;
}> = ({ chains, onSelectChain, userAddress }) => {
  const { balances, loading } = useBalances(chains, userAddress);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Select Network
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {chains.map(chain => (
          <div 
            key={chain.id}
            className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onSelectChain(chain)}
          >
            <div className="flex items-center gap-3 mb-3">
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
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChainSelector;