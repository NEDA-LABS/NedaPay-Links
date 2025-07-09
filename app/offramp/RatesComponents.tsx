import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Activity, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchSupportedCurrencies, fetchTokenRate } from '../utils/paycrest';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { horizontalLoop } from '../utils/horizontalLoop.js'; // Make sure this path is correct

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

const CACHE_DURATION = 21600000; // 6 hours
const MAX_RETRIES = 6;
const RETRY_DELAY = 1000;
const ITEMS_PER_VIEW = 4; // Number of items visible at once

const CurrencyRatesWidget = () => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [rateCache, setRateCache] = useState<RateCache>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(true);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const loopRef = useRef<any>(null); // Reference to GSAP loop

  const cleanup = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    retryTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    retryTimeoutsRef.current.clear();
    intervalRef.current = null;
    abortControllerRef.current = null;
    
    // Kill GSAP animation on cleanup
    if (loopRef.current) {
      loopRef.current.kill();
      loopRef.current = null;
    }
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
    const now = Date.now();
    const isStale = now - timestamp > CACHE_DURATION;
    return isStale;
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

  // Initialize GSAP horizontal loop
  useGSAP(() => {
    if (!containerRef.current || currencies.length === 0) return;
    
    const currencyItems = containerRef.current.querySelectorAll('.currency-item');
    if (currencyItems.length === 0) return;
    
    // Create the horizontal loop
    loopRef.current = horizontalLoop(currencyItems, {
      repeat: -1,
      speed: 0.5, // Set a default speed
      paused: isPaused,
      paddingRight: parseFloat(
        gsap.getProperty(currencyItems[0], 'marginRight') as string
      )
    });
    
    return () => {
      // Cleanup GSAP animation
      if (loopRef.current) {
        loopRef.current.kill();
        loopRef.current = null;
      }
    };
  }, { 
    scope: containerRef,
    dependencies: [currencies, isPaused] 
  });

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

  // Start animation after component mounts and currencies are loaded
  useEffect(() => {
    if (currencies.length > 0 && !loading) {
      setIsPaused(false);
      // Initialize the animation with speed
      if (loopRef.current) {
        loopRef.current.kill();
      }
      const currencyItems = containerRef.current?.querySelectorAll('.currency-item');
      if (currencyItems && currencyItems.length > 0) {
        loopRef.current = horizontalLoop(currencyItems, {
          repeat: -1,
          speed: 0.5, // Adjust speed as needed
          paused: isPaused,
          paddingRight: parseFloat(
            gsap.getProperty(currencyItems[0], 'marginRight') as string
          )
        });
      }
    }
  }, [currencies, loading, isPaused]);

  useEffect(() => {
    if (currencies.length > 0 && !loading) {
      // Rate refresh interval
      intervalRef.current = setInterval(() => {
        if (!isRefreshing) loadRates(currencies);
      }, 30000);
    }

    return cleanup;
  }, [currencies, loadRates, cleanup, loading, isRefreshing]);

  const handleManualRefresh = useCallback(() => {
    if (!isRefreshing && currencies.length > 0) {
      loadRates(currencies, true);
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

  if (loading) {
    return (
      <div className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-700">
        <div className="flex items-center justify-center gap-3">
          <Activity className="w-6 h-6 text-emerald-400 animate-pulse" />
          <span className="text-slate-300 text-sm font-medium">Loading exchange rates...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-gradient-to-r from-red-900/20 via-red-800/20 to-red-900/20 rounded-2xl p-6 shadow-2xl border border-red-700/50">
        <div className="flex items-center justify-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <span className="text-red-300 text-sm font-medium">{error}</span>
          <button
            onClick={handleManualRefresh}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-300 hover:text-red-100 
                       bg-red-900/30 hover:bg-red-900/50 rounded-lg transition-all duration-200
                       border border-red-700/50 hover:border-red-600/50"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden">
      <style dangerouslySetInnerHTML={{
        __html: `
          .rate-card {
            backdrop-filter: blur(10px);
            border-image: linear-gradient(135deg, 
              rgba(16, 185, 129, 0.2) 0%,
              rgba(16, 185, 129, 0.4) 50%,
              rgba(16, 185, 129, 0.2) 100%
            ) 1;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          }
          .rate-card:hover {
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          }
          .refresh-button {
            transition: all 0.2s ease;
          }
          .refresh-button:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
          }
          .header-glow {
            background: linear-gradient(90deg, 
              rgba(16, 185, 129, 0.1) 0%, 
              rgba(5, 150, 105, 0.2) 50%, 
              rgba(16, 185, 129, 0.1) 100%);
          }
        `
      }} />

      {/* Sliding Rates Container */}
      <div 
        className="relative overflow-hidden"
      >
        <div 
          ref={containerRef}
          className="flex"
        >
          {currencies.map((currency) => {
            const cached = rateCache[currency.code];
            const isStale = cached?.isStale || false;
            const rate = cached ? cached.rate : currency.marketRate;

            return (
                <div 
                  key={currency.code}
                  className="sm:min-w-[200px] sm:max-w-[260px] md:min-w-[220px] md:max-w-[280px] currency-item rate-card group relative overflow-hidden p-4 mx-3 !rounded-2xl flex-shrink-0 
                             bg-gradient-to-br from-slate-900/95 to-slate-800/90 backdrop-blur-sm
                             border border-slate-700/50 hover:border-emerald-500/30 
                              hover:shadow-xl hover:shadow-emerald-500/10
                             hover:scale-[1.02] cursor-pointer"
                  style={{ 
                    width: `calc(${100 / ITEMS_PER_VIEW}% - 1.5rem)`,
                    minWidth: '180px',
                    maxWidth: '240px'
                  }}
                >
                  {/* Animated background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-blue-500/5 
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Header section */}
                  <div className="relative flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 
                                        flex items-center justify-center border border-emerald-500/30
                                        group-hover:border-emerald-400/50 transition-all duration-300">
                          <span className="text-emerald-400 font-bold text-xs font-mono">
                            {currency.symbol}
                          </span>
                        </div>
                        
                      </div>
                      <div className="space-y-1">
                        <div className="text-white font-bold text-sm tracking-wide">
                          {currency.code}
                        </div>
                        <div className="text-slate-400 text-xs font-medium tracking-wider uppercase">
                          {currency.name}
                        </div>
                      </div>
                    </div>
                    
                    
                  </div>
                  
                  {/* Rate section */}
                  <div className="relative space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-slate-400 text-xs font-medium">1 USDC</span>
                      <span className="text-slate-500 text-sm">=</span>
                    </div>
                    
                    <div className="relative">
                      <div className="text-sm font-bold font-mono text-transparent bg-clip-text 
                                      bg-gradient-to-r from-emerald-400 to-emerald-300 
                                      group-hover:from-emerald-300 group-hover:to-emerald-400 
                                      transition-all duration-300">
                        {formatRate(rate, currency)}
                      </div>
                      
                      
                    </div>
                    
                   
                  </div>
                  
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/0 to-blue-500/0 
                                  group-hover:from-emerald-500/5 group-hover:to-blue-500/5 
                                  transition-all duration-500 pointer-events-none" />
                </div>
              );
          })}
        </div>
      </div>
    </div>
  );
};

export default CurrencyRatesWidget;