export const IDRX_ADDRESSES: Record<string, `0x${string}`> = {
    base: "0x18Bc5bcC660cf2B9cE3cd51a404aFe1a0cBD3C22",
    lisk: "0x18Bc5bcC660cf2B9cE3cd51a404aFe1a0cBD3C22",
    etherlink: "0x18bc5bcc660cf2b9ce3cd51a404afe1a0cbd3c22" as `0x${string}`,
    polygon: "0x649a2DA7B28E0D54c13D5eFf95d3A660652742cC",
    bsc: "0x649a2DA7B28E0D54c13D5eFf95d3A660652742cC",
    }; // per IDRX Supported Chain and Contract Address docs.
    
    
    export const CHAIN_PARAMS: Record<string, { chainIdHex: string; rpcUrlEnv: string; name: string }> = {
    polygon: { chainIdHex: "0x89", rpcUrlEnv: "RPC_POLYGON", name: "Polygon" },
    bsc: { chainIdHex: "0x38", rpcUrlEnv: "RPC_BSC", name: "BNB Smart Chain" },
    base: { chainIdHex: "0x2105", rpcUrlEnv: "RPC_BASE", name: "Base" },
    lisk: { chainIdHex: "0x46F", rpcUrlEnv: "RPC_LISK", name: "Lisk" },
    };
    
    
    // Example other stablecoins (override as needed)
    export const DEFAULT_TOKENS: Record<string, { symbol: string; address: `0x${string}` }> = {
    polygon_usdt: { symbol: "USDT", address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F" },
    bsc_usdt: { symbol: "USDT", address: "0x55d398326f99059fF775485246999027B3197955" },
    base_usdc: { symbol: "USDC", address: "0x833589fCD6EDB6E08f4c7C32D4f71b54bdA02913" },
    // lisk USDT0 — supply your address once confirmed
    };