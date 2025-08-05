'use client';

import { FaDiscord } from 'react-icons/fa6';
import { withDashboardLayout } from '@/utils/withDashboardLayout';

function SupportPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Support</h1>
        <div className="flex justify-center items-center gap-4">
          <a
            href="https://discord.com/invite/2H3dQzruRV"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-purple-900 hover:text-blue-600 transition-colors duration-300"
            aria-label="Discord Community"
          >
            <span>Join our Discord Community</span>
            <FaDiscord className="w-6 h-6" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default withDashboardLayout(SupportPage);