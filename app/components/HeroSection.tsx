import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import HeroFeaturesHomePage from "./HeroFeaturesHomePage";
import YouTubeEmbedButton from "./YouTubeEmbedButton";
import HeroFlags from "./HeroFlags";
import WalletSelector from "./WalletSelector";
import Image from "next/image";
import { ArrowUpRight, Loader2 } from "lucide-react";
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
  const [isShortScreen, setIsShortScreen] = useState(false);

useEffect(() => {
  const checkHeight = () => setIsShortScreen(window.innerHeight <= 700);
  console.log("height", window.innerHeight);
  checkHeight();
  window.addEventListener('resize', checkHeight);
  return () => window.removeEventListener('resize', checkHeight);
}, []);

const avatars = [
  { id: 1, color: 'bg-yellow-400', image: '/base.svg' },
  { id: 2, color: 'bg-blue-400', image: '/polygon.svg' },
  { id: 3, color: 'bg-pink-400', image: '/scroll.svg' },
  { id: 4, color: 'bg-purple-400', image: '/arbitrum.svg' },
  { id: 5, color: 'bg-orange-400', image: '/bnb.svg' },
  { id: 6, color: 'bg-green-400', image: '/celo.svg' },
  { id: 7, color: 'bg-teal-400', image: '/optimism.svg' }
];

  return (
    <div className="h-[85vh] w-[100vw] mt-[-100px] pt-[100px] sm:mb-[120px] md:pt-[50px]">
      <CurrencyTicker />
      <Image
        src="/vanishing-stripes.png"
        alt="Hero Background"
        fill
        className="object-cover border-b-2 border-slate-800 opacity-30"
      />
      <div className="flex flex-col lg:flex-row justify-between lg:gap-8 px-4 py-8 lg:py-0 items-center rounded-2xl relative sm:mt-[30px] mt-0">
        <div className="flex flex-col gap-6">
          <ShinyText
            text="Unlock Seamless Payments Globally"
            className="!text-2xl  lg:!text-4xl 2xl:!text-7xl font-bold tracking-tight bg-gradient-to-r from-slate-100 via-purple-300 to-indigo-300 bg-clip-text leading-tight"
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
                className="group relative !px-4 !py-2 sm:!px-8 sm:!py-4 !bg-gradient-to-r !from-blue-600 !to-indigo-600 hover:!from-blue-700 hover:!to-indigo-700 text-white font-semibold rounded-xl md:!rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-3"
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
              <div className="flex flex-row gap-2">
                <button
                  onClick={() => {
                    setLoading(true);
                    router.push("/dashboard");
                  }}
                  disabled={loading}
                  className="relative items-center !px-4 !py-2 !bg-[#3E55E6] hover:!from-blue-700 hover:!to-indigo-700 text-white font-semibold rounded-xl md:!rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed h-[45px]"
                >
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <span className="xl:text-xl text-white text-center">
                      Explore Dashboard
                    </span>
                  )}
                </button>
                <YouTubeEmbedButton className="h-[45px]" />
              </div>
            </div>
          )}
        </div>
        <div className="flex w-[80%] items-center gap-4 pt-20 lg:py-0 my-auto">
          <div className="relative w-full xl:w-[80%] items-center justify-center">
            <div className="absolute top-3 left-3 md:top-5 md:left-5 w-full h-full bg-gradient-to-br from-pink-600 to-purple-500 opacity-80 rounded-3xl" />
            {/* <div className="absolute top-[-20px] left-[-20px] rounded-full w-[100px] h-[100px] bg-gradient-to-br from-purple-600 to-pink-500 z-10 "/> */}
            <Image
              src="/landing.png"
              alt="folks"
              width={612}
              height={408}
              className="w-full h-full rounded-3xl opacity-95"
            />
          </div>
        </div>
      </div>
       {/* Profile avatars section */}
       <div className="flex flex-row items-center mb-6">
          <div className="flex -space-x-2 md:-space-x-10 mx-auto lg:mx-0">
            {avatars.map((avatar, index) => (
              <div
                key={avatar.id}
                className={`w-8 h-8 md:w-20 md:h-20 rounded-full aspect-square flex items-center justify-center text-white font-semibold text-sm relative z-${10 - index}`}
                style={{ zIndex: 10 - index }}
              >
                <Image src={avatar.image} alt={avatar.id.toString()} width={50} height={50} className="rounded-full bg-white"/>
              </div>
            ))}
            <div className="flex ml-6 items-center justify-center">
            <div className="text-white text-sm md:text-2xl font-bold items-center justify-center pl-2">5+ Chains</div>
            {/* <div className="text-sm">Chains</div> */}
          </div>
          </div>
          
          {/* <div className="ml-6">
            <div className="text-white text-sm md:text-2xl font-bold">5+</div>
            <div className="text-sm">Chains</div>
          </div> */}
        </div>
      {/* miniapp cta */}
      <div className="w-full items-center justify-between absolute bottom-3" style={{ display: isShortScreen ? 'none' : 'flex' }}>
        <div className="shadow-2xl">
          <div className="pl-4 flex flex-col items-start justify-between flex-wrap relative z-10">
            <div className="flex items-center gap-5 justify-center pl-2">
              <div>
                <h3 className="text-white/80 text-sm font-medium mb-2">
                  Also available as a{" "}
                  <span className="text-sm font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
                    Mini App
                  </span>{" "}
                  in Farcaster
                </h3>
              </div>
            </div>
            <a
              href="#"
              className="flex items-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-pink-500 hover:to-red-500 text-white px-7 md:py-1 rounded-full font-semibold shadow-lg shadow-purple-500/40 hover:shadow-pink-500/40 transition-all duration-300 hover:-translate-y-1 border border-white/20"
            >
              <span>Launch Mini App</span>
              <div className="bg-white/20 rounded-full p-2 transition-transform duration-300 hover:translate-x-1">
                <ArrowUpRight />
              </div>
            </a>
          </div>
        </div>
        {/* Icon and description section */}
        {/* <div className="flex items-start space-x-4 w-[200px] mr-[150px]">
          <div className="relative w-15 h-15 bg-green-400 rounded-full flex items-center justify-center flex-shrink-0 my-auto">
            <div className="absolute top-0 -left-5 w-15 h-15 border-1 border-green-400 rounded-full"/>
            <ArrowUpRight />
          </div>
          
          <div className="text-gray-300 border-l-2 p-2">
            <p className="leading-relaxed text-justify text-sm">
              All Business Tools you Need for Digital Payments in one Place
            </p>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default HeroSection;
