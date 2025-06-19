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
const DISPLAY_INTERVAL = 2000; // 3 seconds per currency pair
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
  }, [isRateStale, fetchRateWithRetry]);

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
        setCurrentIndex(prev => (prev + 1) % Math.ceil(currencies.length / 2));
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
    const start = currentIndex * 2;
    return currencies.slice(start, start + 2);
  }, [currentIndex, currencies]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-indigo-800 text-sm justify-center">
        <Activity className="w-4 h-4 text-indigo-600" />
        <span>Loading rates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm">
        <AlertCircle className="w-4 h-4" />
        <span>{error}</span>
        <button
          onClick={handleManualRefresh}
          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 transition-colors"
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative text-indigo-800 justify-center items-center">
      <style jsx>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(8px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-8px); }
        }

        .currency-container {
          animation: fadeInOut ${DISPLAY_INTERVAL}ms ease-in-out infinite;
          min-height: 3rem;
          background-color: #eef2ff; /* Light indigo-50 */
          border-radius: 8px;
          padding: 8px 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .refresh-button:hover {
          transform: scale(1.1);
          color: #4f46e5; /* indigo-600 */
        }
      `}</style>

      <div className="flex items-center gap-4 justify-center">
        <div className="currency-container flex flex-col sm:flex-row sm:gap-4 border !border-blue-500">
          {displayCurrencies.map((currency) => {
            const cached = rateCache[currency.code];
            const isStale = cached?.isStale || false;
            const rate = cached ? cached.rate : currency.marketRate;

            return (
              <div key={currency.code} className="flex items-center gap-2 justify-center">
                <span className="text-xs font-medium !text-indigo-500">
                  1 USDC = {formatRate(rate, currency)} {currency.code}
                </span>
                {isStale && (
                  <AlertCircle className="w-3 h-3 text-yellow-500" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {lastUpdateTime > 0 && (
        <div className="text-xs text-indigo-500 mt-1 justify-center items-center mx-auto text-center">
          Updated: {new Date(lastUpdateTime).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default CurrencyRatesWidget;