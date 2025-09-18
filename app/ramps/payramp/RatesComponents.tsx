import React, { useEffect, useState } from 'react';
import { fetchSupportedCurrencies, fetchTokenRate } from '@/utils/paycrest';

// ------------ SAME HELPER AS IN YOUR ORIGINAL FILE ------------
const getCountryFlag = (currencyCode: string): string => {
  switch (currencyCode) {
    case 'KES': return 'https://purecatamphetamine.github.io/country-flag-icons/3x2/KE.svg';
    case 'NGN': return 'https://purecatamphetamine.github.io/country-flag-icons/3x2/NG.svg';
    case 'TZS': return 'https://purecatamphetamine.github.io/country-flag-icons/3x2/TZ.svg';
    case 'UGX': return 'https://purecatamphetamine.github.io/country-flag-icons/3x2/UG.svg';
    case 'GHS': return 'https://purecatamphetamine.github.io/country-flag-icons/3x2/GH.svg';
    case 'ZAR': return 'https://purecatamphetamine.github.io/country-flag-icons/3x2/ZA.svg';
    default:    return 'https://purecatamphetamine.github.io/country-flag-icons/3x2/US.svg';
  }
};

interface Currency {
  code: string;
  decimals: number;
}

interface RatePair {
  code: string;
  flag: string;
  rate: string;
}

const CurrencyTicker = () => {
  const [pairs, setPairs] = useState<RatePair[]>([]);

  useEffect(() => {
    (async () => {
      try {
        // 1. supported currencies
        const currencies: Currency[] = await fetchSupportedCurrencies();
        // console.log("currencies", currencies);

        // 2. keep only the ones in the screenshot
        const whitelist = ['KES', 'NGN', 'TZS', 'UGX', 'ZAR'];
        const filtered = currencies.filter((c) => whitelist.includes(c.code));
        // console.log("filtered", filtered);

        // 3. live rates
        const fetched = await Promise.all(
          filtered.map(async (c) => ({
            code: c.code,
            flag: getCountryFlag(c.code),
            rate: await fetchTokenRate('USDC', 1, c.code, 'base'),
          }))
        );
        // console.log("fetched", fetched);

        // 4. duplicate for seamless loop
        setPairs([...fetched, ...fetched, ...fetched, ...fetched, ...fetched]);
      } catch {
        /* silent fail for brevity */
        console.log("rates failed");
      }
    })();
  }, []);

  return (
    <div
      className="currency-ticker lg:rounded-xl lg:bg-slate-900/30 p-1 md:p-2 lg:w-[80vw] mx-auto"
      style={{
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div
        className="flex items-center gap-8"
        style={{
          width: 'max-content',
          animation: 'scroll 40s linear infinite',
        }}
      >
        {pairs.map((pair, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-white text-sm whitespace-nowrap"
          >
            <img src={pair.flag} alt={pair.code} className="w-5 h-4 rounded-sm" />
            <span className='text-green-500 font-semibold text-xs md:text-base'>
              {Number(pair.rate).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              {pair.code}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
      `}</style>
    </div>
  );
};

export default CurrencyTicker;