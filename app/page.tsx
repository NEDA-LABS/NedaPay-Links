"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { stablecoins } from "./data/stablecoins";
import WalletSelector from "./components/WalletSelector";
import { useRef } from "react";
import Flags from "./components/Flags";
import HeroFeaturesHomePage from "./components/HeroFeaturesHomePage";
import { Coins, Repeat, BarChart2, Settings, Wallet, Link, DollarSign, Repeat2 } from "lucide-react";
import FeaturesSection from "./components/FeaturesSection";
import HowItWorksSection from "./components/HowItWorksSection";
import FaqSection from "./components/FaqSection";

function HomeContent() {
  const [mounted, setMounted] = useState(false);
  const [expandedFaqs, setExpandedFaqs] = useState<{ [key: number]: boolean }>(
    {}
  );
  const router = useRouter();
  const { authenticated, user } = usePrivy();
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
      className="min-h-screen bg-gradient-to-br from-blue-50 to-white"
      style={{ "--tw-text-opacity": "1" } as React.CSSProperties}
    >
      <Header />

      <div
        className="container mx-auto max-w-7xl px-4 py-8 md:py-12"
        style={{ zIndex: -100 }}
      >
        {/* Hero Section */}
        <div className="hero-section flex flex-col lg:flex-row items-center justify-between mb-16 gap-4 sm:gap-8 p-4 sm:p-6 rounded-2xl">
          <div className="w-full lg:w-1/2 text-left space-y-8">
            <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-pulse-slow">
              Revolutionize Your Business Payments
            </h1>
            <p className="text-2xl font-semibold text-slate-800 leading-relaxed drop-shadow-md">
              Accept local stablecoins for your business, manage payments, and
              swap between currencies instantly with ease
            </p>
            <HeroFeaturesHomePage />
            {!authenticated ? (
              <div className="flex flex-col items-start gap-6">
                <button
                  onClick={() => {
                    if (walletSelectorRef.current) {
                      walletSelectorRef.current.triggerLogin();
                    }
                  }}
                  className="relative bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-10 rounded-xl border-4 border-blue-400/50 transition-all duration-500 shadow-2xl hover:shadow-blue-500/50 w-full sm:w-auto max-w-md transform hover:-translate-y-1"
                >
                  <span className="text-xl text-center drop-shadow-lg">
                    Start with Email or Wallet
                  </span>
                  <span className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-xl"></span>
                </button>
                <span hidden={true}>
                  <WalletSelector ref={walletSelectorRef} />
                </span>
                <p className="text-slate-700 text-lg font-medium">
                  Sign in with your email or connect your wallet to dive into
                  the Dashboard and transform your payment experience.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-6">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="relative bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-10 rounded-xl border-4 border-blue-400/50 transition-all duration-500 shadow-2xl hover:shadow-blue-500/50 w-full sm:w-auto max-w-md transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 !bg-gradient-to-r !text-white !border-4 !border-blue-400/50 !shadow-2xl !rounded-xl !font-bold !py-4 !px-10"
                >
                  <span className="text-xl text-white text-center drop-shadow-lg">
                    Explore Dashboard
                  </span>
                </button>
              </div>
            )}
          </div>
          {/* flags */}
          <Flags/>
        </div>

        <FeaturesSection/>

        {/* How It Works Section */}
        <HowItWorksSection/>

        {/* FAQ Items with toggle functionality */}
        <FaqSection/>
      </div>

      {/* CTA Section */}
      <div className="relative overflow-hidden rounded-3xl mb-12 shadow-2xl mb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-700 dark:via-indigo-700 dark:to-purple-700"></div>
        <div className="absolute inset-0 bg-blue-600/20 dark:bg-blue-900/30 backdrop-blur-sm"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-400/30 dark:bg-indigo-600/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-400/30 dark:bg-blue-600/30 rounded-full blur-3xl animate-pulse-slow"></div>

        <div className="relative z-10 px-8 py-16 text-center text-white">
          <div className="mb-2 flex justify-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium">
              <span className="mr-2">🚀</span>
              <span>Instant Setup</span>
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white">
            Ready to accept stablecoin payments?
          </h2>
          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto text-blue-100">
            Join thousands of merchants across the world who are already
            accepting local stablecoins through NEDA Pay
          </p>

          <div className="global flex flex-col sm:flex-row items-center justify-center gap-6">
            {!authenticated ? (
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={() => {
                    if (walletSelectorRef.current) {
                      walletSelectorRef.current.triggerLogin();
                    }
                  }}
                  className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 font-bold py-3 px-6 rounded-lg border-2 border-blue-400 dark:border-blue-300 transition-all duration-200 shadow-md w-full sm:w-auto max-w-xs mx-auto"
                >
                  <span
                    className="text-l text-center"
                    style={{ color: "white" }}
                  >
                    Sign in with Email or Wallet
                  </span>
                </button>
                <span hidden={true}>
                  <WalletSelector ref={walletSelectorRef} />
                </span>
                <p className="flex items-center justify-center">
                  Sign with Email or Connect your wallet to get started and
                  access Dashboard.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm sm:text-base py-3 px-6 rounded-lg border-2 border-blue-400 dark:border-blue-300 transition-all duration-200 shadow-md w-full sm:w-auto max-w-xs mx-auto"
                >
                  <span className="text-center">Continue to Dashboard</span>
                </button>
              </div>
            )}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <div className="flex items-center text-sm text-blue-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-blue-200"
                viewBox="0 0 20 20"
                fill=""
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>No setup fees</span>
            </div>
            <div className="flex items-center text-sm text-blue-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-blue-200"
                viewBox="0 0 20 20"
                fill=""
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Instant settlements</span>
            </div>
            <div className="flex items-center text-sm text-blue-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-blue-200"
                viewBox="0 0 20 20"
                fill=""
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Global stablecoins</span>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function HomePage() {
  return <HomeContent />;
}
