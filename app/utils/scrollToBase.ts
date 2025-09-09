import {
  createMeeClient, 
  toMultichainNexusAccount,
  getMeeScanLink,
  getMEEVersion,
  MEEVersion,
  type MeeClient,
  type MultichainSmartAccount,
  mcUSDC, // multichain helper for USDC addresses
} from "@biconomy/abstractjs";
import { base, scroll } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { Address, createWalletClient, custom, http, erc20Abi, encodeFunctionData, type Hex, type Chain } from "viem";

export type ScrollToBaseClient = {
  meeClient: MeeClient;
  smartAccount: MultichainSmartAccount;
  authorization?: any; // Store the authorization for EIP-7702
};

export type SignAuthorizationFunction = (params: {
  contractAddress: `0x${string}`;
  chainId: number;
  nonce: number;
}) => Promise<any>;

export type WalletType = {
  address: `0x${string}`;
  getEthereumProvider: () => Promise<any>;
  switchChain: (chainId: number) => Promise<void>;
  walletClientType?: string;
};

export type CrossChainTransferParams = {
  recipientOnBase: Address;
  amountUSDC: bigint;
  bridgeAdapterAddress?: Address;
  bridgeCalldata?: `0x${string}`;
  payFeesInUSDC?: boolean;
};

export type TransferResult = {
  hash: string;
  explorerLink: string;
  quote: any;
};

// Chain configuration map using viem chain imports
const CHAIN_CONFIG: Record<number, Chain> = {
  [base.id]: base,
  [scroll.id]: scroll,
};

// Default bridge adapter addresses (you should replace these with actual addresses)
const DEFAULT_BRIDGE_ADAPTERS = {
  [scroll.id]: "0x1234567890123456789012345678901234567890" as Address, // Replace with actual Scroll bridge adapter
  [base.id]: "0x2345678901234567890123456789012345678901" as Address,   // Replace with actual Base bridge adapter
};

export const initializeScrollToBase = async (
  wallet: WalletType,
  signAuthorization: any, // EIP-7702 authorization - required for embedded wallets
  chainId: number
): Promise<ScrollToBaseClient> => {
  if (!wallet?.address) {
    console.log("Wallet not connected or address not available");
    throw new Error('Wallet not connected or address not available');
  }

  if (!signAuthorization) {
    console.log("Authorization is required for embedded wallet gas abstraction (EIP-7702)");
    throw new Error('Authorization is required for embedded wallet gas abstraction (EIP-7702)');
  }

  const chain = CHAIN_CONFIG[chainId];
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}. Supported chains: ${Object.keys(CHAIN_CONFIG).join(', ')}`);
  }

  // Switch to selected chain
  await wallet.switchChain(chainId);

  let provider = await wallet.getEthereumProvider();
  console.log("provider", provider);

  if (!provider) {
    console.log("provider not available");
    throw new Error('Ethereum provider not available');
  }

  const nexus120Singleton = '0x000000004F43C49e93C970E84001853a70923B03';

  const authorization = await signAuthorization({
    account: wallet,
    contractAddress: nexus120Singleton,
    // Chain ID 0 makes it valid across all chains
    chainId: chainId, 
    // Use nonce 0 for fresh embedded wallet accounts
    nonce: 0   
  });

  // Create Nexus smart account
  const smartAccount = await toMultichainNexusAccount({
    chainConfigurations: [
      {
        chain: scroll,
        transport: custom(provider),
        version: getMEEVersion(MEEVersion.V2_1_0)
      },
      {
        chain: base,
        transport: custom(provider),
        version: getMEEVersion(MEEVersion.V2_1_0)
      },
    ],
    signer: await wallet.getEthereumProvider(),
    accountAddress: wallet.address as `0x${string}`,
  });

  // Create a MEE client bound to that multichain account
  const meeClient = await createMeeClient({ account: smartAccount });

  console.log("meeClient initialized:", meeClient);

  return { meeClient, smartAccount, authorization };
};

/**
 * Execute cross-chain USDC transfer from Scroll to Base
 * Pays on Scroll, delivers on Base
 */
export async function executeScrollToBaseUSDC({
  meeClient,
  amountUSDC,
  recipientOnBase,
  bridgeAdapterOnScroll,
  bridgeCalldata,
  useUSDCForFeesOnBase = true,
  authorization,
}: {
  meeClient: MeeClient;
  amountUSDC: bigint;
  recipientOnBase: Address;
  bridgeAdapterOnScroll: Address;
  bridgeCalldata: Hex;
  useUSDCForFeesOnBase?: boolean;
  authorization?: any;
}): Promise<{ hash: Hex; explorerUrl?: string }> {
  // --- Encode ERC20 calls with viem ---
  const approveCalldata = encodeFunctionData({
    abi: erc20Abi,
    functionName: "approve",
    args: [bridgeAdapterOnScroll, amountUSDC],
  });

  const transferOnBaseCalldata = encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [recipientOnBase, amountUSDC],
  });

  // --- Build multi-chain instructions ---
  const instructions = [
    // Step A — SCROLL: approve + bridge
    {
      chainId: scroll.id,
      calls: [
        {
          to: mcUSDC.addressOn(scroll.id) as Address,
          data: approveCalldata,
          value: 0n,
        },
        {
          to: bridgeAdapterOnScroll,
          data: bridgeCalldata,
          value: 0n,
        },
      ],
    },
    // Step B — BASE: transfer USDC to recipient (skip if your bridge sets final recipient)
    {
      chainId: base.id,
      calls: [
        {
          to: mcUSDC.addressOn(base.id) as Address,
          data: transferOnBaseCalldata,
          value: 0n,
        },
      ],
    },
  ];

  // Decide fee mode
  // - sponsorship: false => user pays (optionally via feeToken)
  // - sponsorship: true  => sponsored gas (no feeToken allowed)
  const wantsFeeToken = !!useUSDCForFeesOnBase;

  // --- 1) Quote (NON-SPONSORED path with optional feeToken) ---
  const quote = await meeClient.getQuote({
    instructions,
    authorization: authorization,
    feeToken: {
      address: mcUSDC.addressOn(base.id) as Address,
      chainId: base.id,
    },
  });

  // --- 2) Execute with a single signature ---
  const execResult = await meeClient.executeQuote({
    quote
  });

  const hash = execResult.hash as Hex;

  let explorerUrl: string | undefined;
  try {
    explorerUrl = getMeeScanLink(hash);
  } catch {
    // optional convenience only
  }

  return { hash, explorerUrl };
}
