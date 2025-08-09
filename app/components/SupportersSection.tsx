import React from "react";
import Image from "next/image";

const BaseLogo = () => (
  <svg
    width="46"
    height="46"
    viewBox="0 0 46 46"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#filter0_b_139_1266)">
      <rect width="46" height="46" rx="23" fill="url(#baseGradient)" />
      <path
        d="M22.9803 34.3703C29.2728 34.3703 34.3739 29.2796 34.3739 23.0001C34.3739 16.7205 29.2728 11.6299 22.9803 11.6299C17.0104 11.6299 12.1129 16.212 11.6265 22.0443H26.6861V23.9558H11.6265C12.1129 29.7882 17.0104 34.3703 22.9803 34.3703Z"
        fill="white"
      />
    </g>
    <defs>
      <linearGradient
        id="baseGradient"
        x1="0"
        y1="0"
        x2="46"
        y2="46"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="50%" stopColor="#1D4ED8" />
        <stop offset="100%" stopColor="#1E40AF" />
      </linearGradient>
      <filter
        id="filter0_b_139_1266"
        x="-14"
        y="-14"
        width="74"
        height="74"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feGaussianBlur in="BackgroundImageFix" stdDeviation="7" />
        <feComposite
          in2="SourceAlpha"
          operator="in"
          result="effect1_backgroundBlur_139_1266"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_backgroundBlur_139_1266"
          result="shape"
        />
      </filter>
    </defs>
  </svg>
);

const ChainsWidget = () => {
  const avatars = [
    { id: 1, image: "/base.svg" },
    { id: 2, image: "/polygon.svg" },
    { id: 3, image: "/scroll.svg" },
    { id: 4, image: "/arbitrum.svg" },
    { id: 5, image: "/bnb.svg" },
    { id: 6, image: "/celo.svg" },
    { id: 7, image: "/optimism.svg" },
  ];

  return (
    <div className="flex flex-col items-center mt-10 mb-6">
      <div className="flex -space-x-2 md:-space-x-6">
        {avatars.map((avatar, index) => (
          <div
            key={avatar.id}
            className={`w-10 h-10 md:w-14 md:h-14 rounded-full bg-white p-1 shadow-md border border-gray-700 z-${10 - index}`}
            style={{ zIndex: 10 - index }}
          >
            <Image
              src={avatar.image}
              alt={`chain-${avatar.id}`}
              width={50}
              height={50}
              className="rounded-full"
            />
          </div>
        ))}
      </div>
      <div className="mt-4 text-sm md:text-lg font-medium text-white/80">
        Compatible with 5+ chains
      </div>
    </div>
  );
};

export default function BuiltOnBaseSection() {
  return (
    <div className="px-6 bg-gradient-to-b from-gray-950 via-gray-900 to-black relative overflow-hidden text-white mb-8">
      {/* Background effects */}
      <div className="absolute -left-20 top-1/4 w-72 h-72 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -right-20 top-2/3 w-96 h-96 bg-gradient-to-l from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl"></div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}

        {/* Integration Card */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-purple-400/20 rounded-3xl blur-lg opacity-25 group-hover:opacity-40 transition-all duration-500"></div>

          <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl py-4 shadow-xl group-hover:shadow-2xl transition-all duration-500">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="text-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent mb-4">
                  Built on Base
                </h2>
              </div>

              {/* Base Logo */}
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/15 to-indigo-400/15 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-all duration-500"></div>
                <div className="relative p-4 bg-gradient-to-br from-blue-100/10 to-indigo-100/10 rounded-2xl shadow-lg border border-blue-200/10 group-hover:scale-110 group-hover:shadow-xl transition-all duration-500">
                  <BaseLogo />
                </div>
              </div>

              <p className="text-blue-100/80 text-lg max-w-lg leading-relaxed">
                Delivering fast, secure, and cost-effective transactions.
              </p>

              {/* Chains Widget */}
              <ChainsWidget />

              {/* CTA Button */}
              {/* <div className="mt-10">
                <a
                  href="https://base.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-8 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Learn More About Base
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div> */}
            </div>
          </div>
        </div>

        {/* Accent footer */}
        {/* <div className="text-center mt-12">
          <div className="inline-flex items-center text-sm text-white/60">
            <div className="w-8 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent mr-3"></div>
            <span>Multi-chain Blockchain Infrastructure</span>
            <div className="w-8 h-px bg-gradient-to-l from-transparent via-blue-300 to-transparent ml-3"></div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
