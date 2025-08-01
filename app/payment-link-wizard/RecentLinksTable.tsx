import React from 'react';
import { PaymentLink } from './utils/types';

const LINK_TYPES = [
  { id: 'standard', name: 'Standard Payment', icon: '💳' },
  { id: 'offramp', name: 'Offramp to Mobile', icon: '📱' },
  { id: 'recurring', name: 'Recurring Payment', icon: '🔄' },
];

const BLOCKCHAINS = [
  { id: 'base', name: 'Base' },
  { id: 'arbitrum', name: 'Arbitrum' },
  { id: 'scroll', name: 'Scroll' },
  { id: 'polygon', name: 'Polygon' },
  { id: 'bnb', name: 'BNB Smart Chain' },
];

interface RecentLinksTableProps {
  recentLinks: PaymentLink[];
}

export const RecentLinksTable: React.FC<RecentLinksTableProps> = ({ recentLinks }) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-base font-semibold text-gray-600 uppercase tracking-wider">
                Date Created
              </th>
              <th className="px-6 py-4 text-left text-base font-semibold text-gray-600 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-4 text-left text-base font-semibold text-gray-600 uppercase tracking-wider">
                Currency
              </th>
              <th className="px-6 py-4 text-left text-base font-semibold text-gray-600 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-4 text-left text-base font-semibold text-gray-600 uppercase tracking-wider">
                Chain
              </th>
              <th className="px-6 py-4 text-left text-base font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-base font-semibold text-gray-600 uppercase tracking-wider">
                Expires At
              </th>
              <th className="px-6 py-4 text-left text-base font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {recentLinks.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-gray-100 rounded-2xl">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-lg">No payment links created yet</p>
                    <p className="text-gray-400 text-sm">Your generated links will appear here</p>
                  </div>
                </td>
              </tr>
            ) : (
              recentLinks.map((link, index) => (
                <tr
                  key={link.id}
                  className={`hover:bg-gray-50 transition-colors duration-200 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                    {link.createdAt instanceof Date ? link.createdAt.toLocaleDateString() : link.createdAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900">
                    {link.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-base font-medium">
                      {link.currency}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                    {LINK_TYPES.find(t => t.id === link.type)?.name || link.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                    {BLOCKCHAINS.find(c => c.id === link.chain)?.name || link.chain}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 text-base font-medium rounded-full bg-green-100 text-green-700">
                      {link.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                    {link.expiresAt instanceof Date ? link.expiresAt.toLocaleString() : link.expiresAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};