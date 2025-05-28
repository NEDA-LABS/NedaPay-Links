"use client";

import { useState } from "react";
import WalletSelector from "./WalletSelector";

export default function HomeWalletSelector() {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="relative">
      <WalletSelector />
      <style jsx>{`
        .wallet-button {
          padding: 1rem 2rem !important;
          font-size: 1rem !important;
          min-height: 50px !important;
          width: 100% !important;
          max-width: 400px !important;
          margin: 0 auto !important;
          display: block !important;
        }
        
        .wallet-icon {
          width: 24px !important;
          height: 24px !important;
          margin-right: 12px !important;
        }
        
        .wallet-address {
          font-size: 1rem !important;
        }
        
        .wallet-dropdown {
          width: 100% !important;
          max-width: 400px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
        }
        
        @media (max-width: 640px) {
          .wallet-button {
            padding: 0.75rem 1.5rem !important;
            font-size: 0.875rem !important;
            min-height: 44px !important;
          }
          
          .wallet-icon {
            width: 20px !important;
            height: 20px !important;
            margin-right: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}
