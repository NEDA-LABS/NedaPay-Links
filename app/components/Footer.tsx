"use client";
import Link from "next/link";
import {FaXTwitter, FaGithub, FaMedium, FaDiscord} from "react-icons/fa6";

export default function Footer() {
  return (
    <footer className="w-full shadow-lg backdrop-blur-sm py-6 px-4 sm:px-6 !border-blue-900 bg-slate-950/50">
      <div className="max-w-6xl mx-auto flex flex-col justify-between items-center gap-4 text-sm text-slate-600">
        {/* Left Side */}
        <div className="text-center sm:text-left text-slate-50">
          © 2025{" "}
          <Link
            href="#"
            className="font-semibold text-slate-50 hover:text-blue-600 transition-colors duration-300"
          >
            NEDA Labs
          </Link>
        </div>

        {/* Center - Join Community */}
        <div className="flex items-center gap-2 text-slate-50">
          <a
            href="https://discord.com/invite/2H3dQzruRV"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-slate-50 hover:text-blue-600 transition-colors duration-300"
            aria-label="Discord Community"
          >
            <span>Join our community Today</span>
            <FaDiscord className="w-5 h-5" />
          </a>
          <div className="flex space-x-4">
          <a
            href="https://x.com/NedaPay_xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-50 hover:text-blue-600 transition-colors duration-300"
            aria-label="X / Twitter"
          >
            <FaXTwitter className="w-5 h-5" strokeWidth={2.5} />
          </a>
          <a
            href="https://medium.com/@nedalabs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-50 hover:text-blue-600 transition-colors duration-300"
            aria-label="Medium"
          >
            <FaMedium className="w-5 h-5" strokeWidth={2.5} />
          </a>
        </div>
        </div>
        <a href="mailto:support@nedapay.xyz" className="text-slate-50 hover:text-blue-600 transition-colors duration-300 underline">contact support</a>
      </div>
    </footer>
  );
}