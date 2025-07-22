import { createWalletClient, custom, http, erc20Abi, type Hex, type Chain } from 'viem';
import { 
  createMeeClient, 
  toMultichainNexusAccount,
  getMeeScanLink,
  type MeeClient,
  type MultichainSmartAccount 
} from '@biconomy/abstractjs';

// Types
export type BiconomyEmbeddedClient = {
  meeClient: MeeClient;
  smartAccount: MultichainSmartAccount;
  walletClient: any;
};

export type WalletType = {
  address: `0x${string}`;
  getEthereumProvider: () => Promise<any>;
  switchChain: (chainId: number) => Promise<void>;
  walletClientType?: string;
};

// Chain configuration map
const CHAIN_CONFIG: Record<number, Chain> = {
  8453: { id: 8453, name: 'Base', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['https://mainnet.base.org'] } }, blockExplorers: { default: { name: 'Basescan', url: 'https://basescan.org' } } },
  42161: { id: 42161, name: 'Arbitrum One', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['https://arb1.arbitrum.io/rpc'] } }, blockExplorers: { default: { name: 'Arbiscan', url: 'https://arbiscan.io' } } },
  137: { id: 137, name: 'Polygon', nativeCurrency: { name: 'Matic', symbol: 'MATIC', decimals: 18 }, rpcUrls: { default: { http: ['https://polygon-rpc.com'] } }, blockExplorers: { default: { name: 'Polygonscan', url: 'https://polygonscan.com' } } },
  42220: { id: 42220, name: 'Celo', nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 }, rpcUrls: { default: { http: ['https://forno.celo.org'] } }, blockExplorers: { default: { name: 'Celoscan', url: 'https://celoscan.io' } } }
};

export const initializeBiconomyEmbedded = async (
  wallet: WalletType,
  signAuthorization: any,
  chainId: number
): Promise<BiconomyEmbeddedClient> => {
  if (!wallet?.address) {
    throw new Error('Wallet not connected or address not available');
  }

  // Get chain configuration
  const chain = CHAIN_CONFIG[chainId];
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  // Switch to selected chain
  await wallet.switchChain(chainId);
  
  const provider = await wallet.getEthereumProvider();
  if (!provider) {
    throw new Error('Ethereum provider not available');
  }

  // Create wallet client
  const walletClient = createWalletClient({
    chain,
    transport: custom(provider),
    account: wallet.address as `0x${string}`
  });

  // Create Nexus smart account
  const smartAccount = await toMultichainNexusAccount({
    chains: [chain],
    transports: [http()],
    signer: walletClient
  });

  // Create MEE client
  const meeClient = await createMeeClient({
    account: smartAccount
  });

  return { meeClient, smartAccount, walletClient };
};

export const executeGasAbstractedTransferEmbedded = async (
  biconomyClient: BiconomyEmbeddedClient,
  toAddress: `0x${string}`,
  amountInWei: bigint,
  tokenAddress: `0x${string}`,
  chainId: number
): Promise<any> => {
  // Get chain configuration
  const chain = CHAIN_CONFIG[chainId];
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  if (!biconomyClient.meeClient || !biconomyClient.smartAccount) {
    throw new Error('Biconomy client not properly initialized');
  }

  try {
    // Build transfer instruction
    const transferInstruction = await biconomyClient.smartAccount.buildComposable({
      type: 'default',
      data: {
        abi: erc20Abi,
        chainId: chain.id,
        to: tokenAddress,
        functionName: 'transfer',
        args: [toAddress, amountInWei],
      }
    });

    // Get fusion quote
    const fusionQuote = await biconomyClient.meeClient.getFusionQuote({
      instructions: [transferInstruction],
      trigger: {
        chainId: chain.id,
        tokenAddress,
        amount: amountInWei
      },
      feeToken: {
        address: tokenAddress,
        chainId: chain.id
      }
    });

    // Execute fusion quote
    const { hash } = await biconomyClient.meeClient.executeFusionQuote({ 
      fusionQuote 
    });

    // Wait for transaction completion
    await biconomyClient.meeClient.waitForSupertransactionReceipt({ hash });

    return hash;
  } catch (error) {
    console.error('Error executing gas-abstracted transfer:', error);
    throw error;
  }
};