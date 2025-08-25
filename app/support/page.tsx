"use client";

import { FaDiscord } from "react-icons/fa6";
import { Mail } from "lucide-react";
import { withDashboardLayout } from "@/utils/withDashboardLayout";

function SupportPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-100 mb-6">Support</h1>
        <div className="flex justify-center items-center gap-4">
          <a
            href="https://discord.com/invite/2H3dQzruRV"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-100 hover:text-blue-600 transition-colors duration-300"
            aria-label="Discord Community"
          >
            <span className="text-gray-100">Join our Discord Community</span>
            <FaDiscord className="w-8 h-8" />
          </a>
        </div>
        <div className="flex flex-row justify-center items-center gap-4">
          <a
            href="mailto:support@nedapay.xyz"
            className="text-slate-50 hover:text-blue-600 transition-colors duration-300 underline"
          >
            contact support
          </a>
          <Mail className="w-8 h-8" />
        </div>
      </div>
    </div>
  );
}

export default withDashboardLayout(SupportPage);
