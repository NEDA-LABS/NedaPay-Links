import React, { useState } from 'react';
import { CheckCircle, Copy, Check, Wallet, ExternalLink, Shield } from 'lucide-react';
import MiniBalanceTracker from '../dashboard/MiniBalanceTracker';
import OrderHistoryModal from '../paycrest/OfframpStatus';



interface WalletStatusSectionProps {
  selectedWalletAddress?: string;
  selectedWalletType?: string;
}

export default function WalletStatusSection({ selectedWalletAddress, selectedWalletType }: WalletStatusSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    if (!selectedWalletAddress) return;
    navigator.clipboard.writeText(selectedWalletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (address?: string) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="mx-auto flex-1">
      <div className="sm:p-6 bg-gradient-to-br from-blue-600/90 to-indigo-600/90 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden backdrop-blur-md">
        
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 rounded-2xl"></div>
        <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-emerald-200/30 to-blue-200/30 rounded-full blur-xl"></div>
        
        {/* Status Indicator */}
        <div className="relative flex items-start justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle className="w-4 h-4 text-slate-800" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 pt-2">
                Wallet Connected
                <Shield className="w-5 h-5 text-emerald-600" />
              </h2>
              <p className="text-white text-sm">
                Your wallet is securely connected and ready to use
              </p>
            </div>
          </div>
          {/* MiniBalanceTracker Integration */}
          <div className="flex items-center flex-col gap-2">
            <MiniBalanceTracker />
            <OrderHistoryModal />
          </div>
        </div>

        {/* Wallet Details Card */}
        <div className="relative bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Wallet className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-semibold text-slate-700">Wallet Address</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                {selectedWalletType?.toUpperCase() || 'CONNECTED'}
              </span>
            </div>
          </div>

          {selectedWalletAddress ? (
            <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
              <div className="flex items-center space-x-3">
                <div className="font-mono text-sm text-slate-800 bg-white px-3 py-1.5 rounded-md shadow-sm">
                  {formatAddress(selectedWalletAddress)}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyAddress}
                  className="group relative inline-flex items-center px-3 py-1.5 !bg-slate-700 hover:!bg-slate-800 text-white text-xs font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                  title="Copy full address"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 mr-1.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1.5" />
                      Copy
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => window.open(`https://etherscan.io/address/${selectedWalletAddress}`, '_blank')}
                  className="inline-flex items-center px-3 py-1.5 !bg-blue-600 hover:!bg-blue-700 text-white text-xs font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  title="View on explorer"
                >
                  <ExternalLink className="w-3 h-3 mr-1.5" />
                  View
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-6 text-slate-500">
              <div className="text-center">
                <Wallet className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm">No wallet connected</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}