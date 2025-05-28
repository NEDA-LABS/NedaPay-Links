"use client";

import toast from "react-hot-toast";
import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { base } from "wagmi/chains";
import { Name } from "@coinbase/onchainkit/identity";
import { getBasename } from "../utils/getBaseName";
import { useUserSync } from "../hooks/useUserSync";
import { useLinkAccount } from "@privy-io/react-auth";

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
  isMobile = false,
  addressClassName=""
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
          return (address.startsWith("0x") ? address : `0x${address}`) as `0x${string}`;
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

  if (isLoading) {
    return (
      <div className="flex items-center space-x-1">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-600 h-4 w-16 rounded"></div>
      </div>
    );
  }

  if (baseName) {
    return (
      <span className={`text-sm text-black dark:text-white font-bold ${basenameClassName}`}>
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

const WalletSelector = forwardRef<{ triggerLogin: () => void }, WalletSelectorProps>(
  ({ triggerLogin }, ref) => {
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
    const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const isInitialRedirect = useRef<boolean>(true);

    // Email sync and update
    const { userData, isLoading: userLoading, addEmail, hasEmail } = useUserSync();

    // Privy hooks
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
    const emailAddress = user?.email?.address;
    const isConnected = authenticated && (walletAddress || emailAddress);

    // Expose handleEmailLogin via ref
    const handleEmailLogin = useCallback(async () => {
      if (!ready) {
        toast.error("Privy is not ready yet. Please wait a moment.");
        return;
      }

      setIsConnecting(true);
      setIsRedirecting(true);
      try {
        await login();
        const minDisplayTime = 2000;
        setTimeout(() => {
          setIsRedirecting(false);
        }, minDisplayTime);
      } catch (error: any) {
        console.error("Error with email login:", error);
        toast.error("Failed to login. Please try again.");
        setIsRedirecting(false);
      } finally {
        setIsConnecting(false);
      }
    }, [ready, login]);

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

    // Enhanced format email for mobile display
    const formatEmail = useCallback((email: string | undefined, maxLength: number = 20): string => {
      if (!email) return "Connected";

      if (email.length <= maxLength) return email;

      const [localPart, domain] = email.split("@");
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

        if (typeof window !== "undefined") {
          localStorage.setItem("walletConnected", "true");
          if (address) {
            localStorage.setItem("walletAddress", address);
          }

          document.cookie = "wallet_connected=true; path=/; max-age=86400; SameSite=Lax";

          window.dispatchEvent(
            new CustomEvent("walletConnected", {
              detail: { address, authenticated: true },
            })
          );
        }

        const path = window.location.pathname.replace(/\/+$/, "");
        if ((path === "" || path === "/") && isInitialRedirect.current) {
          console.log("Initiating redirect to /dashboard", { address, isConnected });
          setIsRedirecting(true);
          const minDisplayTime = 2000;

          const redirectTimeout = setTimeout(() => {
            setIsRedirecting(false);
          }, minDisplayTime);

          router.push("/dashboard");
          isInitialRedirect.current = false;

          return () => clearTimeout(redirectTimeout);
        }
      } else {
        if (typeof window !== "undefined") {
          localStorage.removeItem("walletConnected");
          localStorage.removeItem("walletAddress");
          document.cookie = "wallet_connected=; path=/; max-age=0; SameSite=Lax";

          window.dispatchEvent(new CustomEvent("walletDisconnected"));
        }
        setIsRedirecting(false);
        isInitialRedirect.current = true;
      }
    }, [ready, isConnected, walletAddress, emailAddress, router]);

    // Handle logout
    const handleLogout = async () => {
      try {
        await logout();
        setShowOptions(false);

        if (typeof window !== "undefined") {
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
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm1 2a1 1 0 000 2h10a1 1 0 100-2H5z"
            clipRule="evenodd"
          />
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
                  <BasenameDisplay
                    address={walletAddress}
                    basenameClassName="basename-display"
                    addressClassName="address-display"
                    isMobile={true}
                  />
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
            onClick={(e) => e.stopPropagation()}
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
                  <BasenameDisplay
                    address={walletAddress}
                    basenameClassName="text-xs text-gray-600 dark:text-gray-400"
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
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleLinkEmail}
                  className="w-full text-left px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
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
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3v1"
                    />
                  </svg>
                  <span>Logout</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {isRedirecting && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
              <svg
                className="animate-spin h-8 w-8 text-blue-500 dark:text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
              <span className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                Loading Dashboard...
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

WalletSelector.displayName = "WalletSelector";

export { BasenameDisplay };
export default WalletSelector;