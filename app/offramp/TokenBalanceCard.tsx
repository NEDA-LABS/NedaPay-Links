import React from 'react';
import { Loader2 } from 'lucide-react';

const TokenBalanceCard: React.FC<{
  token: string;
  balance: string;
  loading: boolean;
}> = ({ token, balance, loading }) => {
  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
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