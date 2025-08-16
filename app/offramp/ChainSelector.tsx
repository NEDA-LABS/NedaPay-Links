import React, { useState } from 'react';
import TokenBalanceCard from './TokenBalanceCard';
import { ChainConfig } from './offrampHooks/constants';
import { useBalances } from './offrampHooks/useBalance';
import { ArrowRight } from 'lucide-react';
import { useWallets } from '@privy-io/react-auth';

interface ChainSelectorProps {
  chains: ChainConfig[];
  onSelectChain: (chain: ChainConfig, token: string) => void;
  userAddress: string;
}

const ChainSelector: React.FC<ChainSelectorProps> = ({ chains, onSelectChain, userAddress }) => {
  const { balances, loading } = useBalances(chains, userAddress);
  const [selectedTokens, setSelectedTokens] = useState<Record<string, string>>({});
  const { wallets } = useWallets();

  const handleTokenSelect = async (chainId: string, token: string) => {
    setSelectedTokens(prev => ({
      ...prev,
      [chainId]: token
    }));
    
    const chain = chains.find(c => c.id === parseInt(chainId)) || chains[0];
    if (chain) {
      await wallets[0].switchChain(chain.id);
      onSelectChain(chain, token);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900/30 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/10 overflow-hidden">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Select Token
        </h2>
        <p className="text-gray-400 text-sm mt-2">
          Click a token to proceed to cash-out
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {chains.map(chain => {
          const currentSelectedToken = selectedTokens[chain.id] || chain.tokens[0];
          return (
            <div
              key={chain.id}
              className="border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-800/50 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:border-purple-500/30 group"
            >
              {/* Chain Header */}
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                <div className="relative">
                  <img
                    src={chain.icon}
                    alt={chain.name}
                    className="w-9 h-9 rounded-full p-1 bg-white"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{chain.name}</h3>
                  <p className="text-xs text-gray-400">{chain.nativeCurrency.symbol}</p>
                </div>
              </div>

              {/* Token List */}
              <div className="space-y-3">
                {chain.tokens.map(token => (
                  <div
                    key={`${chain.id}-${token}`}
                    onClick={() => handleTokenSelect(chain.id.toString(), token)}
                    className={`
                      cursor-pointer rounded-xl p-2 transition-all duration-200
                      flex flex-row items-center justify-between
                      bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-500/50 shadow-lg
                    `}
                  >
                    <div className="flex-1 min-w-0">
                      <TokenBalanceCard
                        token={token}
                        balance={balances[chain.id]?.[token] || '0'}
                        loading={loading}
                        isSelected={token === currentSelectedToken}
                        compactView={true}
                      />
                    </div>
                    
                    {/* <div className={`flex items-center mt-2 md:mt-0 md:ml-3`}>
                      <span className="text-xs font-medium">offramp</span>
                      <ArrowRight size={16} className="ml-1" />
                    </div> */}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-white/10 text-center">
        <p className="text-xs text-gray-500">
          Powered by secure off-chain protocols
        </p>
      </div>
    </div>
  );
};

export default ChainSelector;