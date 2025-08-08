import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Coins,
  Repeat,
  BarChart2,
  Settings,
  Zap,
  ChevronRight,
} from "lucide-react";
import RollingFeaturesGallery from "@/components/HeroFeaturesHomePage";
import HeroFlags from "./HeroFlags";
import ChainsWidget from "./ChainsWidget";

const GlassCard = ({
  children,
  className = "",
  isSelected = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative rounded-lg bg-white overflow-hidden transition-all duration-300 cursor-pointer ${
        isSelected
          ? "border-2 border-blue-500 shadow-lg"
          : "hover:border-blue-400 hover:shadow-md"
      } ${className}`}
    >
      {isSelected && (
        <div className="absolute top-4 right-4 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm z-10"></div>
      )}
      {children}
    </div>
  );
};

const features = [
  {
    icon: Coins,
    title: "Stablecoins",
    description:
      "Accept multiple stablecoins, generate invoices and payment links",
    tags: ["TSHC", "cNGN"],
    accentColor: "#10367D",
    button: "Accept",
    route: "/stablecoins",
    visual: "/stablecoins.png",
  },
  {
    icon: Repeat,
    title: "Swap, Onramp, Offramp",
    description: "Low-fee conversions between assets",
    tags: ["0.1% fee", "Fast"],
    accentColor: "#A5CE00",
    button: "Swap",
    route: "/swap",
    visual: "/swaps_ramps.png",
  },
  {
    icon: BarChart2,
    title: "Analytics",
    description: "Real-time payment insights",
    tags: ["Reports", "Charts"],
    accentColor: "#10367D",
    button: "View",
    route: "/analytics",
    visual: "/analytics.png",
  },
  {
    icon: Settings,
    title: "Settlement",
    description: "Automated payment processing",
    tags: ["Auto", "Secure"],
    accentColor: "#A5CE00",
    button: "Setup",
    route: "/settlement",
    visual: "/settlement.png",
  },
];

export default function Features() {
  const [selectedCard, setSelectedCard] = useState(1);
  const router = useRouter();

  const handleCardClick = (index: any) => {
    setSelectedCard(index);
  };

  const handleButtonClick = (route: any, e: any) => {
    e.stopPropagation();
    router.push(route);
  };

  return (
    <div className="flex items-center justify-center relative overflow-hidden bg-slate-950 mt-[200px] lg:mt-20 mx-0">
      <Image
        src="/coins.png"
        alt="Coins illustration"
        objectFit="contain"
        fill
        className="absolute top-0 left-0 object-cover overflow-hidden opacity-20"
        priority
      />

      <div className="flex flex-col z-10 mx-auto justify-center items-center">
        <div className="flex flex-col lg:flex-row justify-between gap-4 pb-12 justify-center sm:flex lg:hidden">
          <h3 className="flex text-xl lg:text-2xl font-bold text-slate-50 text-center items-center  mx-auto bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            Everything You Need to Accept <br className="sm:flex md:hidden" />{" "}
            Stablecoin Payments
          </h3>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 pb-12 justify-center mx-auto">
          {/* Features Grid - 2 per row on large screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-20 rounded-2xl p-4 justify-center md:justify-start items-center my-auto">
            <Image
              src="/usdc.png"
              alt="Coins illustration"
              height={100}
              width={100}
              className="absolute top-[30%] left-[5%] overflow-hidden opacity-90"
              priority
            />
            <Image
              src="/usdt.png"
              alt="Coins illustration"
              height={100}
              width={100}
              className="absolute top-[50%] left-[50%] overflow-hidden opacity-90"
              priority
            />
            <Image
              src="/cngn.png"
              alt="Coins illustration"
              height={100}
              width={100}
              className="absolute top-[65%] md:top-[80%] left-[30%] overflow-hidden opacity-90"
              priority
            />
            <Image
              src="/idrx.png"
              alt="Coins illustration"
              height={100}
              width={100}
              className="absolute top-[7%] md:top-[10%] left-[30%] overflow-hidden opacity-90"
              priority
            />

            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="relative flex flex-col p-6 rounded-xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-purple-500/40 transition-all duration-300 w-[230px] xl:w-[280px] mx-auto"
                >
                  {/* Icon in circle */}
                  <div className="absolute -top-4 left-4 w-8 h-8 rounded-full bg-gradient-to-br from-purple-700 to-orange-500 flex items-center justify-center text-white shadow-lg">
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Title */}
                  <h3 className="text-white font-semibold text-lg mb-2 mt-4">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-slate-300 text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col items-end justify-center lg:mr-[-200px]">
            <RollingFeaturesGallery />
            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium shadow-lg hover:opacity-90 transition-all mx-auto mt-8">
              Explore
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
