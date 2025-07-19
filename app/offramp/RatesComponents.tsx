import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Activity, AlertCircle, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { fetchSupportedCurrencies, fetchTokenRate } from '../utils/paycrest';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { horizontalLoop } from '../utils/horizontalLoop';

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

const CACHE_DURATION = 10800000; // 3 hours
const REFRESH_INTERVAL = 60000; // 60 seconds
const REQUEST_DELAY = 300; // 300ms delay between requests
const MAX_CONCURRENT_REQUESTS = 3;

// Function to get country flag based on currency code
const getCountryFlag = (currencyCode: string): string => {
  switch (currencyCode) {
    case 'KES': return 'http://purecatamphetamine.github.io/country-flag-icons/3x2/KE.svg';
    case 'NGN': return 'http://purecatamphetamine.github.io/country-flag-icons/3x2/NG.svg';
    case 'TZS': return 'http://purecatamphetamine.github.io/country-flag-icons/3x2/TZ.svg';
    case 'UGX': return 'http://purecatamphetamine.github.io/country-flag-icons/3x2/UG.svg';
    case 'XOF': return 'http://purecatamphetamine.github.io/country-flag-icons/3x2/CI.svg'; // Côte d'Ivoire (Ivory Coast)
    case 'GHS': return 'http://purecatamphetamine.github.io/country-flag-icons/3x2/GH.svg';
    default: return 'http://purecatamphetamine.github.io/country-flag-icons/3x2/US.svg';
  }
};
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;
const ITEMS_PER_VIEW = 4;

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
  const requestQueueRef = useRef<Set<Promise<void>>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const loopRef = useRef<any>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    retryTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    retryTimeoutsRef.current.clear();
    intervalRef.current = null;
    abortControllerRef.current = null;
    
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
      return await fetchTokenRate(fromToken="USDC", amount, toCurrency);
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
      // Filter out XOF currencies and sort the rest
      const filteredCurrencies = supportedCurrencies.filter(currency => !currency.code.startsWith('XOF'));
      const sortedCurrencies = [...filteredCurrencies].sort((a, b) => 
        a.code.localeCompare(b.code)
      );
      setCurrencies(sortedCurrencies);
      return sortedCurrencies;
    } catch (err) {
      console.error('Failed to load currencies:', err);
      throw new Error('Failed to load supported currencies');
    }
  }, []);

  const processRateRequest = useCallback(async (
    currency: Currency,
    now: number,
    newCacheEntries: RateCache
  ) => {
    try {
      const rate = await fetchRateWithRetry('USDC', 1, currency.code);
      newCacheEntries[currency.code] = {
        rate,
        timestamp: now,
        isStale: false
      };
    } catch (error) {
      console.warn(`Failed to fetch rate for ${currency.code}:`, error);
      newCacheEntries[currency.code] = {
        rate: currency.marketRate,
        timestamp: now,
        isStale: true
      };
    }
  }, [fetchRateWithRetry]);

  const loadRates = useCallback(async (currenciesToLoad: Currency[], forceRefresh = false) => {
    if (!currenciesToLoad.length) return;

    try {
      setIsRefreshing(true);
      abortControllerRef.current = new AbortController();
      const now = Date.now();
      const newCacheEntries: RateCache = {};
      const currenciesToUpdate: Currency[] = [];

      // Determine which currencies need updates
      currenciesToLoad.forEach(currency => {
        const cached = rateCache[currency.code];
        if (forceRefresh || !cached || isRateStale(cached.timestamp)) {
          currenciesToUpdate.push(currency);
        }
      });

      if (currenciesToUpdate.length > 0) {
        // Process requests with concurrency control
        const processQueue = async () => {
          const activeRequests = new Set<Promise<void>>();
          
          for (const currency of currenciesToUpdate) {
            if (abortControllerRef.current?.signal.aborted) break;

            // Wait if we've reached max concurrent requests
            while (activeRequests.size >= MAX_CONCURRENT_REQUESTS) {
              await Promise.race(activeRequests);
            }

            const requestPromise = processRateRequest(currency, now, newCacheEntries)
              .finally(() => activeRequests.delete(requestPromise));

            activeRequests.add(requestPromise);
            requestQueueRef.current.add(requestPromise);
            
            // Add delay between requests if not the last one
            if (currency !== currenciesToUpdate[currenciesToUpdate.length - 1]) {
              await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
            }
          }

          // Wait for all remaining requests to complete
          await Promise.all(activeRequests);
        };

        await processQueue();
        
        // Update cache with all new entries
        setRateCache(prev => ({ ...prev, ...newCacheEntries }));
      }

      setLastUpdateTime(now);
      setError(null);
    } catch (err) {
      console.error('Failed to load rates:', err);
      setError('Failed to load rates. Please try again later.');
    } finally {
      setIsRefreshing(false);
      abortControllerRef.current = null;
      requestQueueRef.current.clear();
    }
  }, [isRateStale, fetchRateWithRetry, rateCache]);

  // GSAP animation setup
  useGSAP(() => {
    if (!containerRef.current || currencies.length === 0) return;
    
    const currencyItems = containerRef.current.querySelectorAll('.currency-item');
    if (currencyItems.length === 0) return;
    
    loopRef.current = horizontalLoop(currencyItems, {
      repeat: -1,
      speed: 0.5,
      paused: isPaused,
      paddingRight: parseFloat(
        gsap.getProperty(currencyItems[0], 'marginRight') as string
      )
    });
    
    return () => {
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
    return cleanup;
  }, [loadCurrencies, loadRates, cleanup]);

  useEffect(() => {
    if (currencies.length > 0 && !loading) {
      setIsPaused(false);
    }
  }, [currencies, loading]);

  useEffect(() => {
    if (currencies.length > 0 && !loading) {
      intervalRef.current = setInterval(() => {
        if (!isRefreshing) loadRates(currencies);
      }, REFRESH_INTERVAL);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currencies, loadRates, loading, isRefreshing]);

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

  // Simulate price change for demo (you can replace with actual logic)
  const getPriceChange = useCallback((currency: Currency) => {
    const changes = [-2.5, -1.2, 0, 1.8, 3.4, -0.8, 2.1];
    const change = changes[currency.code.charCodeAt(0) % changes.length];
    return change;
  }, []);

  if (loading) {
    return (
      <div className="w-full p-6 shadow-2xl">
        <div className="flex items-center justify-center gap-3">
          <Activity className="w-6 h-6 text-emerald-400 animate-pulse" />
          <span className="text-slate-300 text-sm font-medium">Loading exchange rates...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full shadow-2xl">
        {/* <div className="flex items-center justify-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <span className="text-red-300 text-sm font-medium">{error}</span>
          <button
            onClick={handleManualRefresh}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-300 hover:text-red-100 
                       transition-all duration-200
                       border border-red-700/50 hover:border-red-600/50"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Retry
          </button>
        </div> */}
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden">
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.1); }
            50% { box-shadow: 0 0 40px rgba(16, 185, 129, 0.2); }
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-2px) rotate(1deg); }
            66% { transform: translateY(1px) rotate(-1deg); }
          }

          .currency-card {
            position: relative;
            background: linear-gradient(145deg, 
              rgba(15, 23, 42, 0.95) 0%,
              rgba(30, 41, 59, 0.9) 50%,
              rgba(15, 23, 42, 0.95) 100%
            );
            backdrop-filter: blur(20px);
            border: 1px solid rgba(148, 163, 184, 0.1);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
          }

          .currency-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.5), transparent);
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          .currency-card:hover::before {
            opacity: 1;
          }

          .currency-card:hover {
            transform: translateY(-8px) scale(1.02);
            border-color: rgba(16, 185, 129, 0.3);
            box-shadow: 
              0 20px 60px rgba(0, 0, 0, 0.4),
              0 0 40px rgba(16, 185, 129, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
            animation: pulse-glow 2s ease-in-out infinite;
          }

          .currency-card.stale {
            border-color: rgba(245, 158, 11, 0.2);
            background: linear-gradient(145deg, 
              rgba(45, 30, 15, 0.95) 0%,
              rgba(59, 41, 30, 0.9) 50%,
              rgba(45, 30, 15, 0.95) 100%
            );
          }

          .currency-card.stale:hover {
            border-color: rgba(245, 158, 11, 0.4);
            box-shadow: 
              0 20px 60px rgba(0, 0, 0, 0.4),
              0 0 40px rgba(245, 158, 11, 0.1);
          }

          .shimmer-effect {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.05),
              transparent
            );
            animation: shimmer 2s infinite;
            opacity: 0;
          }

          .currency-card:hover .shimmer-effect {
            opacity: 1;
          }

          .currency-icon {
            background: linear-gradient(135deg, 
              rgba(16, 185, 129, 0.2) 0%,
              rgba(16, 185, 129, 0.1) 100%
            );
            border: 1px solid rgba(16, 185, 129, 0.2);
            position: relative;
            overflow: hidden;
          }

          .currency-icon::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: conic-gradient(from 0deg, transparent, rgba(16, 185, 129, 0.1), transparent);
            animation: float 4s ease-in-out infinite;
          }

          .stale .currency-icon {
            background: linear-gradient(135deg, 
              rgba(245, 158, 11, 0.2) 0%,
              rgba(245, 158, 11, 0.1) 100%
            );
            border-color: rgba(245, 158, 11, 0.3);
          }

          .price-display {
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.1));
            border: 1px solid rgba(148, 163, 184, 0.1);
            backdrop-filter: blur(10px);
          }

          .trend-indicator {
            transition: all 0.3s ease;
          }

          .trend-up {
            color: #10b981;
            animation: float 2s ease-in-out infinite;
          }

          .trend-down {
            color: #ef4444;
            animation: float 2s ease-in-out infinite reverse;
          }

          .trend-neutral {
            color: #64748b;
          }

          .glass-border {
            border: 1px solid;
            border-image: linear-gradient(135deg, 
              rgba(255, 255, 255, 0.1),
              rgba(255, 255, 255, 0.05),
              rgba(255, 255, 255, 0.1)
            ) 1;
          }
        `
      }} />

      <div className="relative overflow-hidden">
        <div 
          ref={containerRef}
          className="flex"
        >
          {currencies.map((currency) => {
            const cached = rateCache[currency.code];
            const isStale = cached?.isStale || false;
            const rate = cached ? cached.rate : currency.marketRate;
            const priceChange = getPriceChange(currency);

            return (
              <div 
                key={currency.code}
                className={`currency-item currency-card group relative overflow-hidden mx-20 rounded-2xl flex-shrink-0 
                           ${isStale ? 'stale' : ''}`}
                style={{ 
                  width: `calc(${100 / ITEMS_PER_VIEW}% - 1.5rem)`,
                  minWidth: '220px',
                  maxWidth: '280px',
                  padding: '24px'
                }}
              >
                {/* Shimmer effect */}
                <div className="shimmer-effect"></div>
                
                {/* Status indicator */}
                {isStale && (
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                    <span className="text-amber-400 text-xs font-medium opacity-70">STALE</span>
                  </div>
                )}

                {/* Live indicator for fresh data */}
                {!isStale && (
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-emerald-400 text-xs font-medium opacity-70">LIVE</span>
                  </div>
                )}
                
                {/* Header */}
                <div className="relative flex items-center gap-4 mb-6">
                  <div className="currency-icon w-14 h-14 rounded-2xl flex items-center justify-center relative">
                    <img 
                      src={getCountryFlag(currency.code)} 
                      alt={`${currency.code} flag`} 
                      className={`${isStale ? 'opacity-90' : 'opacity-100'} w-8 h-8 object-contain relative z-10`} 
                    />
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-bold text-sm tracking-tight">
                        {currency.code}
                      </h3>
                      {/* Trend indicator */}
                      <div className={`trend-indicator ${
                        priceChange > 0 ? 'trend-up' : priceChange < 0 ? 'trend-down' : 'trend-neutral'
                      }`}>
                        {priceChange > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : priceChange < 0 ? (
                          <TrendingDown className="w-4 h-4" />
                        ) : (
                          <Minus className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm font-medium leading-tight">
                      {currency.name}
                    </p>
                  </div>
                </div>
                
                {/* Exchange rate section */}
                <div className="space-y-2">
                  {/* From section */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">FROM</span>
                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/30">
                      <span className="text-slate-300 font-mono">1.00</span>
                      <span className="text-emerald-400 font-bold">USDC</span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-slate-500 to-transparent relative">
                      <div className="absolute right-0 top-[-2px] w-0 h-0 border-l-[4px] border-l-slate-500 border-t-[2px] border-b-[2px] border-t-transparent border-b-transparent"></div>
                    </div>
                  </div>

                  {/* To section - Main rate display */}
                  <div className="price-display rounded-xl p-4 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-500 text-xs font-medium">TO</span>
                      <span className="text-slate-400 text-xs font-mono">
                        {new Date().toLocaleTimeString('en-US', { 
                          hour12: false, 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    
                    <div className="flex items-baseline gap-2">
                      <div className={`text-sm font-bold font-mono text-transparent bg-clip-text 
                                      ${isStale 
                                        ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-200' 
                                        : 'bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-200'
                                      }
                                      group-hover:from-white group-hover:via-slate-200 group-hover:to-slate-300
                                      transition-all duration-500`}>
                        {formatRate(rate, currency)}
                      </div>
                      <span className="text-slate-400 font-medium text-sm">
                        {currency.code}
                      </span>
                    </div>

                    {/* Price change indicator */}
                    <div className="mt-2 flex items-center justify-between">
                      <div className={`flex items-center gap-1 text-xs font-medium
                                      ${priceChange > 0 ? 'text-emerald-400' : priceChange < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                        {priceChange !== 0 && (
                          <>
                            <span>{priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%</span>
                            <span className="text-slate-600">24h</span>
                          </>
                        )}
                        {priceChange === 0 && <span className="text-slate-500">No change</span>}
                      </div>
                      
                      {/* Data freshness indicator */}
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        isStale ? 'bg-amber-400/50' : 'bg-emerald-400/50'
                      } animate-pulse`}></div>
                    </div>

                    {/* Subtle background pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-transparent to-blue-400/10"></div>
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-radial from-emerald-400/5 to-transparent rounded-full transform translate-x-8 -translate-y-8"></div>
                    </div>
                  </div>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 
                                opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CurrencyRatesWidget;