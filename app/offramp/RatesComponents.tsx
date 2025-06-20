import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Activity, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchSupportedCurrencies, fetchTokenRate } from '../utils/paycrest';

interface Currency {
  code: string;
  name: string;
  shortName: string;
  decimals: number;
  symbol: string;
  marketRate: string;
}

interface RateCache {
  [key: string]: {
    rate: string;
    timestamp: number;
    isStale: boolean;
  };
}

const CACHE_DURATION = 25000; // 25 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const DISPLAY_INTERVAL = 3000; // 3 seconds per currency set
const FADE_DURATION = 1000; // Fade animation duration in ms

const CurrencyRatesWidget = () => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [rateCache, setRateCache] = useState<RateCache>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const displayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (displayIntervalRef.current) clearInterval(displayIntervalRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    retryTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    retryTimeoutsRef.current.clear();
    intervalRef.current = null;
    displayIntervalRef.current = null;
    abortControllerRef.current = null;
  }, []);

  const fetchRateWithRetry = useCallback(async (
    fromToken: string, 
    amount: number, 
    toCurrency: string, 
    retryCount = 0
  ): Promise<string> => {
    try {
      if (abortControllerRef.current?.signal.aborted) throw new Error('Request aborted');
      const rate = await fetchTokenRate("USDC", amount, toCurrency);
      return rate;
    } catch (error) {
      if (retryCount < MAX_RETRIES && !abortControllerRef.current?.signal.aborted) {
        await new Promise(resolve => {
          const timeout = setTimeout(resolve, RETRY_DELAY * (retryCount + 1));
          retryTimeoutsRef.current.add(timeout);
        });
        return fetchRateWithRetry(fromToken, amount, toCurrency, retryCount + 1);
      }
      throw error;
    }
  }, []);

  const isRateStale = useCallback((timestamp: number) => {
    return Date.now() - timestamp > CACHE_DURATION;
  }, []);

  const loadCurrencies = useCallback(async () => {
    try {
      const supportedCurrencies = await fetchSupportedCurrencies();
      const sortedCurrencies = [...supportedCurrencies].sort((a, b) => 
        a.code.localeCompare(b.code)
      );
      setCurrencies(sortedCurrencies);
      return sortedCurrencies;
    } catch (err) {
      console.error('Failed to load currencies:', err);
      throw new Error('Failed to load supported currencies');
    }
  }, []);

  const loadRates = useCallback(async (currenciesToLoad: Currency[], forceRefresh = false) => {
    if (!currenciesToLoad.length) return;

    try {
      setIsRefreshing(true);
      abortControllerRef.current = new AbortController();
      const now = Date.now();
      const ratesToFetch: Currency[] = [];

      currenciesToLoad.forEach(currency => {
        const cached = rateCache[currency.code];
        if (forceRefresh || !cached || isRateStale(cached.timestamp)) {
          ratesToFetch.push(currency);
        }
      });

      if (ratesToFetch.length > 0) {
        const ratePromises = ratesToFetch.map(async (currency) => {
          try {
            const rate = await fetchRateWithRetry('USDC', 1, currency.code);
            return { code: currency.code, rate, error: null };
          } catch (fetchError) {
            console.warn(`Failed to fetch rate for ${currency.code}, using market rate:`, fetchError);
            return { code: currency.code, rate: currency.marketRate, error: fetchError };
          }
        });

        const results = await Promise.allSettled(ratePromises);
        const newCacheEntries: RateCache = {};
        results.forEach((result, index) => {
          const currency = ratesToFetch[index];
          if (result.status === 'fulfilled') {
            const { code, rate } = result.value;
            newCacheEntries[code] = { rate, timestamp: now, isStale: false };
          } else {
            newCacheEntries[currency.code] = { rate: currency.marketRate, timestamp: now, isStale: true };
          }
        });

        setRateCache(prev => ({ ...prev, ...newCacheEntries }));
      }

      setLastUpdateTime(now);
      setError(null);
    } catch (err) {
      console.error('Failed to load rates:', err);
      setError('Failed to load rates');
    } finally {
      setIsRefreshing(false);
      abortControllerRef.current = null;
    }
  }, [isRateStale, fetchRateWithRetry, rateCache]);

  useEffect(() => {
    const initializeWidget = async () => {
      try {
        setLoading(true);
        const loadedCurrencies = await loadCurrencies();
        await loadRates(loadedCurrencies);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize widget');
      } finally {
        setLoading(false);
      }
    };

    initializeWidget();
  }, [loadCurrencies, loadRates]);

  useEffect(() => {
    if (currencies.length > 0 && !loading) {
      intervalRef.current = setInterval(() => {
        if (!isRefreshing) loadRates(currencies);
      }, 30000);

      displayIntervalRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % Math.ceil(currencies.length / 4));
      }, DISPLAY_INTERVAL);
    }

    return cleanup;
  }, [currencies, loadRates, cleanup, loading, isRefreshing]);

  const handleManualRefresh = useCallback(() => {
    if (!isRefreshing && currencies.length > 0) {
      loadRates(currencies, true);
      setCurrentIndex(0);
    }
  }, [currencies, loadRates, isRefreshing]);

  const formatRate = useCallback((rate: string, currency: Currency) => {
    const numRate = parseFloat(rate);
    if (isNaN(numRate)) return 'N/A';
    return numRate.toLocaleString(undefined, {
      minimumFractionDigits: currency.decimals === 0 ? 0 : 2,
      maximumFractionDigits: currency.decimals === 0 ? 0 : currency.decimals
    });
  }, []);

  const displayCurrencies = useMemo(() => {
    const start = currentIndex * 4;
    return currencies.slice(start, start + 4);
  }, [currentIndex, currencies]);

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 shadow-2xl border border-gray-800">
        <div className="flex items-center justify-center gap-3">
          <Activity className="w-5 h-5 text-green-400 animate-pulse" />
          <span className="text-gray-300 text-xs font-medium">Loading exchange rates...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 shadow-2xl border border-red-900/50">
        <div className="flex items-center justify-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-300 text-xs font-medium">{error}</span>
          <button
            onClick={handleManualRefresh}
            className="flex items-center gap-2 px-3 py-1 text-xs text-red-300 hover:text-red-100 
                       bg-red-900/30 hover:bg-red-900/50 rounded-md transition-all duration-200
                       border border-red-800/50 hover:border-red-700/50"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const containerStyle = {
    animation: `fadeInSlide ${DISPLAY_INTERVAL}ms ease-in-out infinite`,
    minHeight: '4rem'
  };

  const rateItemStyle = {
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    transition: 'all 0.3s ease'
  };

  const statusDotStyle = {
    animation: 'pulse 2s infinite'
  };

  return (
    <div className="bg-gray-900 rounded-lg shadow-2xl border-4 !border-purple-800 md:w-[60%] items-center mx-auto">
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeInSlide {
            0% { opacity: 0; transform: translateX(20px); }
            15% { opacity: 1; transform: translateX(0); }
            85% { opacity: 1; transform: translateX(0); }
            100% { opacity: 0; transform: translateX(-20px); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          .rate-item:hover {
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%) !important;
            border-color: rgba(34, 197, 94, 0.3) !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3) !important;
          }
          .refresh-button {
            transition: all 0.2s ease;
          }
          .refresh-button:hover {
            transform: scale(1.05);
          }
        `
      }} />

      {/* Header */}
      <div className="bg-gray-800/50 px-6 py-3 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-400 rounded-full" style={statusDotStyle}></div>
            <h3 className="text-white text-xs tracking-wide">
              LIVE EXCHANGE RATES
            </h3>
            <span className="text-gray-400 text-xs font-mono">USDC/FIAT</span>
          </div>
          
          {/* <button
            onClick={handleManualRefresh}
            className="refresh-button flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 
                       hover:text-white bg-gray-700/50 hover:bg-gray-600/50 rounded-md
                       border border-gray-600/50 hover:border-gray-500/50"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Updating...' : 'Refresh'}
          </button> */}
        </div>
      </div>

      {/* Rates Display */}
      <div className="">
        <div className="currency-container " style={containerStyle}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {displayCurrencies.map((currency) => {
              const cached = rateCache[currency.code];
              const isStale = cached?.isStale || false;
              const rate = cached ? cached.rate : currency.marketRate;

              return (
                <div key={currency.code} className="rounded-lg p-2" style={rateItemStyle}>
                  <div className="flex flex-row items-center">
                    <div className="flex items-center gap-2">
                      {/* <span className="text-gray-400 text-xs font-mono">
                        {currency.symbol}
                      </span> */}
                      <span className="text-white font-semibold text-[0.65rem]">
                        {currency.code}
                      </span>
                    </div>
                    {isStale && (
                      <AlertCircle className="w-3 h-3 text-yellow-400" />
                    )}
                  </div>
                  
                  <div className="">
                    {/* <div className="text-gray-400 text-xs mb-1">1 USDC =</div> */}
                    <div className="text-green-400 font-mono font-bold text-xs">
                      {formatRate(rate, currency)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      {lastUpdateTime > 0 && (
        <div className="bg-gray-800/30 py-1 border-t border-gray-700/30">
          <div className="flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            <span className="text-gray-400 text-[0.6rem] font-mono">
              Last updated: {new Date(lastUpdateTime).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyRatesWidget;