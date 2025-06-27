import React, { useState } from 'react';
import { CheckCircle, Copy, Check, Wallet, ExternalLink, Shield } from 'lucide-react';
import MiniBalanceTracker from '../dashboard/MiniBalanceTracker';
import OrderHistoryModal from '../offramp/OfframpStatus';

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
    <div className="sm:w-1/2">
      <div className="bg-gradient-to-br from-blue-600/90 to-indigo-600/90 rounded-xl shadow-lg h-full">
        {/* Compact Header */}
        <div className="px-4 py-3 flex flex-col lg:!flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-blue-600" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border border-white"></div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-semibold text-white">Wallet Connected</h2>
              </div>
              <p className="text-blue-100 text-xs">Secure connection active</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <MiniBalanceTracker />
            <OrderHistoryModal />
          </div>
        </div>

        {/* Compact Wallet Details */}
        <div className="border-t border-white/20 px-4 py-3 flex mt-5 my-auto mx-auto w-full">
          {selectedWalletAddress ? (
            <div className="flex flex-col lg:!flex-row w-full items-center gap-4">
              <div className="flex-1 flex items-center">
                <div className="bg-white flex items-center gap-2 min-w-0 flex-1 px-4 py-3 rounded-lg">
                  <Wallet className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-800 font-medium">
                        {formatAddress(selectedWalletAddress)}
                      </span>
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-medium">
                        {selectedWalletType?.toUpperCase() || 'CONNECTED'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 items-end">
                <button
                  onClick={handleCopyAddress}
                  className="h-8 px-3 !bg-gray-700 hover:!bg-gray-800 text-white text-xs font-medium rounded-md flex items-center transition-colors duration-200 gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => window.open(`https://etherscan.io/address/${selectedWalletAddress}`, '_blank')}
                  className="h-8 px-3 !bg-blue-600 hover:!bg-blue-700 text-white text-xs font-medium !rounded-md flex items-center transition-colors duration-200 gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Explorer</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center py-2 text-gray-500">
              <Wallet className="w-4 h-4 mr-2 text-gray-400" />
              <p className="text-sm">No wallet connected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}