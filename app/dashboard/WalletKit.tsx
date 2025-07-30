"use client";
import { Button } from "@/components/Button";
import { StablecoinBalanceButton } from "@/components/StablecoinBalanceTracker";
import { Send, Activity } from "lucide-react";
import { useWallets } from "@privy-io/react-auth";
import SwapModal from "@/components/SwapModal";
import { useState } from "react";

export default function WalletKit() {
  const { wallets } = useWallets();

  // Check if the wallet is Privy embedded
  const isPrivyEmbedded = wallets[0].walletClientType === "embedded";

  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/20 text-center mt-[70px]">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <StablecoinBalanceButton />
          </div>
        </div>
        {isPrivyEmbedded && (
          <div className="pt-4 border-t border-white/20">
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-white/10 text-white border-white/30 hover:bg-white/20"
              >
                <Send className="h-3 w-3 mr-1" />
                <a href="/Wallet">Send</a>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-white/10 text-white border-white/30 hover:bg-white/20"
              >
                <Activity className="h-3 w-3 mr-1" />
                Receive
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
