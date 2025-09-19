import React, { useMemo, useState } from 'react';
import TokenBalanceCard from './TokenBalanceCard';
import { ChainConfig } from './offrampHooks/constants';
import { useBalances } from './offrampHooks/useBalance';
import { useWallets } from '@privy-io/react-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { stablecoins } from '../../data/stablecoins';

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

  // Helper function to get token icon
  const getTokenIcon = (token: string) => {
    const stablecoin = stablecoins.find(s => s.baseToken === token);
    return stablecoin?.flag || '/default-token-icon.png';
  };

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
    <div className="bg-slate-900 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/10 overflow-hidden">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Select Token
        </h2>
        <p className="text-gray-400 text-sm mt-2">Choose a chain, then tap a token to proceed to cash-out</p>
      </div>

      {/* Network Selection with shadcn Select */}
      <div>
        <label className="block text-xs text-gray-300 mb-2">Network</label>
        <Select value={activeChainId} onValueChange={setActiveChainId}>
          <SelectTrigger className="w-full rounded-xl bg-slate-800/70 border border-white/10 px-4 py-3 text-white focus:ring-2 focus:ring-purple-500/50 hover:bg-slate-800/80 transition-colors">
            <SelectValue placeholder="Select a network" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border border-white/10 rounded-xl">
            {chains.map((chain) => (
              <SelectItem 
                key={chain.id} 
                value={chain.id.toString()}
                className="text-white hover:bg-slate-700/50 focus:bg-slate-700/50 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <img src={chain.icon} alt={chain.name} className="w-4 h-4 rounded-full" />
                  <span>{chain.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                  <Button
                    key={`${activeChain.id}-${token}`}
                    variant="ghost"
                    onClick={() => handleTokenSelect(activeChain.id.toString(), token)}
                    className="w-full h-auto p-2 text-left justify-start bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-500/50 shadow-lg hover:translate-y-[-1px] active:translate-y-[0px] hover:from-blue-600/40 hover:to-purple-600/40 transition-all duration-200"
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
                  </Button>
                );
              })}
            </div>
          </div>
        )}

      <div className="mt-6 pt-4 border-t border-white/10 text-center">
        <p className="text-xs text-gray-500">Powered by secure off-chain protocols</p>
      </div>
    </div>
  );
};

export default ChainSelector;
