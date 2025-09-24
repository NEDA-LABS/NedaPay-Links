"use client";

import toast from "react-hot-toast";
import {
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { base } from "wagmi/chains";
import { Name } from "@coinbase/onchainkit/identity";
import { getBasename } from "../utils/getBaseName";
import { useUserSync } from "../hooks/useUserSync";
import { useLinkAccount } from "@privy-io/react-auth";
import { Wallet, LogOut, PlusCircle, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

// Type definitions for BasenameDisplay component
interface BasenameDisplayProps {
  address: string | undefined;
  basenameClassName?: string;
  addressClassName?: string;
  isMobile?: boolean;
}

// Reusable BasenameDisplay Component
const BasenameDisplay: React.FC<BasenameDisplayProps> = ({
  address,
  basenameClassName = "",
  addressClassName = "",
  isMobile = false,
}) => {
  const [baseName, setBaseName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Basename fetching with proper error handling
  useEffect(() => {
    if (!address) {
      setBaseName(null);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const fetchBasename = async () => {
      setIsLoading(true);
      try {
        const toHexAddress = (address: string): `0x${string}` => {
          return (
            address.startsWith("0x") ? address : `0x${address}`
          ) as `0x${string}`;
        };

        const formattedAddress = toHexAddress(address);
        const basename = await getBasename(formattedAddress);

        if (isMounted && !controller.signal.aborted) {
          setBaseName(basename || null);
        }
      } catch (error) {
        console.error("Error fetching basename:", error);
        if (isMounted && !controller.signal.aborted) {
          setBaseName(null);
        }
      } finally {
        if (isMounted && !controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    // Debounce the fetch
    const debounceTimer = setTimeout(fetchBasename, 300);

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(debounceTimer);
    };
  }, [address]);

  const getActiveWallet = (wallets: any[]) => {
    if (!wallets || wallets.length === 0) return null;
    
    // First, check if there's an embedded wallet and prioritize it
    const embeddedWallet = wallets.find(wallet => 
      wallet.walletClientType === 'privy' || 
      wallet.connectorType === 'embedded'
    );
    
    if (embeddedWallet) {
      return embeddedWallet;
    }
    
    // If no embedded wallet, use the first connected wallet
    return wallets[0];
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-1 text-white">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-600 h-4 w-16 rounded"></div>
      </div>
    );
  }

  if (baseName) {
    return (
      <span
        className={`text-sm text-white font-bold ${basenameClassName}`}
      >
        {baseName}
      </span>
    );
  }

  // Fallback to Name component from OnchainKit
  return (
    <div className={`${addressClassName}`}>
      <Name address={address as `0x${string}`} chain={base} />
    </div>
  );
};

// WalletSelector component with ref
interface WalletSelectorProps {
  triggerLogin?: () => void; // Optional prop, expects 0 arguments
}

const WalletSelector = forwardRef<
  { triggerLogin: () => void },
  WalletSelectorProps
>(({ triggerLogin }, ref) => {
  // Enhanced mobile-specific styles
  const mobileStyles = `
      @media (max-width: 640px) {
        
        .wallet-icon {
          width: 18px !important;
          height: 18px !important;
          margin-right: 6px !important;
          flex-shrink: 0 !important;
        }
        
        
        
        
        .basename-display {
          max-width: 100px !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }
        .address-display {
          max-width: 80px !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }
      }
      
      @media (max-width: 480px) {
        
        .wallet-address {
          font-size: 0.65rem;
          max-width: calc(100vw - 100px);
        }
        .basename-display {
          max-width: 80px !important;
        }
        .address-display {
          max-width: 60px !important;
        }
      }
    `;

  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showOptions, setShowOptions] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  

  // Email sync and update
  const {
    userData,
    isLoading: userLoading,
    addEmail,
    hasEmail,
  } = useUserSync();

  // Privy hooks - Added clearActiveWallet to fully disconnect wallets
  const {
    authenticated,
    user,
    connectWallet,
    logout,
    ready,
    login,
  } = usePrivy();

  // Link account hook
  const { linkEmail } = useLinkAccount({
    onSuccess: ({ user, linkMethod, linkedAccount }) => {
      // console.log("Linked account to user ", linkedAccount);
      toast.success("Email linked successfully!");
    },
    onError: (error) => {
      // console.error("Failed to link account with error ", error);
      toast.error("Failed to link email. Please try again.");
    },
  });

  // Get the primary wallet address safely
  const walletAddress = user?.wallet?.address;
  const {wallets} = useWallets();
  
  const emailAddress = user?.email?.address;
  const isConnected = authenticated && (walletAddress || emailAddress);

  // Show authentication modal only on / and once per session
  useEffect(() => {
    if (
      ready &&
      authenticated &&
      (walletAddress || emailAddress) &&
      pathname === "/"
    ) {
      const hasShown = sessionStorage.getItem("hasShownAuthModal") === "true";
      if (!hasShown) {
        setShowAuthModal(true);
        sessionStorage.setItem("hasShownAuthModal", "true");
      }
    }
  }, [ready, authenticated, walletAddress, emailAddress, pathname]);

  // Expose handleEmailLogin via ref
  const handleEmailLogin = useCallback(async () => {
    if (!ready) {
      toast.error("Privy is not ready yet. Please wait a moment.");
      return;
    }

    setIsConnecting(true);
    try {
      await login();
      // Trigger modal if on /
      if (
        pathname === "/" &&
        sessionStorage.getItem("hasShownAuthModal") !== "true"
      ) {
        setShowAuthModal(true);
        sessionStorage.setItem("hasShownAuthModal", "true");
      }
    } catch (error: any) {
      console.error("Error with email login:", error);
      toast.error("Failed to login. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  }, [ready, login, pathname]);

  useImperativeHandle(ref, () => ({
    triggerLogin: handleEmailLogin,
  }));

  // Format address for display
  const formatAddress = useCallback(
    (address: string | undefined, isMobile: boolean = false): string => {
      if (
        !address ||
        typeof address !== "string" ||
        !address.startsWith("0x") ||
        address.length < 10
      ) {
        return "Unknown Address";
      }

      if (isMobile) {
        return `${address.substring(0, 4)}...${address.substring(address.length - 3)}`;
      }

      return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    },
    []
  );

  // Enhanced format email for mobile display
  const formatEmail = useCallback(
    (email: string | undefined, maxLength: number = 20): string => {
      if (!email) return "Connected";

      if (email.length <= maxLength) return email;

      const [localPart, domain] = email.split("@");
      if (localPart.length > maxLength - domain.length - 4) {
        return `${localPart.substring(0, maxLength - domain.length - 7)}...@${domain}`;
      }

      return email;
    },
    []
  );


  // Handle wallet connection state and persistence
  useEffect(() => {
    if (ready && isConnected) {
      const address = walletAddress || emailAddress || "";

      if (typeof window !== "undefined") {
        localStorage.setItem("walletConnected", "true");
        if (address) {
          localStorage.setItem("walletAddress", address);
        }

        document.cookie =
          "wallet_connected=true; path=/; max-age=86400; SameSite=Lax";

        window.dispatchEvent(
          new CustomEvent("walletConnected", {
            detail: { address, authenticated: true },
          })
        );
      }
    } else {
      if (typeof window !== "undefined") {
        localStorage.removeItem("walletConnected");
        localStorage.removeItem("walletAddress");
        document.cookie = "wallet_connected=; path=/; max-age=0; SameSite=Lax";

        window.dispatchEvent(new CustomEvent("walletDisconnected"));
      }
    }
  }, [ready, isConnected, walletAddress, emailAddress]);

  // Enhanced logout handling - COMPLETE WALLET DISCONNECTION
  const handleLogout = async () => {
    try {
      // Disconnect all wallets first
      for (const wallet of wallets) {
        try {
          await wallet.disconnect();
          console.log(`Disconnected wallet: ${wallet.address}`);
        } catch (error) {
          console.warn(`Failed to disconnect wallet ${wallet.address}:`, error);
        }
      }

      // Then logout from Privy
      await logout();

      if (typeof window !== "undefined") {
        localStorage.removeItem("walletConnected");
        localStorage.removeItem("walletAddress");
        sessionStorage.removeItem("hasShownAuthModal"); // Reset modal state
        document.cookie = "wallet_connected=; path=/; max-age=0; SameSite=Lax";
      }

      toast.success("Logged out successfully");
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  };

  // Handle linking email
  const handleLinkEmail = async () => {
    try {
      await linkEmail();
    } catch (error) {
      console.error("Error linking email:", error);
    }
  };

  // Render wallet icon
  const renderWalletIcon = () => {
    const walletType = user?.wallet?.walletClientType;

    if (walletType === "coinbase_wallet") {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#0052FF" />
          <circle cx="12" cy="12" r="7.2" fill="#fff" />
          <rect x="8" y="11" width="8" height="2" rx="1" fill="#0052FF" />
        </svg>
      );
    } else if (walletType === "metamask") {
      return (
        <img
          src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/metamask-icon.svg"
          alt="MetaMask Logo"
          width="18"
          height="18"
        />
      );
    }

    return <Wallet className="h-5 w-5 text-white" />;
  };

  if (!ready) {
    return (
      <div className="wallet-button flex items-center bg-gradient-to-r from-blue-600 to-purple-700 px-2 sm:px-3 py-1 rounded-lg text-white shadow-lg">
        <span className="text-xs sm:text-sm text-black">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <style jsx>{mobileStyles}</style>

      {isConnected ? (
        <DropdownMenu open={showOptions} onOpenChange={setShowOptions}>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" className="flex items-center space-x-2 bg-[#3E55E6] text-white hover:bg-blue-700 rounded-2xl px-2">
              <div className="wallet-icon w-6 h-6 flex items-center justify-center">
                {renderWalletIcon()}
              </div>
              {pathname !== "/" && (
                <div className="wallet-address-container flex-1 min-w-0">
                  {walletAddress ? (
                    <div className="wallet-address text-xs sm:text-sm font-bold">
                      <BasenameDisplay
                        address={walletAddress}
                        basenameClassName="basename-display"
                        addressClassName="address-display !text-white"
                        isMobile={true}
                      />
                    </div>
                  ) : emailAddress ? (
                    <span className="wallet-address text-xs sm:text-sm font-bold">
                      {formatEmail(emailAddress, 15)}
                    </span>
                  ) : (
                    <span className="wallet-address text-xs sm:text-sm font-bold">
                      Connected
                    </span>
                  )}
                </div>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 bg-slate-900/90 backdrop-blur-sm border border-slate-700 text-slate-200" align="end">
            <DropdownMenuLabel>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-200">
                  Connected Account
                </h3>
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                  Active
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-400 break-all">
                {walletAddress ? (
                  <BasenameDisplay
                    address={walletAddress}
                    basenameClassName="text-xs"
                    isMobile={false}
                  />
                ) : emailAddress ? (
                  emailAddress
                ) : (
                  "Connected"
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {!hasEmail && walletAddress && (
              <DropdownMenuItem onClick={handleLinkEmail}>
                <PlusCircle className="mr-2 h-4 w-4" />
                <span>Add Email Address</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button onClick={handleEmailLogin} disabled={isConnecting} className="bg-[#3E55E6] hover:bg-blue-700 rounded-lg">
          {isConnecting ? "Connecting..." : "Sign in"}
        </Button>
      )}
    </div>
  );
});

WalletSelector.displayName = "WalletSelector";

export { BasenameDisplay };
export default WalletSelector;