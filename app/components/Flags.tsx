import { stablecoins } from "../data/stablecoins";

export default function Flags() {
    return (
  <div className="lg:w-[60%] relative opacity-75">
    <style jsx global>{`
      :root {
        --primary-glow: #3b82f6;
        --secondary-glow: #6366f1;
        --accent-glow: #8b5cf6;
      }


      /* Enhanced floating animation with rotation and scale */
      .animate-float {
        animation: float 3s ease-in-out infinite;
      }

      @keyframes float {
        0% {
          transform: translateY(0px) scale(1) rotate(0deg);
        }
        25% {
          transform: translateY(-5px) scale(1.02) rotate(0.5deg);
        }
        50% {
          transform: translateY(-10px) scale(1.05) rotate(0deg);
        }
        75% {
          transform: translateY(-5px) scale(1.02) rotate(-0.5deg);
        }
        100% {
          transform: translateY(0px) scale(1) rotate(0deg);
        }
      }

      /* Advanced glow and shimmer effects */
      .glow-border {
        position: relative;
        border: 2px solid transparent;

        border-radius: 1rem;
      }

      .glow-border::before {
        content: "";
        position: absolute;
        inset: -2px;
        padding: 2px;
        border-radius: inherit;
        mask:
          linear-gradient(#fff 0 0) content-box,
          linear-gradient(#fff 0 0);
        mask-composite: xor;
        animation: borderRotate 4s linear infinite;
      }

      @keyframes borderRotate {
        0% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0% 50%;
        }
      }

      /* Particle effect background */
      .particle-bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        border-radius: 1rem;
      }

      .particle {
        position: absolute;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        animation: particle-float 8s infinite linear;
      }

      @keyframes particle-float {
        0% {
          transform: translateY(100vh) rotate(0deg);
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        90% {
          opacity: 1;
        }
        100% {
          transform: translateY(-100px) rotate(360deg);
          opacity: 0;
        }
      }

      /* Enhanced hover effects */
      .stablecoin-item {
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        
        border: 1px solid rgba(100, 100, 100, 0.44);
        
      }

      .stablecoin-item:hover {
        transform: translateY(-8px) scale(1.08);
        
        border-color: rgba(99, 102, 241, 0.5);
      }

      /* Holographic text effect */
      .holographic {
        background: linear-gradient(45deg, #ff0080, #ff8c00, #40e0d0, #ff0080);
        background-size: 300% 300%;
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: holographic 3s ease-in-out infinite;
      }

      @keyframes holographic {
        0%,
        100% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
      }

      /* Enhanced blur orbs */
      .blur-orb {
        animation: orbit 10s infinite linear;
        filter: blur(40px);
      }

      @keyframes orbit {
        0% {
          transform: rotate(0deg) translateX(50px) rotate(0deg);
        }
        100% {
          transform: rotate(360deg) translateX(50px) rotate(-360deg);
        }
      }

      /* Grid container enhancements */
      .stablecoin-grid {
        position: relative;
        z-index: 10;
      }

      .stablecoin-grid::before {
        content: "";
        position: absolute;
        top: -20px;
        left: -20px;
        right: -20px;
        bottom: -20px;
        border-radius: 2rem;
        animation: gridGlow 4s ease-in-out infinite alternate;
      }

      @keyframes gridGlow {
        0% {
          opacity: 0.3;
        }
        100% {
          opacity: 0.7;
        }
      }

      /* Flag emoji enhancement */
      .stablecoin-flag {
        filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
        transition: all 0.3s ease;
      }

      .stablecoin-item:hover .stablecoin-flag {
        filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.8));
        transform: scale(1.2);
      }

      /* Responsive styles */
      @media (max-width: 640px) {
        .hero-section {
          flex-direction: column !important;
        }

        .stablecoin-grid {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 12px !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 auto;
        }

        .stablecoin-item {
          padding: 8px !important;
          font-size: 0.85rem !important;
          border-width: 1px !important;
        }

        .stablecoin-flag {
          font-size: 1.5rem !important;
          margin-bottom: 2px !important;
        }

        .stablecoin-name {
          font-size: 0.75rem !important;
          font-weight: bold !important;
          margin-bottom: 0 !important;
        }

        .stablecoin-region {
          font-size: 0.65rem !important;
          text-align: center !important;
          line-height: 1 !important;
        }
      }

      @media (min-width: 641px) {
        .hero-section {
          flex-direction: row !important;
        }

        .stablecoin-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .stablecoin-item {
          padding: 8px;
          width: 90%;
        }

        .stablecoin-flag {
          font-size: 2rem;
          margin-bottom: 4px;
        }

        .stablecoin-name {
          font-size: 0.875rem;
          font-weight: bold;
        }

        .stablecoin-region {
          font-size: 0.75rem;
        }
      }
    `}</style>
    <div className="relative bg-gradient-to-br from-blue-10 to-indigo-50 p-3 sm:p-6 shadow-2xl overflow-hidden">
      <div className="absolute top-0 left-0 h-full bg-white/20 backdrop-blur-sm rounded-2xl"></div>
      <div className="stablecoin-grid relative z-10 grid grid-cols-3 gap-8">
        {stablecoins.map((coin: any, index: number) => (
          <div
            key={index}
            className={`stablecoin-item bg-white/80 p-3 rounded-xl shadow-lg flex flex-col items-center gap-4 justify-center animate-float`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="stablecoin-flag text-2xl mb-1">{coin.flag}</div>
            <div className="stablecoin-name font-bold text-sm">
              {coin.baseToken}
            </div>
            <div className="stablecoin-region text-xs text-gray-500">
              {coin.region}
            </div>
          </div>
        ))}
      </div>
      <div className="absolute -bottom-0 -right-0 w-32 h-32 bg-blue-400/30 rounded-full blur-2xl"></div>
      <div className="absolute -top-0 -left-0 w-32 h-32 bg-indigo-400/30 rounded-full blur-2xl"></div>
    </div>
  </div>
    )
}
