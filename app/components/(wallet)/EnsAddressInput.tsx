'use client';

import { ChangeEvent, useEffect } from 'react';
import { Check, Loader2, XCircle } from 'lucide-react';
import { useEnsResolve } from '@/hooks/useEnsResolve';


type Props = {
  value: string;                               // raw input (ens or address)
  onChange: (v: string) => void;
  onResolved?: (addr: `0x${string}` | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  helperBelow?: boolean; // place status below input (defaults true)
};

export default function EnsAddressInput({
  value,
  onChange,
  onResolved,
  label = 'Recipient (ENS or Address)',
  placeholder = 'vitalik.eth or 0x...',
  disabled,
  helperBelow = true,
}: Props) {
  const { isResolving, resolvedAddress, isValid, error, mode, result } =
    useEnsResolve(value);

  useEffect(() => {
    onResolved?.(resolvedAddress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedAddress]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const ring =
    isResolving
      ? 'focus:ring-blue-500'
      : isValid
      ? 'focus:ring-green-500'
      : error
      ? 'focus:ring-red-500'
      : 'focus:ring-blue-500';

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-3 border rounded-xl text-gray-900 dark:text-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 outline-none focus:ring-2 ${ring} pr-10`}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isResolving ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : isValid ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : error ? (
            <XCircle className="h-4 w-4 text-red-500" />
          ) : null}
        </div>
      </div>

      {helperBelow && (
        <div className="mt-2 min-h-[20px] text-xs">
          {isResolving && (
            <span className="text-gray-500 dark:text-gray-400">Resolving ENS…</span>
          )}
          {!isResolving && isValid && result?.name && (
            <span className="text-green-700 dark:text-green-400">
              {result.name} → {resolvedAddress?.slice(0, 6)}…{resolvedAddress?.slice(-4)}
            </span>
          )}
          {!isResolving && error && (
            <span className="text-red-600 dark:text-red-400">{error}</span>
          )}
          {!isResolving && mode === 'unknown' && value && (
            <span className="text-red-600 dark:text-red-400">Not a valid address or ENS name.</span>
          )}
        </div>
      )}
    </div>
  );
}
