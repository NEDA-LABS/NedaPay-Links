"use client";

import { BASE_MAINNET_RPCS, getRandomRPC } from "../utils/rpcConfig";
import * as ethers from "ethers";
import toast from "react-hot-toast";
import { useState, useRef, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { metaMask, coinbaseWallet, walletConnect } from "wagmi/connectors";
import { useRouter } from "next/navigation";
import { base } from "wagmi/chains";
import { Name } from "@coinbase/onchainkit/identity";
import { getBasename } from "../utils/getBaseName";

// Utility to detect mobile browsers
function isMobile() {
  return /android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(
    typeof navigator === "undefined" ? "" : navigator.userAgent
  );
}

export default function WalletSelector() {
  // Mobile-specific styles
  const mobileStyles = `
    @media (max-width: 640px) {
      .wallet-button {
        padding: 4px 8px !important;
        font-size: 0.7rem !important;
      }
      .wallet-icon {
        width: 20px !important;
        height: 20px !important;
        margin-right: 4px !important;
      }
      .wallet-address {
        font-size: 0.7rem !important;
      }
      .wallet-dropdown {
        width: 220px !important;
      }
    }
  `;

  const [showOptions, setShowOptions] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [baseName, setBaseName] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Use wagmi hooks directly
  const { address, isConnected, connector } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  // Format address for display
  const formatAddress = (address: string | undefined): string => {
    if (
      !address ||
      typeof address !== "string" ||
      !address.startsWith("0x") ||
      address.length < 10
    )
      return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Close dropdown when clicking or touching outside
  const handleClickOutside = (event: MouseEvent | TouchEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setShowOptions(false);
    }
  };

  // Add event listeners for clicking and touching outside
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside as EventListener);
    document.addEventListener("touchstart", handleClickOutside as EventListener);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside as EventListener);
      document.removeEventListener("touchstart", handleClickOutside as EventListener);
    };
  }, []);

  // Always write the connected wallet address to localStorage on change
  useEffect(() => {
    if (isConnected && address) {
      localStorage.setItem("walletAddress", address);
    } else {
      localStorage.removeItem("walletAddress");
    }
  }, [isConnected, address]);

  // Check for connected wallet and store in localStorage and cookie
  useEffect(() => {
    if (address && isConnected) {
      // Store wallet connection in localStorage
      localStorage.setItem("walletConnected", "true");
      localStorage.setItem("walletAddress", address);

      // Set a cookie for the middleware to check
      document.cookie = "wallet_connected=true; path=/; max-age=86400"; // 24 hours

      // Immediately dispatch a custom event so dashboard can react instantly
      window.dispatchEvent(
        new CustomEvent("walletConnected", { detail: { address } })
      );

      // Redirect to dashboard immediately after successful connection
      // Only redirect to dashboard if on the homepage/root ('' or '/')
      let path = window.location.pathname.replace(/\/+$/, ""); // Remove all trailing slashes
      if (path === "" || path === "/") {
        console.log(
          "[DEBUG] Redirecting to /dashboard from WalletSelector. Current path:",
          window.location.pathname
        );
        router.push("/dashboard");
      }
    } else {
      // Clear wallet connection from localStorage
      localStorage.removeItem("walletConnected");
      localStorage.removeItem("walletAddress");

      // Clear the cookie
      document.cookie = "wallet_connected=; path=/; max-age=0";
    }
  }, [address, isConnected, router]);

  // Basename fetching
  function toHexAddress(address: `0x${string}` | undefined | string): `0x${string}` {
    if (!address || typeof address !== "string") {
      throw new Error("Invalid address provided");
    }
    return (address.startsWith("0x") ? address : `0x${address}`) as `0x${string}`;
  }

  useEffect(() => {
    if (!address) {
      setBaseName(null);
      return;
    }
  
    const address_formatted = toHexAddress(address);
    if (!address_formatted) {
      console.error("Invalid address format");
      setBaseName(null);
      return;
    }
  
    let isMounted = true;
    const debounceTimer = setTimeout(() => {
      const fetchData = async () => {
        try {
          const basename = await getBasename(address_formatted);
          if (basename === undefined) {
            throw new Error("Failed to resolve address to name");
          }
          if (isMounted) {
            setBaseName(basename);
          }
        } catch (error) {
          console.error("Error fetching base name:", error);
          if (isMounted) {
            setBaseName(null);
          }
        }
      };
      fetchData();
    }, 300); // 300ms debounce
  
    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
    };
  }, [address]);

  // Function to handle MetaMask connection
  const handleConnectMetaMask = async () => {
    setIsConnecting(true);
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum !== "undefined") {
        try {
          // Try to connect with MetaMask
          const metaMaskConnector = metaMask();
          await connect({ connector: metaMaskConnector });
        } catch (error) {
          console.error("Error connecting to MetaMask:", error);
        }
      } else if (isMobile()) {
        // On mobile, open MetaMask deep link to this dapp
        const dappUrl = encodeURIComponent(window.location.href);
        window.open(
          `https://metamask.app.link/dapp/${window.location.host}`,
          "_blank"
        );
      } else {
        // MetaMask not installed, open download page
        window.open("https://metamask.io/download/", "_blank");
        throw new Error("MetaMask not installed");
      }
    } catch (error) {
      console.error("Error connecting to MetaMask", error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Function to handle WalletConnect connection
  const handleConnectWalletConnect = async () => {
    console.log("Connecting with WalletConnect...");
    setIsConnecting(true);
    try {
      const walletConnectConnector = walletConnect({
        projectId: "0ba1867b1fc0af11b0cf14a0ec8e5b0f",
      });

      await connect({ connector: walletConnectConnector });
      setShowOptions(false);
      // Note: The redirect will happen in the useEffect when isConnected changes
    } catch (error) {
      console.error("Error connecting with WalletConnect", error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Function to handle Coinbase Wallet connection
  const handleConnectCoinbase = async () => {
    setIsConnecting(true);
    try {
      // Coinbase Wallet deep link for mobile
      if (isMobile() && typeof window.ethereum === "undefined") {
        // Open Coinbase Wallet deep link to this dapp
        window.open(
          `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(
            window.location.href
          )}`,
          "_blank"
        );
        return;
      }
      // Create Coinbase Wallet connector (desktop or mobile in-app browser)
      const coinbaseConnector = coinbaseWallet({
        appName: "NEDA Pay",
      });

      await connect({ connector: coinbaseConnector });
      setShowOptions(false);
      // Note: The redirect will happen in the useEffect when isConnected changes
    } catch (error) {
      console.error("Error connecting to Coinbase Wallet", error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Function to handle wallet disconnection
  const handleDisconnect = () => {
    disconnect();
    setShowOptions(false);

    // Clear wallet connection from localStorage
    localStorage.removeItem("walletConnected");
    localStorage.removeItem("walletAddress");

    // Clear the cookie
    document.cookie = "wallet_connected=; path=/; max-age=0";

    // Redirect to home page using Next.js router
    router.push("/");
  };

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
          <div className="wallet-icon w-6 h-6 rounded-full flex items-center justify-center mr-2 bg-blue-100 dark:bg-blue-900">
            {connector?.id === "coinbaseWallet" ||
            connector?.name === "Coinbase Wallet" ? (
              // Coinbase Wallet Logo
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="12" fill="#0052FF" />
                <circle cx="12" cy="12" r="7.2" fill="#fff" />
                <rect x="8" y="11" width="8" height="2" rx="1" fill="#0052FF" />
              </svg>
            ) : (
              // MetaMask Logo (default)
              <img src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/metamask-icon.svg" alt="MetaMask Logo" width="18" height="18"/>

            )}
          </div>
          <div className="wallet-address text-xs sm:text-sm font-bold">
            {address ? (
              baseName ? (
                <>
                  <span className="ml-1 text-sm text-black font-bold">
                    {baseName}
                  </span>
                  <br />
                  <span className="ml-1 text-xs text-gray-500">
                    ({formatAddress(address)})
                  </span>
                </>
              ) : (
                <Name address={address as `0x${string}`} chain={base as any} />
              )
            ) : (
              "Connect Wallet"
            )}
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4 ml-1"
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
          onClick={(e) => {
            e.stopPropagation();
            setShowOptions(!showOptions);
          }}
          className="wallet-button flex items-center bg-white/80 dark:bg-slate-900/60 hover:bg-blue-50 dark:hover:bg-blue-800 text-slate-800 dark:text-white border-2 border-blue-400 dark:border-blue-300 px-2 sm:px-3 py-1 rounded-lg transition-all duration-200 shadow-sm"
          disabled={isConnecting}
        >
          <span className="text-xs sm:text-sm font-bold">
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4 ml-1 inline"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m19.5 8.25-7.5 7.5-7.5-7.5"
            />
          </svg>
        </button>
      )}

      {showOptions && (
        <div
          className="wallet-dropdown absolute right-0 mt-2 w-64 rounded-xl shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-60 border-2 border-blue-100 dark:border-blue-900"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          style={{ maxHeight: "80vh", overflowY: "auto" }}
        >
          {isConnected ? (
            <>
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300">
                    Connected Wallet
                  </h3>
                  <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                    Active
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  {address ? (
                    <Name
                      address={address as `0x${string}`}
                      chain={base as any}
                    />
                  ) : (
                    "Not connected"
                  )}
                </div>
              </div>
              <div className="p-2 space-y-1">
                <button
                  onClick={handleDisconnect}
                  className="block w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-300">
                  Select Wallet
                </h3>
              </div>
              <div className="p-2 space-y-2">
                {/* WalletConnect Option */}
                <button
                  onClick={handleConnectWalletConnect}
                  disabled={isConnecting}
                  className="w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-700 transition-colors text-left"
                >
                  <div className="w-6 h-6 flex-shrink-0 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zm3.536-10.95a1 1 0 0 1 1.415 1.415l-4.95 4.95a1 1 0 0 1-1.415 0l-2.121-2.122a1 1 0 1 1 1.415-1.415l1.414 1.415 4.242-4.243z"
                        fill="#3396FF"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-300">
                      WalletConnect
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Connect with WalletConnect
                    </div>
                  </div>
                </button>

                {/* Coinbase Wallet Option */}
                <div>
                  <button
                    onClick={handleConnectCoinbase}
                    disabled={isConnecting}
                    className="w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="w-6 h-6 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z"
                          fill="#0052FF"
                        />
                        <path
                          d="M12.0002 4.80005C8.0002 4.80005 4.8002 8.00005 4.8002 12C4.8002 16 8.0002 19.2 12.0002 19.2C16.0002 19.2 19.2002 16 19.2002 12C19.2002 8.00005 16.0002 4.80005 12.0002 4.80005ZM9.6002 14.4C8.8002 14.4 8.0002 13.6 8.0002 12.8C8.0002 12 8.8002 11.2 9.6002 11.2C10.4002 11.2 11.2002 12 11.2002 12.8C11.2002 13.6 10.4002 14.4 9.6002 14.4ZM14.4002 14.4C13.6002 14.4 12.8002 13.6 12.8002 12.8C12.8002 12 13.6002 11.2 14.4002 11.2C15.2002 11.2 16.0002 12 16.0002 12.8C16.0002 13.6 15.2002 14.4 14.4002 14.4Z"
                          fill="white"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-300">
                        Coinbase Wallet
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {isConnecting ? "Connecting..." : "Connect"}
                      </div>
                    </div>
                  </button>
                </div>

                {/* MetaMask Option */}
                <button
                  onClick={handleConnectMetaMask}
                  disabled={isConnecting}
                  className="w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="w-6 h-6 flex-shrink-0 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                  <img src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/metamask-icon.svg" alt="MetaMask Logo" width="18" height="18"/>


                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-300">
                      MetaMask
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {isConnecting ? "Connecting..." : "Connect"}
                    </div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
