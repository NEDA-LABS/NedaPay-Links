"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Settings,
  Zap,
  Repeat,
  HelpCircle,
  Receipt,
  X,
  Link as LinkIcon,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  authenticated: boolean;
}

export default function Sidebar({ isOpen, onClose, authenticated }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Handle FAQ navigation
  const handleFAQClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onClose();
    
    if (pathname === "/") {
      const faqSection = document.getElementById("faq");
      if (faqSection) {
        faqSection.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      router.push("/?scrollTo=faq");
    }
  };

  // Handle How It Works navigation
  const handleHowItWorksClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onClose();
    
    if (pathname === "/") {
      const howItWorksSection = document.getElementById("how-it-works");
      if (howItWorksSection) {
        howItWorksSection.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      router.push("/?scrollTo=how-it-works");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 right-0 bg-white dark:bg-slate-800 rounded-l
        shadow-2xl z-50 w-64 transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "translate-x-full"}
      `}>
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Menu</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:!text-slate-600 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="p-6 space-y-2">
          
          {/* Always visible items */}
          <button
            onClick={handleHowItWorksClick}
            className="flex items-center space-x-3 p-3 rounded-lg hover:!bg-slate-100 transition-colors w-full text-left"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span>How It Works</span>
          </button>
          
          <button
            onClick={handleFAQClick}
            className="flex items-center space-x-3 p-3 rounded-lg hover:!bg-slate-100 transition-colors w-full text-left"
          >
            <HelpCircle className="w-5 h-5" />
            <span>FAQ</span>
          </button>
          
          {/* Authenticated user items */}
          {authenticated && (
            <>
              <div className="border-t border-slate-200 my-4 pt-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2 px-3">
                  Account
                </p>
              </div>
              
              <Link
                href="/settings"
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100 transition-colors"
                onClick={onClose}
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </Link>
              
              <Link
                href="/payment-link"
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100 transition-colors"
                onClick={onClose}
              >
                <LinkIcon className="w-5 h-5" />
                <span>Generate Payment Link</span>
              </Link>
              
              <Link
                href="/invoice"
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100 transition-colors"
                onClick={onClose}
              >
                <Receipt className="w-5 h-5" />
                <span>Send Invoice</span>
              </Link>
              
              <div className="border-t border-slate-200 dark:border-slate-700 my-4 pt-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium mb-2 px-3">
                  Actions
                </p>
              </div>
              
              <Link
                href="/mobileWithdrawal"
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100 transition-colors"
                onClick={onClose}
              >
                <Zap className="w-5 h-5" />
                <span>Withdraw</span>
              </Link>
              
              <Link
                href="#swap"
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100 transition-colors"
                onClick={onClose}
              >
                <Repeat className="w-5 h-5" />
                <span>Swap</span>
              </Link>
            </>
          )}
          
        </nav>
      </div>
    </>
  );
}