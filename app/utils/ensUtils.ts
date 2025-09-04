// utils/resolveName.ts
import { getBasename } from './getBaseName';
import { base } from 'wagmi/chains';
import { Name } from '@coinbase/onchainkit/identity';

// Cache for resolved names
const nameCache = new Map<string, string | null>();

export interface ResolveNameOptions {
  address: `0x${string}`;
  chain?: any;
  refresh?: boolean;
}

/**
 * Resolves an address to its ENS name (.eth or .base.eth)
 * @param options ResolveNameOptions
 * @returns Promise<string | null> - The resolved name or null if not found
 */
export async function resolveName(options: ResolveNameOptions): Promise<string | null> {
  const { address, chain = base, refresh = false } = options;

  // Check cache first (unless refresh is requested)
  if (!refresh && nameCache.has(address.toLowerCase())) {
    return nameCache.get(address.toLowerCase()) || null;
  }

  try {
    // Try to get .base.eth name first
    const baseName = await getBasename(address);
    if (baseName) {
      nameCache.set(address.toLowerCase(), baseName);
      return baseName;
    }

    // Fallback to .eth name resolution using OnchainKit's Name component
    // Since Name is a React component, we need to simulate its behavior
    // or use the underlying logic that Name uses
    
    // For now, we'll create a simple ENS resolver that mimics Name behavior
    const ensName = await resolveEnsName(address, chain);
    
    if (ensName) {
      nameCache.set(address.toLowerCase(), ensName);
      return ensName;
    }

    // If no name found, cache null to prevent future lookups
    nameCache.set(address.toLowerCase(), null);
    return null;
  } catch (error) {
    console.error('Error resolving name:', error);
    return null;
  }
}

/**
 * Resolve ENS name using similar logic to OnchainKit's Name component
 */
async function resolveEnsName(address: `0x${string}`, chain: any): Promise<string | null> {
  try {
    // This is a simplified version - in a real implementation, you might want to
    // use the same underlying libraries that @coinbase/onchainkit uses
    
    // For now, we'll use a fetch-based approach similar to common ENS resolvers
    const response = await fetch(
      `https://api.ensideas.com/ens/resolve/${address.toLowerCase()}`
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.name || null;
    }
    
    return null;
  } catch (error) {
    console.warn('ENS resolution failed:', error);
    return null;
  }
}

/**
 * Utility to convert any address string to properly formatted `0x${string}`
 */
export function toHexAddress(address: string): `0x${string}` {
  return (address.startsWith('0x') ? address : `0x${address}`) as `0x${string}`;
}

/**
 * Clear the name cache (useful for testing or when you want to force fresh lookups)
 */
export function clearNameCache(): void {
  nameCache.clear();
}