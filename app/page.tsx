"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import * as LucideReact from "lucide-react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { stablecoins } from "./data/stablecoins";
import WalletSelector from "./components/WalletSelector";
import { useRef } from "react";
import {
  Globe2,
  Zap,
  Shield,
  CircleDollarSign,
  ArrowRight,
  CreditCard,
  Banknote,
  TrendingUp,
  PlayCircle,
} from "lucide-react";
import FeaturesSection from "./components/FeaturesSection";
import HowItWorksSection from "./components/HowItWorksSection";
import FaqSection from "./components/FaqSection";
import Supporters from "./components/SupportersSection";
import Image from "next/image";
import HeroSection from "@/components/HeroSection";

function HomeContent() {
  const [mounted, setMounted] = useState(false);
  const [expandedFaqs, setExpandedFaqs] = useState<{ [key: number]: boolean }>(
    {}
  );
  const router = useRouter();
  const { authenticated, user, login, logout } = usePrivy();
  const [loading, setLoading] = useState(false);
  const { Loader2 } = LucideReact;
  const walletSelectorRef = useRef<{ triggerLogin: () => void } | null>(null);

  const toggleFaq = useCallback((index: number) => {
    setExpandedFaqs((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className="min-h-screen w-full"
      style={{ "--tw-text-opacity": "1", zIndex: -1000 } as React.CSSProperties}
    >
      {/* <Image
        src="/vanishing-stripes.png"
        alt="Hero Background"
        fill
        className="object-cover border-b-2 border-slate-800"
      /> */}

      <Header />

      <div className="w-full pb-8 md:py-12 mx-auto" style={{ zIndex: -100 }}>
        {/* <Image
            src="/bg-waves.png"
            alt="Hero background"
            fill
            className="object-cover object-center opacity-30"
            priority
            quality={100}
          /> */}
        <div
          className="absolute top-0 left-0 w-full h-full h-[90vh] bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 "
          style={{
            zIndex: -100,
            // backgroundImage: 'linear-gradient(to bottom, rgba(0, 74, 109, 1), rgba(0, 74, 109, 0.9), rgba(0, 74, 109, 0.8), rgba(0, 74, 109, 0.7), rgba(0, 74, 109, 0.6), rgba(0, 74, 109, 0.5), rgba(0, 74, 109, 0.4), rgba(0, 74, 109, 0.3), rgba(0, 74, 109, 0.2), rgba(0, 74, 109, 0.05), transparent)'
          }}
        ></div>

        {/* Hero Section */}
        <HeroSection />

        <FeaturesSection />
        {/* FAQ Items with toggle functionality */}
        <FaqSection />
      </div>

      {/* CTA Section */}
      {/* Enhanced CTA Section */}
      <div className="w-[90%] mx-auto relative overflow-hidden">
        {/* Animated Background Elements */}
        {/* Grid Pattern Overlay */}
        <div className="relative z-10 px-8 text-center text-white">
          {/* Enhanced Heading */}
          <h2 className="text-2xl font-bold mb-8 leading-tight">
            <span className="bg-purple-900 bg-clip-text text-transparent drop-shadow-sm">
              Ready to accept stablecoin payments?
            </span>
          </h2>

          {/* Enhanced CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
            {!authenticated ? (
              <div className="flex flex-col items-center gap-6">
                <button
                  onClick={() => {
                    if (walletSelectorRef.current) {
                      walletSelectorRef.current.triggerLogin();
                    }
                  }}
                  className="relative flex items-center justify-center !bg-blue-700 hover:bg-blue-300 text-gray-900 font-bold text-lg p-2 md:py-4 md:px-8 rounded-xl md:rounded-2xl border-2 border-white/20 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 w-full sm:w-auto min-w-[280px] overflow-hidden"
                >
                  {/* Button Background Effect */}
                  {/* <div className="absolute inset-0 !bg-gradient-to-r !from-blue-600/5 !to-purple-600/5 opacity-0 group-hover:!opacity-100 transition-opacity duration-300"></div> */}
                  <span className="relative flex items-center text-white text-sm">
                    <svg
                      className="w-5 h-5 mr-3 text-blue-600"
                      fill="none"
                      stroke="white"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Sign in with Email or Wallet
                  </span>
                </button>

                <span className="hidden">
                  <WalletSelector ref={walletSelectorRef} />
                </span>

                {/* <p className="text-blue-100/80 text-sm max-w-md leading-relaxed">
                  Sign with Email or Connect your wallet to get started and
                  access your personalized Dashboard.
                </p> */}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="relative flex items-center justify-center !bg-blue-700 hover:bg-blue-300 text-gray-900 font-bold text-lg py-4 px-8 rounded-xl border-2 border-white/20 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 w-full sm:w-auto min-w-[280px] overflow-hidden"
                >
                  {/* Button Background Effect */}
                  <span className="relative flex items-center text-white text-sm">
                    <svg
                      className="w-5 h-5 mr-3 text-blue-600"
                      fill="none"
                      stroke="white"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                    Continue to Dashboard
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* <Supporters /> */}
      <Footer />
    </div>
  );
}

export default function HomePage() {
  return <HomeContent />;
}
