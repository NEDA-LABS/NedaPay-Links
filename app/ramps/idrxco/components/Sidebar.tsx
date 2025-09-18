'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Repeat, Send, Link as LinkIcon, FileText, Users, Key, Plus } from 'lucide-react';

const navItems = [
  // { name: 'Dashboard', href: '/idrxco', icon: Home },
  { name: 'Redeem', href: '/idrxco/redeem', icon: Repeat },
  { name: 'Mint', href: '#', icon: Plus },
  
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col h-screen">
      <div className="mb-10">
        {/* You can place a logo here */}
        <h1 className="text-2xl font-bold text-gray-800">IDRXCO</h1>
      </div>
      <nav className="flex flex-col space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}>
              <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
