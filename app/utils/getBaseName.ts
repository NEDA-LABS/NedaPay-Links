import {
  type Address,
  createPublicClient,
  encodePacked,
  http,
  keccak256,
  namehash,
} from "viem";
import L2ResolverAbi from "../abi/L2ResolverAbi";
import { base, mainnet } from "viem/chains";

export type Basename = `${string}.base.eth`;

export const BASENAME_L2_RESOLVER_ADDRESS =
  "0xC6d566A56A1aFf6508b41f6c90ff131615583BCD";

const baseClient = createPublicClient({
  chain: base,
  transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL as string),
});

/**
 * Convert an chainId to a coinType hex for reverse chain resolution
 */
export const convertChainIdToCoinType = (chainId: number): string => {
  // L1 resolvers to addr
  if (chainId === mainnet.id) {
    return "addr";
  }

  const cointype = (0x80000000 | chainId) >>> 0;
  return cointype.toString(16).toLocaleUpperCase();
};

/**
 * Convert an address to a reverse node for ENS resolution
 */
export const convertReverseNodeToBytes = (
  address: Address,
  chainId: number
) => {
  const addressFormatted = address.toLocaleLowerCase() as Address;
  const addressNode = keccak256(addressFormatted.substring(2) as Address);
  const chainCoinType = convertChainIdToCoinType(chainId);
  const baseReverseNode = namehash(
    `${chainCoinType.toLocaleUpperCase()}.reverse`
  );
  const addressReverseNode = keccak256(
    encodePacked(["bytes32", "bytes32"], [baseReverseNode, addressNode])
  );
  return addressReverseNode;
};

export async function getBasename(address: Address) {
  const addressReverseNode = convertReverseNodeToBytes(address, base.id);
  const basename = await baseClient.readContract({
    abi: L2ResolverAbi,
    address: BASENAME_L2_RESOLVER_ADDRESS,
    functionName: "name",
    args: [addressReverseNode],
  });
  if (basename) {
    return basename as Basename;
  }
  return undefined;
}

export async function resolveBasenameToAddress(basename: Basename) {
  const baseCoinType = BigInt((0x80000000 | base.id) >>> 0);

  const addr = await baseClient.readContract({
    abi: L2ResolverAbi,
    address: BASENAME_L2_RESOLVER_ADDRESS,
    functionName: "addr", // overload with coinType
    args: [namehash(basename), baseCoinType], // namehash + Base coinType
  });

  if (addr) {
    console.log("found.............", addr)
    return addr as Address;
  }
  console.log("not found.................")
  return undefined;
}

export async function resolveEnsName(ensName: string): Promise<string | null> {
  try {
    // This is a simplified version - in a real implementation, you might want to
    // use the same underlying libraries that @coinbase/onchainkit uses
    
    // For now, we'll use a fetch-based approach similar to common ENS resolvers
    const response = await fetch(
      `https://api.ensideas.com/ens/resolve/${ensName.toLowerCase()}`
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.address || null;
    }
    
    return null;
  } catch (error) {
    console.warn('ENS resolution failed:', error);
    return null;
  }
}
