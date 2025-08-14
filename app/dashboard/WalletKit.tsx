"use client";
import { Button } from "@/components/Button";
import { StablecoinBalanceButton } from "@/components/StablecoinBalanceTracker";
import { Send, Wallet } from "lucide-react";
import { useWallets } from "@privy-io/react-auth";
import SwapModal from "@/components/SwapModal";
import { useState } from "react";
import WalletModal from "@/components/WalletEmbedded";

interface WalletKitProps {
  buttonName: string;
}

export default function WalletKit({ buttonName }: WalletKitProps) {
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
    wallets?.[0]?.walletClientType?.toLowerCase() === "privy" &&
    wallets?.[0]?.walletClientType?.toLowerCase() !== "metamask" &&
    wallets?.[0]?.walletClientType?.toLowerCase() !== "coinbase_wallet";
  // console.log(
  //   "wallet typeeeeeeeeeee",
  //   wallets?.[0]?.walletClientType.toLowerCase()
  // );
  return (
    <div className="flex items-center">
      <div className="flex flex-row items-center my-auto">
        <div className="flex mx-auto items-center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openWalletModal("overview")}
            className=" text-white border-white/10 hover:bg-white/20 mx-auto"
          >
            {/* <Wallet className="h-3 w-3 mr-1" /> */}
            {buttonName}
          </Button>
        </div>

        {/* <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <StablecoinBalanceButton />
          </div>
        </div> */}
      </div>
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={closeWalletModal}
        defaultTab={defaultTab as "overview" | "send" | "receive" | "settings"}
      />
    </div>
  );
}
