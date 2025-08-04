"use client";
import { Button } from "@/components/Button";
import { StablecoinBalanceButton } from "@/components/StablecoinBalanceTracker";
import { Send, Wallet } from "lucide-react";
import { useWallets } from "@privy-io/react-auth";
import SwapModal from "@/components/SwapModal";
import { useState } from "react";
import WalletModal from "@/components/WalletEmbedded";

export default function WalletKit() {
  const { wallets } = useWallets();

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState("overview");

  const openWalletModal = (tab = "overview") => {
    setDefaultTab(tab);
    setIsWalletModalOpen(true);
  };

  const closeWalletModal = () => {
    setIsWalletModalOpen(false);
  };

  // Check if the wallet is Privy embedded
  const isPrivyEmbedded =
    wallets?.[0]?.walletClientType.toLowerCase() === "privy";

  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/20 text-center my-auto">
      <div className="flex flex-row space-y-4">
        
        {isPrivyEmbedded && (
          <div className="pt-4 mx-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => openWalletModal('overview')}
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 mx-auto"
            >
              <Wallet className="h-3 w-3 mr-1" />
              Wallet
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <StablecoinBalanceButton />
          </div>
        </div>
      </div>
      <WalletModal
      isOpen={isWalletModalOpen}
      onClose={closeWalletModal}
      defaultTab={defaultTab as 'overview' | 'send' | 'receive' | 'settings'}
    />
    </div>
  );
}
