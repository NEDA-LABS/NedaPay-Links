"use client";

import toast from "react-hot-toast";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { base } from "wagmi/chains";
import { Name } from "@coinbase/onchainkit/identity";
import { getBasename } from "../utils/getBaseName";
import { useUserSync } from "../hooks/useUserSync";
import { useLinkAccount } from "@privy-io/react-auth";

// Utility to detect mobile browsers
function isMobile() {
  return /android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(
    typeof navigator === "undefined" ? "" : navigator.userAgent
  );
}

export default function WalletSelector() {
  // Enhanced mobile-specific styles
  const mobileStyles = `
    @media (max-width: 640px) {
      .wallet-button {
        padding: 6px 10px !important;
        font-size: 0.75rem !important;
        min-height: 36px !important;
        max-width: calc(100vw - 40px) !important;
        white-space: nowrap !important;
      }
      .wallet-icon {
        width: 18px !important;
        height: 18px !important;
        margin-right: 6px !important;
        flex-shrink: 0 !important;
      }
      .wallet-address {
        font-size: 0.7rem !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        max-width: calc(100vw - 120px) !important;
      }
      .wallet-dropdown {
        width: calc(100vw - 20px) !important;
        max-width: 280px !important;
        left: 50% !important;
        right: auto !important;
        transform: translateX(-50%) !important;
      }
      .sign-in-text {
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }
      .wallet-address-container {
        overflow: hidden !important;
        flex: 1 !important;
        min-width: 0 !important;
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
      .wallet-button {
        padding: 4px 8px !important;
        font-size: 0.7rem !important;
        min-height: 32px !important;
      }
      .wallet-icon {
        width: 16px !important;
        height: 16px !important;
        margin-right: 4px !important;
      }
      .wallet-address {
        font-size: 0.65rem !important;
        max-width: calc(100vw - 100px) !important;
      }
      .basename-display {
        max-width: 80px !important;
      }
      .address-display {
        max-width: 60px !important;
      }
    }
  `;

  const [showOptions, setShowOptions] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [baseName, setBaseName] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  //email sync and update
  const { userData, isLoading: userLoading, addEmail, hasEmail } = useUserSync();

  console.log("hasEmail", hasEmail); //debugging

  // Privy hooks - destructure all needed properties
  const { 
    authenticated, 
    user, 
    connectWallet, 
    logout, 
    ready,
    login
  } = usePrivy();

  // Move useLinkAccount hook to the top level of the component
  const { linkEmail } = useLinkAccount({
    onSuccess: ({ user, linkMethod, linkedAccount }) => {
      console.log('Linked account to user ', linkedAccount); // debugging to be handled by ui later
      toast.success("Email linked successfully!");
    },
    onError: (error) => {
      console.error('Failed to link account with error ', error); // debugging to be handled by ui later
      toast.error("Failed to link email. Please try again.");
    }
  });

  // Get the primary wallet address safely
  const walletAddress = user?.wallet?.address;
  const emailAddress = user?.email?.address;
  const isConnected = authenticated && (walletAddress || emailAddress);

  // Debug Privy state
  useEffect(() => {
    console.log("Privy State:", {
      ready,
      authenticated,
      user,
      walletAddress,
      walletClientType: user?.wallet?.walletClientType,
      emailAddress,
      isConnected,
    });
  }, [ready, authenticated, user, walletAddress, emailAddress, isConnected]);

  // Enhanced format address for mobile display
  const formatAddress = useCallback((address: string | undefined, isMobile: boolean = false): string => {
    if (!address || typeof address !== "string" || !address.startsWith("0x") || address.length < 10) {
      return "Unknown Address";
    }
    
    // More aggressive truncation for mobile
    if (isMobile) {
      return `${address.substring(0, 4)}...${address.substring(address.length - 3)}`;
    }
    
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }, []);

  // Enhanced format email for mobile display
  const formatEmail = useCallback((email: string | undefined, maxLength: number = 20): string => {
    if (!email) return "Connected";
    
    if (email.length <= maxLength) return email;
    
    const [localPart, domain] = email.split('@');
    if (localPart.length > maxLength - domain.length - 4) {
      return `${localPart.substring(0, maxLength - domain.length - 7)}...@${domain}`;
    }
    
    return email;
  }, []);

  // Close dropdown when clicking or touching outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };
    
    if (showOptions) {
      document.addEventListener("mousedown", handleClickOutside as EventListener);
      document.addEventListener("touchstart", handleClickOutside as EventListener);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside as EventListener);
      document.removeEventListener("touchstart", handleClickOutside as EventListener);
    };
  }, [showOptions]);

  // Handle wallet connection state and persistence
  useEffect(() => {
    if (ready && isConnected) {
      const address = walletAddress || emailAddress || "";
      
      // Store connection state
      if (typeof window !== 'undefined') {
        localStorage.setItem("walletConnected", "true");
        if (address) {
          localStorage.setItem("walletAddress", address);
        }
        
        // Set cookie for server-side detection
        document.cookie = "wallet_connected=true; path=/; max-age=86400; SameSite=Lax";
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent("walletConnected", { 
          detail: { address, authenticated: true } 
        }));
      }

      // Redirect to dashboard if on homepage
      const path = window.location.pathname.replace(/\/+$/, "");
      if (path === "" || path === "/") {
        console.log("Redirecting to /dashboard", { address, isConnected });
        router.push("/dashboard");
      }
    } else {
      // Clear connection state when not connected
      if (typeof window !== 'undefined') {
        localStorage.removeItem("walletConnected");
        localStorage.removeItem("walletAddress");
        document.cookie = "wallet_connected=; path=/; max-age=0; SameSite=Lax";
        
        window.dispatchEvent(new CustomEvent("walletDisconnected"));
      }
    }
  }, [ready, isConnected, walletAddress, emailAddress, router]);

  // Basename fetching with proper error handling
  useEffect(() => {
    if (!walletAddress) {
      setBaseName(null);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const fetchBasename = async () => {
      try {
        const toHexAddress = (address: string): `0x${string}` => {
          return (address.startsWith("0x") ? address : `0x${address}`) as `0x${string}`;
        };

        const formattedAddress = toHexAddress(walletAddress);
        const basename = await getBasename(formattedAddress);
        
        if (isMounted && !controller.signal.aborted) {
          setBaseName(basename || null);
        }
      } catch (error) {
        console.error("Error fetching basename:", error);
        if (isMounted && !controller.signal.aborted) {
          setBaseName(null);
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
  }, [walletAddress]);

  // Handle wallet connection with proper error handling
  const handleConnectWallet = async () => {
    if (!ready) {
      toast.error("Privy is not ready yet. Please wait a moment.");
      return;
    }

    setIsConnecting(true);
    try {
      await connectWallet();
      toast.success("Wallet connected successfully!");
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      
      // Handle specific error cases
      if (error?.message?.includes("User rejected")) {
        toast.error("Connection cancelled by user");
      } else if (error?.message?.includes("No wallet")) {
        toast.error("Please install a wallet extension like MetaMask");
      } else {
        toast.error("Failed to connect wallet. Please try again.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle email/SMS login
  const handleEmailLogin = async () => {
    if (!ready) {
      toast.error("Privy is not ready yet. Please wait a moment.");
      return;
    }

    setIsConnecting(true);
    try {
      await login();
      toast.success("Logged in successfully!");
    } catch (error: any) {
      console.error("Error with email login:", error);
      toast.error("Failed to login. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle logout with cleanup
  const handleLogout = async () => {
    try {
      await logout();
      setShowOptions(false);
      
      // Clear all stored data
      if (typeof window !== 'undefined') {
        localStorage.removeItem("walletConnected");
        localStorage.removeItem("walletAddress");
        document.cookie = "wallet_connected=; path=/; max-age=0; SameSite=Lax";
      }
      
      toast.success("Logged out successfully");
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  };

  // Handle linking email to existing wallet account
  const handleLinkEmail = async () => {
    try {
      await linkEmail();
    } catch (error) {
      console.error("Error linking email:", error);
      // Error handling is already done in the useLinkAccount onError callback
    }
  };

  // Render wallet icon based on wallet type
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
    
    // Default wallet icon
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm1 2a1 1 0 000 2h10a1 1 0 100-2H5z" clipRule="evenodd" />
      </svg>
    );
  };

  if (!ready) {
    return (
      <div className="wallet-button flex items-center bg-gray-200 dark:bg-gray-700 px-2 sm:px-3 py-1 rounded-lg">
        <span className="text-xs sm:text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <style jsx>{mobileStyles}</style>
      
      {isConnected ? (
        // Connected state with better mobile handling
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowOptions(!showOptions);
          }}
          className="wallet-button flex items-center space-x-2 bg-white/80 dark:bg-slate-900/60 hover:bg-blue-50 dark:hover:bg-blue-800 text-slate-800 dark:text-white border-2 border-blue-400 dark:border-blue-300 px-2 sm:px-3 py-1 rounded-lg transition-all duration-200 shadow-sm"
        >
          <div className="wallet-icon w-6 h-6 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900 flex-shrink-0">
            {renderWalletIcon()}
          </div>
          
          <div className="wallet-address-container flex-1 min-w-0">
            {walletAddress ? (
              <div className="wallet-address text-xs sm:text-sm font-bold">
                {baseName ? (
                  <div className="flex flex-col">
                    <span className="basename-display text-sm text-black font-bold">
                      {baseName}
                    </span>
                    <span className="address-display text-xs text-gray-500">
                      ({formatAddress(walletAddress, true)})
                    </span>
                  </div>
                ) : (
                  <div className="address-display">
                    <Name address={walletAddress as `0x${string}`} chain={base as any} />
                  </div>
                )}
              </div>
            ) : emailAddress ? (
              <span className="wallet-address text-xs sm:text-sm font-bold">
                {formatEmail(emailAddress, 15)}
              </span>
            ) : (
              <span className="wallet-address text-xs sm:text-sm font-bold">Connected</span>
            )}
          </div>
          
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4 flex-shrink-0"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      ) : (
        // Disconnected state with better mobile text handling
        <button
          onClick={handleEmailLogin}
          className="wallet-button flex items-center bg-white/80 dark:bg-slate-900/60 hover:bg-blue-50 dark:hover:bg-blue-800 text-slate-800 dark:text-white border-2 border-blue-400 dark:border-blue-300 px-2 sm:px-3 py-1 rounded-lg transition-all duration-200 shadow-sm"
          disabled={isConnecting}
        >
          <span className="sign-in-text text-xs sm:text-sm font-bold">
            {isConnecting ? "Connecting..." : "Sign in"}
          </span>
        </button>
      )}

      {showOptions && isConnected && (
        <div
          className="wallet-dropdown absolute right-0 mt-2 w-64 rounded-xl shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 border-2 border-blue-100 dark:border-blue-900"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          style={{ maxHeight: "80vh", overflowY: "auto" }}
        >
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300">
                Connected Account
              </h3>
              <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                Active
              </span>
            </div>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 break-all">
              {walletAddress ? (
                <Name address={walletAddress as `0x${string}`} chain={base as any} />
              ) : emailAddress ? (
                emailAddress
              ) : (
                "Connected"
              )}
            </div>
          </div>
          
          {/* Add email section if user doesn't have email */}
          {!hasEmail && walletAddress && (
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={handleLinkEmail}
                className="w-full text-left px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Email Address</span>
                </div>
              </button>
            </div>
          )}
          
          <div className="p-2 space-y-1">
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}