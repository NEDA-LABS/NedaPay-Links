import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import HeroFeaturesHomePage from "./HeroFeaturesHomePage";
import YouTubeEmbedButton from "./YouTubeEmbedButton";
import HeroFlags from "./HeroFlags";
import WalletSelector from "./WalletSelector";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import ShinyText from "./ShinyText";
import CurrencyTicker from "@/offramp/RatesComponents";

const HeroSection = () => {
  const [mounted, setMounted] = useState(false);
  const [expandedFaqs, setExpandedFaqs] = useState<{ [key: number]: boolean }>(
    {}
  );
  const router = useRouter();
  const { authenticated, user, login, logout } = usePrivy();
  const [loading, setLoading] = useState(false);
  const walletSelectorRef = useRef<{ triggerLogin: () => void } | null>(null);

  return (
    <div className="lg:h-[100vh] ">
      <CurrencyTicker />
      <div className="grid grid-cols-1 lg:grid-cols-2 justify-between gap-6 lg:gap-8 px-4 items-center rounded-2xl relative">
        <div className="flex flex-col gap-6">
          <ShinyText
            text="Unlock Seamless Payments Globally"
            className="!text-2xl  lg:!text-5xl xl:!text-7xl font-bold tracking-tight bg-gradient-to-r from-slate-100 via-purple-300 to-indigo-300 bg-clip-text leading-tight"
          />
          {/* <h1 className="!text-2xl  lg:!text-5xl xl:!text-7xl font-bold tracking-tight bg-gradient-to-r from-slate-100 via-purple-300 to-indigo-300 bg-clip-text text-transparent leading-tight">
            Unlock Seamless Payments Globally
          </h1> */}

          <p className="!text-l lg:!text-xl  font-bold text-slate-100 leading-relaxed drop-shadow-md">
            Accept Stablecoins, Swap instantly, Cash Out Easily
          </p>
          {/* Clean CTA Section */}

          {!authenticated ? (
            <div className="flex flex-row items-start gap-4 w-full items-stretch">
              <button
                onClick={() => {
                  if (walletSelectorRef.current) {
                    walletSelectorRef.current.triggerLogin();
                  }
                }}
                className="group relative !px-4 !py-2 sm:!px-8 sm:!py-4 !bg-gradient-to-r !from-blue-600 !to-indigo-600 hover:!from-blue-700 hover:!to-indigo-700 text-white font-semibold !rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-3"
              >
                <span className="text-xs sm:text-sm lg:text-lg">
                  Start with Email or Wallet
                </span>{" "}
              </button>

              <YouTubeEmbedButton />

              <span hidden={true}>
                <WalletSelector ref={walletSelectorRef} />
              </span>
            </div>
          ) : (
            <div className="flex flex-row items-start gap-6">
              <button
                onClick={() => {
                  setLoading(true);
                  router.push("/dashboard");
                }}
                disabled={loading}
                className="relative items-center !px-8 !py-4 !bg-[#3E55E6] hover:!from-blue-700 hover:!to-indigo-700 text-white font-semibold !rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <span className="lg:text-xl text-white text-center">
                    Explore Dashboard
                  </span>
                )}
              </button>
              <YouTubeEmbedButton />
            </div>
          )}
        </div>
        <div className="flex flex-col items-right gap-4">
          <HeroFeaturesHomePage />
          {/* <HeroFlags /> */}
        </div>
      </div>
      
    </div>
  );
};

export default HeroSection;
