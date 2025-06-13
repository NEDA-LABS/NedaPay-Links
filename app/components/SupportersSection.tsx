import React from 'react';
import { Zap } from 'lucide-react';
import Image from 'next/image';

// Placeholder URLs for logos (replace with actual URLs or local assets)
const supporters = [
  {
    name: 'Coinbase',
    logo: '/Coinbase-logo-square-1.png', // Replace with actual Coinbase logo path
    url: 'https://www.coinbase.com',
  },
  {
    name: 'Hash Emergent',
    logo: '/Hashedem-logo-2.png', // Replace with actual Hash Emergent logo path
    url: 'https://www.hashemergent.com', // Replace with actual URL if available
  },
];

export default function SupportersSection() {
  return (
    <div className="py-16 px-6 sm:px-8 bg-gray-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute -left-16 top-1/4 w-32 h-32 bg-blue-200/10 rounded-full blur-2xl"></div>
      <div className="absolute -right-16 top-2/3 w-32 h-32 bg-indigo-200/10 rounded-full blur-2xl"></div>

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100/80 to-indigo-100/80 text-blue-700 text-sm font-medium mb-4 border border-blue-200">
            <Zap className="mr-2 h-4 w-4" />
            <span>Backed by</span>
          </div>
        </div>

        {/* Supporters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 max-w-xl mx-auto">
          {supporters.map((supporter, index) => (
            <a
              key={index}
              href={supporter.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group shadow-lg hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex items-center justify-center bg-white rounded-2xl"
            >
              <div className="relative">
                {/* Logo */}
                <Image
                  src={supporter.logo}
                  alt={`${supporter.name} logo`}
                  width={200}
                  height={200}
                  className="h-16 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                />
                {/* Glow effect */}
                <div className="absolute -inset-0.5 bg-blue-400/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}