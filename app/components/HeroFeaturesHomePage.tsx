import React, { useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  useAnimation,
  useTransform,
  PanInfo,
  ResolvedValues,
} from "framer-motion";
import { Globe2, Zap, Shield, CircleDollarSign, Sparkles } from "lucide-react";

const DEFAULT_FEATURES = [
  {
    icon: Globe2,
    title: "Global Stablecoins",
    description: "Access payments worldwide",
    gradient: "from-blue-500 via-blue-600 to-indigo-600",
    iconBg: "bg-gradient-to-br from-blue-500/20 to-indigo-500/20",
    glowColor: "shadow-blue-500/30",
    accentColor: "text-blue-400",
  },
  {
    icon: Zap,
    title: "Instant Settlement",
    description: "Fast, reliable transactions",
    gradient: "from-amber-500 via-orange-500 to-red-500",
    iconBg: "bg-gradient-to-br from-amber-500/20 to-orange-500/20",
    glowColor: "shadow-amber-500/30",
    accentColor: "text-amber-400",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description: "Top-tier security",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    iconBg: "bg-gradient-to-br from-emerald-500/20 to-teal-500/20",
    glowColor: "shadow-emerald-500/30",
    accentColor: "text-emerald-400",
  },
  {
    icon: CircleDollarSign,
    title: "Low Fees",
    description: "Cost-effective transactions",
    gradient: "from-purple-500 via-violet-500 to-blue-500",
    iconBg: "bg-gradient-to-br from-purple-500/20 to-violet-500/20",
    glowColor: "shadow-purple-500/30",
    accentColor: "text-purple-400",
  },
];

type LucideIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  iconBg: string;
  glowColor: string;
  accentColor: string;
}

interface RollingFeaturesGalleryProps {
  autoplay?: boolean;
  pauseOnHover?: boolean;
  features?: Feature[];
}

