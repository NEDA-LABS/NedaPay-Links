// TokenBalanceCard.tsx
import React from 'react';

interface TokenBalanceCardProps {
  token: string;
  balance: string;
  loading: boolean;
  isSelected: boolean;
  compactView?: boolean;
}

const TokenBalanceCard: React.FC<TokenBalanceCardProps> = ({ 
  token, 
  balance, 
  loading, 
  isSelected,
  compactView = false
}) => {
  return (
    <div className={`flex justify-between items-center ${compactView ? 'flex-row' : 'flex-col md:flex-row'}`}>
      <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'} truncate`}>
        {token}
      </span>
      <span className={`text-sm ${isSelected ? 'text-blue-100' : 'text-gray-100'} ml-2 md:ml-0`}>
        {loading ? (
          <div className="animate-pulse flex space-x-2">
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