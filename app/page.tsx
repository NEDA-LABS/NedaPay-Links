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
      className="min-h-screen"
      style={{ "--tw-text-opacity": "1" } as React.CSSProperties}
    >
      <Header />

      <div
        className="container mx-auto max-w-7xl px-4 pb-8 md:py-12"
        style={{ zIndex: -100 }}
      >
        <Image
            src="/bg-waves.png"
            alt="Hero background"
            fill
            className="object-cover object-center"
            priority
            quality={100}
          />
          <div className="absolute top-0 left-0 w-full h-full bg-teal-950 lg:h-[80vh]" style={{ zIndex: -100 }}></div>
          
        {/* Hero Section */}
        <HeroSection />
        
        <FeaturesSection />
        {/* How It Works Section */}
        <HowItWorksSection />
        {/* FAQ Items with toggle functionality */}
        <FaqSection />
      </div>

      {/* CTA Section */}
      {/* Enhanced CTA Section */}
      <div className="w-[90%] mx-auto bg-gradient-to-r from-blue-600 to-purple-400 relative overflow-hidden rounded-b-3xl mb-12 shadow-2xl">
        {/* Animated Background Elements */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 dark:from-indigo-500/15 dark:to-purple-500/15 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-indigo-400/20 dark:from-blue-500/15 dark:to-indigo-500/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-blue-400/10 dark:from-purple-500/8 dark:to-blue-500/8 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        {/* Grid Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-10 dark:opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        ></div>

        <div className="relative z-10 px-8 py-20 text-center text-white">
          {/* Enhanced Heading */}
          <h2 className="text-2xl font-bold mb-8 leading-tight">
            <span className="bg-clip-text text-transparent !bg-gradient-to-r !from-white !via-blue-100 !to-indigo-100 drop-shadow-sm">
              Ready to accept
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-100 via-white to-purple-100 drop-shadow-sm">
              stablecoin payments?
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
                  className="group relative flex items-center justify-center !bg-white hover:!bg-gray-50 !text-gray-900 font-bold text-sm py-4 px-8 rounded-3xl border-2 border-white/20 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 w-full sm:w-auto min-w-[280px] overflow-hidden"
                >
                  {/* Button Background Effect */}
                  <div className="absolute inset-0 !bg-gradient-to-r !from-blue-600/5 !to-purple-600/5 opacity-0 group-hover:!opacity-100 transition-opacity duration-300"></div>
                  <span className="relative flex items-center">
                    <svg
                      className="w-5 h-5 mr-3 text-blue-600"
                      fill="none"
                      stroke="currentColor"
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

                <p className="text-blue-100/80 text-sm max-w-md leading-relaxed">
                  Sign with Email or Connect your wallet to get started and
                  access your personalized Dashboard.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="group relative flex items-center justify-center bg-white hover:bg-gray-50 text-gray-900 font-bold text-lg py-4 px-8 rounded-3xl border-2 border-white/20 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 w-full sm:w-auto min-w-[280px] overflow-hidden"
                >
                  {/* Button Background Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative flex items-center text-slate-800 text-sm">
                    <svg
                      className="w-5 h-5 mr-3 text-blue-600"
                      fill="none"
                      stroke="currentColor"
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

          {/* Enhanced Feature List */}
          <div className="flex flex-wrap justify-center gap-8 max-w-4xl mx-auto">
            <div className="flex items-center text-blue-50 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-center w-8 h-8 mr-3 bg-green-400/20 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-300"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="font-medium text-sm">No setup fees</span>
            </div>

            <div className="flex items-center text-blue-50 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-center w-8 h-8 mr-3 bg-blue-400/20 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-300"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="font-medium text-sm">Instant settlements</span>
            </div>

            <div className="flex items-center text-blue-50 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center justify-center w-8 h-8 mr-3 bg-purple-400/20 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-purple-300"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="font-medium text-sm">Global stablecoins</span>
            </div>
          </div>
        </div>
      </div>
      <Supporters />
      <Footer />
    </div>
  );
}

export default function HomePage() {
  return <HomeContent />;
}
