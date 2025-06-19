import React, { useState, useEffect } from 'react';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchSupportedCurrencies, fetchTokenRate } from '../utils/paycrest';

interface Currency {
  code: string;
  name: string;
  shortName: string;
  decimals: number;
  symbol: string;
  marketRate: string;
}

const CurrencyRatesWidget = () => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [rates, setRates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const loadRates = async () => {
      try {
        setLoading(true);
        const supportedCurrencies = await fetchSupportedCurrencies();
        setCurrencies(supportedCurrencies);
        
        const ratePromises = supportedCurrencies.map(async (currency) => {
          try {
            return await fetchTokenRate('USDC', 1, currency.code);
          } catch {
            return currency.marketRate;
          }
        });
        
        const ratesArray = await Promise.all(ratePromises);
        const ratesMap = supportedCurrencies.reduce((acc, currency, index) => {
          acc[currency.code] = ratesArray[index];
          return acc;
        }, {} as Record<string, string>);
        
        setRates(ratesMap);
      } catch (err) {
        setError('Failed to load rates');
      } finally {
        setLoading(false);
      }
    };

    loadRates();
    const interval = setInterval(loadRates, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatRate = (rate: string) => {
    const numRate = parseFloat(rate);
    return numRate.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const displayedCurrencies = expanded ? currencies : currencies.slice(0, 7);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 backdrop-blur-sm rounded-lg p-3 border border-indigo-200 w-full max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />
          <span className="text-indigo-800 text-xs">Loading rates...</span>
        </div>
        <div className="flex flex-row gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-indigo-100/50 rounded-md px-2 py-1 w-20">
              <div className="h-3 bg-indigo-200/50 rounded animate-pulse mb-1"></div>
              <div className="h-4 bg-indigo-200/50 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 backdrop-blur-sm rounded-lg p-3 border border-indigo-200 w-full max-w-3xl mx-auto opacity-80">
        <div className="flex items-center gap-2 text-indigo-600 text-xs">
          <Activity className="w-4 h-4" />
          <span>Loading rates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 backdrop-blur-sm rounded-lg p-3 border border-indigo-200 w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-center mb-2">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-indigo-400/30 to-purple-400/30 rounded-md p-1">
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-indigo-800 text-xs font-medium justify-center items-center">
            USDC Rates
            <span className="ml-1 px-1.5 py-0.5 bg-indigo-200/50 text-indigo-700 rounded text-xs">
              Live
            </span>
          </div>
        </div>
        {/* <button 
          onClick={() => setExpanded(!expanded)}
          className="flex items-center text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          {expanded ? (
            <>
              Less <ChevronUp className="ml-1 w-3 h-3" />
            </>
          ) : (
            <>
              More <ChevronDown className="ml-1 w-3 h-3" />
            </>
          )}
        </button> */}
      </div>

      <div className="flex flex-row flex-wrap gap-2 justify-center">
        {displayedCurrencies.map(currency => (
          <div 
            key={currency.code} 
            className="bg-indigo-100/30 hover:bg-indigo-100/50 rounded-md px-2 py-1 transition-colors"
          >
            <div className="flex justify-between items-center">
              <span className="text-indigo-600 text-xs font-medium">
                {currency.code}
              </span>
            </div>
            <div className="text-indigo-800 text-xs font-medium mt-0.5">
              {formatRate(rates[currency.code] || currency.marketRate)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurrencyRatesWidget;