"use client";

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { SUPPORTED_CHAINS_NORMAL } from '@/ramps/payramp/offrampHooks/constants';
import { stablecoins } from '@/data/stablecoins';

// Memoized Chain Selection Component
export const ChainSelector = React.memo(({ 
  selectedChain, 
  onChainChange 
}: { 
  selectedChain: string; 
  onChainChange: (value: string) => void; 
}) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.2 }}
    className="bg-gradient-to-br from-slate-800/40 to-slate-700/30 rounded-xl p-4 border border-white/10 backdrop-blur-sm shadow-lg"
  >
    <div className="flex items-center space-x-2 mb-3">
      {/* <div className="w-2 h-2 bg-blue-400 rounded-full"></div> */}
      <Label className="text-white text-sm font-medium">
        Select Network
      </Label>
    </div>
    <Select value={selectedChain} onValueChange={onChainChange}>
      <SelectTrigger className="bg-slate-700/50 border-white/20 text-white hover:bg-slate-600/50 transition-all duration-200 rounded-lg">
        <SelectValue placeholder="Choose network" />
      </SelectTrigger>
      <SelectContent className="bg-slate-800 border-white/20 backdrop-blur-sm">
        {SUPPORTED_CHAINS_NORMAL.map((chain) => (
          <SelectItem key={chain.id} value={chain.id.toString()}>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Image
                  src={chain.icon}
                  alt={chain.name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                {/* <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-800"></div> */}
              </div>
              <div>
                <span className="font-medium">{chain.name}</span>
                <div className="text-xs text-slate-400">{chain.nativeCurrency.symbol}</div>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </motion.div>
));

// Memoized Token Selection Component
export const TokenSelector = React.memo(({ 
  selectedToken, 
  onTokenChange, 
  availableTokens 
}: { 
  selectedToken: string; 
  onTokenChange: (value: string) => void; 
  availableTokens: typeof stablecoins; 
}) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.3 }}
    className="bg-gradient-to-br from-slate-800/40 to-slate-700/30 rounded-xl p-4 border border-white/10 backdrop-blur-sm shadow-lg"
  >
    <div className="flex items-center space-x-2 mb-3">
      {/* <div className="w-2 h-2 bg-purple-400 rounded-full"></div> */}
      <Label className="text-white text-sm font-medium">
        Select Token
      </Label>
    </div>
    <Select value={selectedToken} onValueChange={onTokenChange}>
      <SelectTrigger className="bg-slate-700/50 border-white/20 text-white hover:bg-slate-600/50 transition-all duration-200 rounded-lg">
        <SelectValue placeholder="Choose token" />
      </SelectTrigger>
      <SelectContent className="bg-slate-800 border-white/20 backdrop-blur-sm">
        {availableTokens.map((token) => (
          <SelectItem key={token.baseToken} value={token.baseToken}>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Image
                  src={token.flag}
                  alt={token.baseToken}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                {/* <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full border-2 border-slate-800"></div> */}
              </div>
              <div>
                <span className="font-medium">{token.baseToken}</span>
                <div className="text-xs text-slate-400">{token.name}</div>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </motion.div>
));

// Memoized Amount Input Component
export const AmountInput = React.memo(({ 
  customAmount, 
  onAmountChange 
}: { 
  customAmount: string; 
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
    className="bg-gradient-to-br from-slate-800/40 to-slate-700/30 rounded-xl p-4 border border-white/10 backdrop-blur-sm shadow-lg"
  >
    <div className="flex items-center space-x-2 mb-3">
      {/* <div className="w-2 h-2 bg-emerald-400 rounded-full"></div> */}
      <Label className="text-white text-sm font-medium">
        Enter Amount
      </Label>
    </div>
    <div className="relative">
      <Input
        type="number"
        placeholder="0.00"
        value={customAmount}
        onChange={onAmountChange}
        className="bg-slate-700/50 border-white/20 text-white placeholder-slate-400 hover:bg-slate-600/50 focus:bg-slate-600/50 transition-all duration-200 rounded-lg pl-8"
      />
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
        $
      </div>
    </div>
  </motion.div>
));
