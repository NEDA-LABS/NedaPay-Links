import { normalize } from 'viem/ens';

export const isPotentialEnsName = (input: string, chainId?: number) => {
  const trimmed = input.trim();
  return /\.eth$/i.test(trimmed) || 
    (chainId === 8453 && /\.base\.eth$/i.test(trimmed));
};

export type EnsClientResult = {
  name: string | null;
  address: `0x${string}`;
  avatar: string | null;
};

export async function resolveEnsClient(
  domain: string,
  chainId: number = 1 // ENS on mainnet
): Promise<EnsClientResult | null> {
  const normalized = normalize(domain.trim());
  const qs = new URLSearchParams({ domain: normalized, chain_id: `${chainId}` });
  const res = await fetch(`/api/ens?${qs.toString()}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    return null;
  }

  const data = (await res.json()) as {
    name: string | null;
    address: string;
    avatar: string | null;
  };

  return {
    name: data?.name ?? null,
    address: data?.address as `0x${string}`,
    avatar: data?.avatar ?? null,
  };
}
