"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import {
  Settings,
  Sun,
  Moon,
  Zap,
  HelpCircle,
  Menu,
  X,
  Repeat,
  Wallet,
  Banknote,
  Coins,
  Link as LinkIcon,
  Receipt,
} from "lucide-react";
import Image from "next/image";
import { AppSidebarToggle } from "@/dashboard/AppSidebar";
import { SidebarProvider } from "@/compliance/user/components/ui/sidebar";

// Import your actual components
import WalletSelector from "./WalletSelector";
import NotificationTab from "./NotificationTab";
import { FaGear } from "react-icons/fa6";
import { usePrivy } from "@privy-io/react-auth";
import { Badge } from "@/components/ui/badge";

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);

  const { authenticated } = usePrivy();

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle FAQ navigation
  const handleFAQClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (pathname === "/") {
      const faqSection = document.getElementById("faq");
      if (faqSection) {
        faqSection.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      router.push("/?scrollTo=faq");
    }
  };

  if (!mounted) return null;

  return (
    <header
      className={`
        sticky top-0 z-50 
        transition-all duration-300
        ${scrolled ? "shadow-lg bg-[#004a6d]/50" : "shadow-sm"}
      `}
    >
      {/* Simple top border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>

      <div className="mx-auto sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            {pathname !== "/" && (
              <div className="flex  md:hidden">
                <AppSidebarToggle />
              </div>
            )}
            <Link href="/" className="group flex items-center space-x-3">
              {/* Simplified Logo */}
              <div className="relative flex">
                <div className="flex rounded-xl items-center justify-center group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105 -p-[8px]">
                  <Image src="/logo.svg" alt="Logo" width={60} height={60} />
                </div>
                <div className="flex justify-center group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                  <span className="text-sm relative z-10 text-slate-100 font-extrabold drop-shadow-lg p-1 hidden md:!flex items-center -ml-4">
                    NEDAPay
                  </span>
                </div>
                <Badge variant="default" className="absolute -right-3 text-[0.6rem] z-10 font-bold px-1 py-0 bg-blue-800 text-white">
                  BETA
                </Badge>
              </div>
            </Link>
          </div>

          {/* Navigation and Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Navigation Links */}
            {pathname === "/" && (
              <nav className="flex items-center space-x-2">
                <a
                  href="#faq"
                  onClick={handleFAQClick}
                  className="relative overflow-hidden px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-lg text-slate-700 font-medium bg-slate-200 shadow-sm group hidden md:!flex"
                >
                  <span className="relative z-10 flex items-center">FAQ</span>
                </a>
              </nav>
            )}

            {/* Action Buttons Container */}
            <div className="flex items-center space-x-1 sm:space-x-3 px-2 sm:px-3 py-1.5 sm:py-2">
              <NotificationTab />

              <WalletSelector />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