const RollingFeaturesGallery: React.FC<RollingFeaturesGalleryProps> = ({
  autoplay = true,
  pauseOnHover = true,
  features = [],
}) => {
  const galleryFeatures = features.length > 0 ? features : DEFAULT_FEATURES;

  const [isScreenSizeSm, setIsScreenSizeSm] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth <= 640 : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => setIsScreenSizeSm(window.innerWidth <= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const cylinderWidth: number = 900;
  const faceCount: number = galleryFeatures.length;
  const faceWidth: number = (cylinderWidth / faceCount) * 1.2;
  const radius: number = cylinderWidth / (1.5 * Math.PI);

  const dragFactor: number = 0.05;
  const rotation = useMotionValue(0);
  const controls = useAnimation();

  const transform = useTransform(
    rotation,
    (val: number) => `rotate3d(0,1,0,${val}deg)`
  );

  const startInfiniteSpin = (startAngle: number) => {
    controls.start({
      rotateY: [startAngle, startAngle - 360],
      transition: {
        duration: 20,
        ease: "linear",
        repeat: Infinity,
      },
    });
  };

  useEffect(() => {
    if (autoplay) {
      const currentAngle = rotation.get();
      startInfiniteSpin(currentAngle);
    } else {
      controls.stop();
    }
  }, [autoplay, controls, rotation]);

  const handleUpdate = (latest: ResolvedValues) => {
    if (typeof latest.rotateY === "number") {
      rotation.set(latest.rotateY);
    }
  };

  const handleDrag = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ): void => {
    controls.stop();
    rotation.set(rotation.get() + info.offset.x * dragFactor);
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ): void => {
    const finalAngle = rotation.get() + info.velocity.x * dragFactor;
    rotation.set(finalAngle);
    if (autoplay) {
      startInfiniteSpin(finalAngle);
    }
  };

  const handleMouseEnter = (): void => {
    if (autoplay && pauseOnHover) {
      controls.stop();
    }
  };

  const handleMouseLeave = (): void => {
    if (autoplay && pauseOnHover) {
      const currentAngle = rotation.get();
      startInfiniteSpin(currentAngle);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* <div className="flex justify-center hidden lg:flex">
        {" "}
        <h3 className="flex text-xl lg:text-2xl font-bold text-slate-50 text-center items-center bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
          Everything You Need to Accept <br className="sm:flex md:hidden" />{" "}
          Stablecoin Payments
        </h3>
      </div> */}

      {/* Gradient overlays for fade effect */}
      {/* <div
        className="absolute top-0 left-0 h-full w-[80px] z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to left, rgba(15,23,42,0) 0%, rgba(15,23,42,1) 100%)",
        }}
      />
      <div
        className="absolute top-0 right-0 h-full w-[80px] z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, rgba(15,23,42,0) 0%, rgba(15,23,42,1) 100%)",
        }}
      /> */}

      <div className="flex h-full items-center justify-center [perspective:1200px] [transform-style:preserve-3d]">
        <motion.div
          drag="x"
          dragElastic={0}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          animate={controls}
          onUpdate={handleUpdate}
          style={{
            transform: transform,
            rotateY: rotation,
            width: cylinderWidth,
            transformStyle: "preserve-3d",
          }}
          className="flex min-h-[200px] md:min-h-[300px] cursor-grab items-center justify-center [transform-style:preserve-3d] active:cursor-grabbing"
        >
          {galleryFeatures.map((feature, i) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={i}
                className="group absolute flex items-center justify-center [backface-visibility:hidden]"
                style={{
                  width: `${faceWidth}px`,
                  transform: `rotateY(${(360 / faceCount) * i}deg) translateZ(${radius}px)`,
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.05, rotateY: 5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`
                    relative overflow-hidden rounded-3xl backdrop-blur-sm
                    w-[200px] md:w-[280px] md:py-8
                    hover:shadow-2xl transition-all duration-500
                    
                    hover:border-white/20 hover:bg-gradient-to-br hover:from-slate-700/80 hover:to-slate-800/80
                  `}
                >
                  {/* Background gradient overlay */}
                  <div
                    className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 rounded-3xl bg-gradient-to-br ${feature.gradient}`}
                  />

                  {/* Animated background particles */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-700">
                    <div className="absolute top-6 right-6 w-1 h-1 bg-white rounded-full animate-pulse" />
                    <div
                      className="absolute top-12 right-12 w-1 h-1 bg-white/70 rounded-full animate-pulse"
                      style={{ animationDelay: "0.5s" }}
                    />
                    <div
                      className="absolute bottom-6 left-6 w-1 h-1 bg-white/50 rounded-full animate-pulse"
                      style={{ animationDelay: "1s" }}
                    />
                  </div>

                  {/* Image Container */}
                  <div className="flex justify-center mb-6">
                    <motion.div
                      whileHover={{ rotate: 5, scale: 1.1 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className={`
                        relative flex items-center justify-center rounded-2xl
                         group-hover:shadow-2xl transition-all duration-500
                         group-hover:border-white/30
                        overflow-hidden
                      `}
                    >
                      {/* Image glow */}
                      <div
                        className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 ${feature.glowColor}`}
                      />

                      {React.createElement(feature.icon as LucideIcon, {
                        className: `w-12 h-12  md:w-40 md:h-40 text-white transition-all duration-300 relative z-10 group-hover:scale-110 `,
                      })}

                      {/* Sparkle effect */}
                      <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-all duration-700">
                        <Sparkles className="w-4 h-4 text-white/60 animate-pulse" />
                      </div>
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="text-center relative z-10">
                    <h3 className="sm:text-sm md:text-xl font-bold text-white group-hover:text-white transition-colors duration-300 leading-tight">
                      {feature.title}
                    </h3>
                    <p className="text-xs md:text-sm text-white group-hover:text-slate-200 transition-colors duration-300 leading-relaxed opacity-90">
                      {feature.description}
                    </p>
                  </div>

                  {/* Premium shimmer effect */}
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none">
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1500" />
                  </div>
                </motion.div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default RollingFeaturesGallery;
