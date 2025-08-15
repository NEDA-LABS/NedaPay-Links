"use client";

import toast from "react-hot-toast";
import {
  useState,
  useRef,
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
import AuthenticationModal from "./AuthenticationModal";
import { FaWallet, FaSignOutAlt } from "react-icons/fa";

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

  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
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
   // Crucial for complete wallet disconnection
  } = usePrivy();

  // Link account hook
  const { linkEmail } = useLinkAccount({
    onSuccess: ({ user, linkMethod, linkedAccount }) => {
      console.log("Linked account to user ", linkedAccount);
      toast.success("Email linked successfully!");
    },
    onError: (error) => {
      console.error("Failed to link account with error ", error);
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

  // Close dropdown when clicking or touching outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowOptions(false);
      }
    };

    if (showOptions) {
      document.addEventListener(
        "mousedown",
        handleClickOutside as EventListener
      );
      document.addEventListener(
        "touchstart",
        handleClickOutside as EventListener
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside as EventListener
      );
      document.removeEventListener(
        "touchstart",
        handleClickOutside as EventListener
      );
    };
  }, [showOptions]);

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
      setShowOptions(false);

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

    return (
      <FaWallet className="text-slate-50"/>
    );
  };

  if (!ready) {
    return (
      <div className="wallet-button flex items-center bg-gradient-to-r from-blue-600 to-purple-700 px-2 sm:px-3 py-1 rounded-lg text-white shadow-lg">
        <span className="text-xs sm:text-sm text-black">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-r from-blue-400 bg-indigo-400 rounded-xl" ref={dropdownRef}>
      <style jsx>{mobileStyles}</style>

      {isConnected ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowOptions(!showOptions);
          }}
          className="flex items-center space-x-2 bg-[#3E55E6] text-white shadow-sm hover:from-blue-600 hover:to-purple-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 p-2"
          style={{ borderRadius: "0.75rem" }}
        >
          <div className="wallet-icon w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
            {renderWalletIcon()}
          </div>

          {pathname !== "/" && (
            <div className="wallet-address-container flex-1 min-w-0">
              {walletAddress ? (
                <div className="wallet-address text-xs sm:text-sm font-bold">
                  <BasenameDisplay
                    address={walletAddress}
                    basenameClassName="basename-display"
                    addressClassName="address-display !text-slate-800"
                    isMobile={true}
                  />
                </div>
              ) : emailAddress ? (
                <span className="wallet-address text-xs sm:text-sm !text-slate-20 font-bold">
                  {formatEmail(emailAddress, 15)}
                </span>
              ) : (
                <span className="wallet-address text-xs sm:text-sm font-bold p-2">
                  Connected
                </span>
              )}
            </div>
          )}

          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="white"
            className="w-4 h-4 flex-shrink-0 text-slate-800"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m19.5 8.25-7.5 7.5-7.5-7.5"
            />
          </svg>
        </button>
      ) : (
        <button
          onClick={handleEmailLogin}
          className="flex items-center bg-[#3E55E6] hover:bg-blue-200 text-white hover:text-black rounded-lg transition-all duration-200 shadow-sm"
          disabled={isConnecting}
          style={{ borderRadius: "0.75rem" }}
        >
          <span className="sign-in-text text-xs sm:text-sm font-bold p-2">
            {isConnecting ? "Connecting..." : "Sign in"}
          </span>
        </button>
      )}

      {showOptions && isConnected && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-xl shadow-xl !bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 border-2 border-blue-100 dark:border-blue-900"
          onClick={(e) => e.stopPropagation()}
          style={{ maxHeight: "80vh", overflowY: "auto" }}
        >
          <div
            className="p-3 border-b border-gray-200"
            style={{
              border: "1px solid lightgray",
              borderRadius: "0.75rem",
              padding: "0.5rem",
              margin: "0.5rem",
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">
                Connected Account
              </h3>
              <span
                className="text-xs px-2 py-1 rounded-full text-green-600"
              >
                Active
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-800 break-all">
              {walletAddress ? (
                <BasenameDisplay
                  address={walletAddress}
                  basenameClassName="text-xs !text-slate-800"
                  isMobile={false}
                />
              ) : emailAddress ? (
                emailAddress
              ) : (
                "Connected"
              )}
            </div>
          </div>

          {!hasEmail && walletAddress && (
            <div className="p-3 border-b border-gray-200">
              <button
                onClick={handleLinkEmail}
                className="options w-full text-center px-4 py-2 text-blue-600 transition-colors rounded-lg"
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span className="hover:text-blue-800">Add Email Address</span>
                </div>
              </button>
            </div>
          )}

          <div className="p-2 space-y-1">
            <button
              onClick={handleLogout}
              className="w-full text-center text-slate-50 hover:text-slate-800 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-200 transition-colors"
            >
              <div className="flex items-center justify-center space-x-2">
                <FaSignOutAlt size={20} className=""/>
                <span>Logout</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {showAuthModal && isConnected && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
          <AuthenticationModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            address={walletAddress || emailAddress || ""}
          />
        </div>
      )}
    </div>
  );
});

WalletSelector.displayName = "WalletSelector";

export { BasenameDisplay };
export default WalletSelector;