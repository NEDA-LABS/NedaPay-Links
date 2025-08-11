import React, { useState } from 'react';
import TokenBalanceCard from './TokenBalanceCard';
import { ChainConfig } from './offrampHooks/constants';
import { useBalances } from './offrampHooks/useBalance';
import { ArrowRight } from 'lucide-react';

interface ChainSelectorProps {
  chains: ChainConfig[];
  onSelectChain: (chain: ChainConfig, token: string) => void;
  userAddress: string;
}

const ChainSelector: React.FC<ChainSelectorProps> = ({ chains, onSelectChain, userAddress }) => {
  const { balances, loading } = useBalances(chains, userAddress);
  const [selectedTokens, setSelectedTokens] = useState<Record<string, string>>({});

  const handleTokenSelect = (chainId: string, token: string) => {
    setSelectedTokens(prev => ({
      ...prev,
      [chainId]: token
    }));
    const chain = chains.find(c => c.id === parseInt(chainId)) || chains[0];
    if (chain) {
      onSelectChain(chain, token);
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-800 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/10">
      <h2 className="text-xl font-semibold text-white mb-2">
        Select a Network & Token
      </h2>
      <p className="text-gray-400 text-sm mb-6">Click a token balance to proceed to the cash-out form</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {chains.map(chain => {
          const currentSelectedToken = selectedTokens[chain.id] || chain.tokens[0];

          return (
            <div
              key={chain.id}
              className="group border border-white/10 bg-slate-950 rounded-2xl p-5 hover:border-blue-500/50 hover:shadow-lg transition-all duration-200"
            >
              {/* Chain Header */}
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={chain.icon}
                  alt={chain.name}
                  className="w-10 h-10 rounded-full ring-2 ring-white/20"
                />
                <div>
                  <h3 className="font-semibold text-white">{chain.name}</h3>
                  <p className="text-xs text-gray-400">{chain.nativeCurrency.symbol}</p>
                </div>
              </div>

              {/* Token List */}
              <div className="space-y-3">
                {chain.tokens.map(token => (
                  <div
                    key={`${chain.id}-${token}`}
                    onClick={() => handleTokenSelect(chain.id.toString(), token)}
                    className={`cursor-pointer rounded-xl p-3 border transition-all duration-200 ${
                      token === currentSelectedToken
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/10 hover:border-blue-400/50 hover:bg-blue-400/5'
                    }`}
                  >
                    <TokenBalanceCard
                      token={token}
                      balance={balances[chain.id]?.[token] || '0'}
                      loading={loading}
                      isSelected={token === currentSelectedToken}
                    />
                    <div className="flex justify-end items-center text-blue-400 text-xs mt-1">
                      Offramp <ArrowRight size={14} className="ml-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChainSelector;
