import React from 'react';

const LINK_TYPES = [
  { id: 'standard', name: 'Standard Payment', icon: '💳' },
  { id: 'offramp', name: 'Offramp to Mobile', icon: '📱' },
  { id: 'recurring', name: 'Recurring Payment', icon: '🔄' },
];

interface LinkTypeTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const LinkTypeTabs: React.FC<LinkTypeTabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex border-b border-gray-200 mb-8">
      {LINK_TYPES.map((tab) => (
        <button
          key={tab.id}
          className={`flex-1 py-4 px-2 text-center font-medium text-sm ${
            activeTab === tab.id
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="block text-lg mb-1">{tab.icon}</span>
          {tab.name}
        </button>
      ))}
    </div>
  );
};