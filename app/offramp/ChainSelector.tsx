import React, { useMemo, useState } from 'react';
import TokenBalanceCard from './TokenBalanceCard';
import { ChainConfig } from './offrampHooks/constants';
import { useBalances } from './offrampHooks/useBalance';
import { useWallets } from '@privy-io/react-auth';

interface ChainSelectorProps {
  chains: ChainConfig[];
  onSelectChain: (chain: ChainConfig, token: string) => void;
  userAddress: string;
}

const ChainSelector: React.FC<ChainSelectorProps> = ({ chains, onSelectChain, userAddress }) => {
  const { balances, loading } = useBalances(chains, userAddress);
  const { wallets } = useWallets();

  const [selectedTokens, setSelectedTokens] = useState<Record<string, string>>({});
  const [activeChainId, setActiveChainId] = useState<string>(() => (chains?.[0]?.id ?? 0).toString());

  const activeChain = useMemo(() => {
    return chains.find(c => c.id === Number(activeChainId)) ?? chains[0];
  }, [activeChainId, chains]);

  const handleTokenSelect = async (chainId: string, token: string) => {
    setSelectedTokens(prev => ({ ...prev, [chainId]: token }));

    const chain = chains.find(c => c.id === Number(chainId)) || chains[0];
    if (chain) {
      try {
        if (wallets && wallets[0] && typeof wallets[0].switchChain === 'function') {
          await wallets[0].switchChain(chain.id);
        }
      } catch (e) {
        // handle chain switch errors gracefully
      }
      onSelectChain(chain, token);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900/30 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/10 overflow-hidden">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Select Token
        </h2>
        <p className="text-gray-400 text-sm mt-2">Choose a chain, then tap a token to proceed to cash-out</p>
      </div>

      {/* Dropdown with icons for all screen sizes */}
      <div>
        <label htmlFor="chain-select" className="block text-xs text-gray-300 mb-2">Network</label>
        <div className="relative">
          <select
            id="chain-select"
            value={activeChainId}
            onChange={(e) => setActiveChainId(e.target.value)}
            className="w-full appearance-none rounded-xl bg-slate-800/70 border border-white/10 px-4 py-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            {chains.map((chain) => (
              <option key={chain.id} value={chain.id.toString()}>
                {chain.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="opacity-70">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Active chain card & its tokens */}
        {activeChain && (
          <div
            key={activeChain.id}
            className="mt-5 border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-800/50 rounded-2xl p-5"
          >
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
              <img src={activeChain.icon} alt={activeChain.name} className="w-9 h-9 rounded-full p-1 bg-white" />
              <div>
                <h3 className="text-sm font-bold text-white">{activeChain.name}</h3>
                <p className="text-xs text-gray-400">{activeChain.nativeCurrency.symbol}</p>
              </div>
            </div>

            <div className="space-y-3">
              {activeChain.tokens.map((token) => {
                const currentSelectedToken = selectedTokens[activeChain.id.toString()] || activeChain.tokens[0];
                return (
                  <button
                    key={`${activeChain.id}-${token}`}
                    onClick={() => handleTokenSelect(activeChain.id.toString(), token)}
                    className="w-full text-left cursor-pointer rounded-xl p-2 transition-all duration-200 flex items-center justify-between bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-500/50 shadow-lg hover:translate-y-[-1px] active:translate-y-[0px]"
                  >
                    <div className="flex-1 min-w-0">
                      <TokenBalanceCard
                        token={token}
                        balance={balances[activeChain.id]?.[token] || '0'}
                        loading={loading}
                        isSelected={token === currentSelectedToken}
                        compactView
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-white/10 text-center">
        <p className="text-xs text-gray-500">Powered by secure off-chain protocols</p>
      </div>
    </div>
  );
};

export default ChainSelector;
