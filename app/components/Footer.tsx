
"use client";

import Link from "next/link";
import { Twitter, Github, BookOpen } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-white/95 backdrop-blur-sm py-6 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-600">
        {/* Left Side */}
        <div className="text-center sm:text-left">
          © 2025{" "}
          <Link
            href="#"
            className="font-semibold text-slate-800 hover:text-blue-600 transition-colors duration-300"
          >
            NEDA Labs
          </Link>
        </div>

        {/* Right Side - Social Icons */}
        <div className="flex space-x-4">
          <a
            href="https://x.com/NedaLabs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-blue-600 transition-colors duration-300"
            aria-label="X / Twitter"
          >
            <Twitter className="w-5 h-5" strokeWidth={2.5} />
          </a>
          <a
            href="https://medium.com/@nedalabs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-blue-600 transition-colors duration-300"
            aria-label="Medium"
          >
            <BookOpen className="w-5 h-5" strokeWidth={2.5} />
          </a>
          <a
            href="https://github.com/0xMgwan/NedaPay/tree/main/merchant-portal"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-blue-600 transition-colors duration-300"
            aria-label="GitHub"
          >
            <Github className="w-5 h-5" strokeWidth={2.5} />
          </a>
        </div>
      </div>
    </footer>
  );
}