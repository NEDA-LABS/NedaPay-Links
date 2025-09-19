// TokenBalanceCard.tsx
import React from 'react';
import { stablecoins } from '../../data/stablecoins';

interface TokenBalanceCardProps {
  token: string;
  balance: string;
  loading: boolean;
  isSelected: boolean;
  compactView?: boolean;
}

// Helper function to get token icon
const getTokenIcon = (token: string) => {
  const stablecoin = stablecoins.find(s => s.baseToken.toUpperCase() === token.toUpperCase());
  return stablecoin?.flag || '/default-token-icon.png';
};

const TokenBalanceCard: React.FC<TokenBalanceCardProps> = ({ 
  token, 
  balance, 
  loading, 
  isSelected,
  compactView = false
}) => {
  return (
    <div className={`flex justify-between items-center ${compactView ? 'flex-row' : 'flex-col md:flex-row'}`}>
      <div className="flex items-center gap-2">
        <img 
          src={getTokenIcon(token)} 
          alt={token} 
          className="w-6 h-6 rounded-full flex-shrink-0"
          onError={(e) => {
            // Fallback to a default icon if image fails to load
            e.currentTarget.src = '/default-token-icon.png';
          }}
        />
        <span className={`font-medium text-sm ${isSelected ? 'text-white' : 'text-gray-300'} truncate`}>
          {token}
        </span>
      </div>
      <span className={`text-sm ${isSelected ? 'text-blue-100' : 'text-gray-100'} ml-2 md:ml-0`}>
        {loading ? (
          <div className="animate-pulse flex space-x-1">
            <div className="h-4 w-12 bg-slate-700 rounded"></div>
          </div>
        ) : (
          parseFloat(balance).toFixed(4)
        )}
      </span>
    </div>
  );
};

export default TokenBalanceCard;