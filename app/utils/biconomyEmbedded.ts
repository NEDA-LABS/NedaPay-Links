import { createWalletClient, custom, http, erc20Abi, encodeFunctionData, type Hex, type Chain } from 'viem';
import { 
  base,
  arbitrum,
  polygon,
  celo,
  bsc,
  mainnet,
  optimism,
  avalanche
} from 'viem/chains';
import { 
  createMeeClient, 
  toMultichainNexusAccount,
  getMeeScanLink,
  getMEEVersion,
  MEEVersion,
  type MeeClient,
  type MultichainSmartAccount 
} from '@biconomy/abstractjs';
import { ethers } from 'ethers';

// Types
export type BiconomyEmbeddedClient = {
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

// Chain configuration map using viem chain imports
const CHAIN_CONFIG: Record<number, Chain> = {
  [mainnet.id]: mainnet,
  [base.id]: base,
  [arbitrum.id]: arbitrum,
  [polygon.id]: polygon,
  [celo.id]: celo,
  [bsc.id]: bsc,
  [optimism.id]: optimism,
  [avalanche.id]: avalanche,
};

export const initializeBiconomyEmbedded = async (
  wallet: WalletType,
  signAuthorization: any, // EIP-7702 authorization - required for embedded wallets
  chainId: number
): Promise<BiconomyEmbeddedClient> => {
  if (!wallet?.address) {
    console.log("Wallet not connected or address not available");
    throw new Error('Wallet not connected or address not available');
  }



  if (!signAuthorization) {
    console.log("Authorization is required for embedded wallet gas abstraction (EIP-7702)");
    throw new Error('Authorization is required for embedded wallet gas abstraction (EIP-7702)');
  }

  console.log("chain number", chainId);

  // Get chain configuration from viem chains
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
        chain: chain,
        transport: custom(provider),
        version: getMEEVersion(MEEVersion.V2_1_0)
      }
    ],
    signer: await wallet.getEthereumProvider(),
    accountAddress: wallet.address as `0x${string}`,
  });

  console.log("smartAccount", smartAccount);

  // Create MEE client
  const meeClient = await createMeeClient({
    account: smartAccount
  });
  console.log("meeClient", meeClient);

  return { meeClient, smartAccount, authorization };
};

export const executeGasAbstractedTransferEmbedded = async (
  biconomyClient: BiconomyEmbeddedClient,
  toAddress: `0x${string}`,
  amountInWei: bigint,
  tokenAddress: `0x${string}`,
  executionChainId: number, // Chain where the transaction executes
  feeTokenChainId: number = executionChainId, // Chain where gas is paid (can be different for multichain)
  feeTokenAddress: `0x${string}` = tokenAddress // Token used to pay gas (can be different)
): Promise<any> => {
  // Get chain configurations from viem chains
  const executionChain = CHAIN_CONFIG[executionChainId];
  const feeChain = CHAIN_CONFIG[feeTokenChainId];
  
  if (!executionChain) {
    throw new Error(`Unsupported execution chain ID: ${executionChainId}. Supported chains: ${Object.keys(CHAIN_CONFIG).join(', ')}`);
  }
  
  if (!feeChain) {
    throw new Error(`Unsupported fee token chain ID: ${feeTokenChainId}. Supported chains: ${Object.keys(CHAIN_CONFIG).join(', ')}`);
  }

  if (!biconomyClient.meeClient || !biconomyClient.smartAccount || !biconomyClient.authorization) {
    throw new Error('Biconomy client not properly initialized or missing authorization');
  }

  try {
    // Build transfer instruction for multichain
    const transferInstruction = {
      calls: [{
        to: tokenAddress,
        value: 0n,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'transfer',
          args: [toAddress, amountInWei]
        })
      }],
      chainId: executionChain.id
    };

    // Get quote (NOT fusion quote for embedded wallets)
    const quote = await biconomyClient.meeClient.getQuote({
      instructions: [transferInstruction],
      // CRITICAL: delegate must be true for embedded wallets (EIP-7702)
      delegate: true,
      // CRITICAL: authorization is required for embedded wallets
      authorization: biconomyClient.authorization,
      feeToken: {
        address: feeTokenAddress,
        chainId: feeTokenChainId // Can pay gas on different chain
      },
    });

    // Execute the quote (NOT fusion quote)
    const { hash } = await biconomyClient.meeClient.executeQuote({ 
      quote 
    });

    // Wait for transaction completion
    await biconomyClient.meeClient.waitForSupertransactionReceipt({ hash });

    return hash;
  } catch (error) {
    console.error('Error executing gas-abstracted transfer:', error);
    throw error;
  }
};

// Helper function to get supported chain IDs
export const getSupportedChainIds = (): number[] => {
  return Object.keys(CHAIN_CONFIG).map(Number);
};

// Helper function to get chain by ID
export const getChainById = (chainId: number): Chain | undefined => {
  return CHAIN_CONFIG[chainId];
};

// Helper function to check if chain is supported
export const isChainSupported = (chainId: number): boolean => {
  return chainId in CHAIN_CONFIG;
};