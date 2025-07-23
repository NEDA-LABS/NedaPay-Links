import React from 'react';
import { Loader2 } from 'lucide-react';

const TokenBalanceCard: React.FC<{
  token: string;
  balance: string;
  loading: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}> = ({ token, balance, loading, isSelected, onClick }) => {
  return (
    <div 
      className={`flex justify-between items-center p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
        isSelected ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'
      }`} 
      onClick={onClick}
    >
      <div>
        <span className="text-slate-800 text-sm">{token}</span>
      </div>
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
      ) : (
        <span className="font-medium text-slate-800">
          {parseFloat(balance).toLocaleString(undefined, {
            maximumFractionDigits: 6,
          })}
        </span>
      )}
    </div>
  );
};

export default TokenBalanceCard;