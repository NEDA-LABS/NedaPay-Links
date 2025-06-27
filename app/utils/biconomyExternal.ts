import { createWalletClient, custom, http, erc20Abi, type Hex } from 'viem';
import { base } from 'viem/chains';
import { 
  createMeeClient, 
  toMultichainNexusAccount,
  getMeeScanLink,
  type MeeClient,
  type MultichainSmartAccount 
} from '@biconomy/abstractjs';

// Types
export type BiconomyClient = {
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

// Updated initialization for external wallets
export const initializeBiconomy = async (
  wallet: WalletType
): Promise<BiconomyClient> => {
  if (!wallet?.address) {
    throw new Error('Wallet not connected or address not available');
  }

  // Ensure we're on Base chain (updated from Base mainnet)
  await wallet.switchChain(base.id);
  console.log('Switched to Base chain successfully');
  
  const provider = await wallet.getEthereumProvider();
  if (!provider) {
    throw new Error('Ethereum provider not available');
  }

  // Create wallet client for external wallet
  const walletClient = createWalletClient({
    chain: base,
    transport: custom(provider),
    account: wallet.address
  });

  // Create Nexus smart account for external wallet
  const smartAccount = await toMultichainNexusAccount({
    chains: [base],
    transports: [http()],
    signer: walletClient
  });

  console.log('Nexus smart account created successfully');

  // Create MEE client
  const meeClient = await createMeeClient({
    account: smartAccount
  });

  console.log('Biconomy MEE client initialized successfully');
  return { meeClient, smartAccount, walletClient };
};

// Updated transfer function using Fusion Quote API
export const executeGasAbstractedTransfer = async (
  biconomyClient: BiconomyClient,
  toAddress: `0x${string}`,
  amountInWei: bigint,
  tokenAddress: `0x${string}`
): Promise<any> => {
  console.log('Starting gas-abstracted transfer with Fusion Quote:', {
    toAddress,
    amountInWei: amountInWei.toString(),
    tokenAddress
  });

  // Validate inputs
  if (!biconomyClient.meeClient || !biconomyClient.smartAccount) {
    throw new Error('Biconomy client not properly initialized');
  }

  try {
    // Build the transfer instruction using the smart account
    const transferInstruction = await biconomyClient.smartAccount.buildComposable({
      type: 'default',
      data: {
        abi: erc20Abi,
        chainId: base.id,
        to: tokenAddress,
        functionName: 'transfer',
        args: [toAddress as Hex, amountInWei]
      }
    });

    console.log('Transfer instruction built successfully');

    // Get fusion quote
    const fusionQuote = await biconomyClient.meeClient.getFusionQuote({
      instructions: [transferInstruction],
      trigger: {
        chainId: base.id,
        tokenAddress: tokenAddress,
        amount: amountInWei
      },
      feeToken: {
        address: tokenAddress,
        chainId: base.id
      }
    });

    console.log('Fusion quote received');

    // Execute the fusion quote
    const { hash } = await biconomyClient.meeClient.executeFusionQuote({ 
      fusionQuote 
    });

    console.log('Transaction hash:', hash);

    // Get MEE scan link
    const meeScanLink = getMeeScanLink(hash);
    console.log('MEE Scan link:', meeScanLink);

    // Wait for transaction completion
    const receipt = await biconomyClient.meeClient.waitForSupertransactionReceipt({ 
      hash 
    });

    console.log('Transaction completed successfully:', {
      status: receipt.transactionStatus,
      hash: receipt.hash
    });

    return {
      receipt,
      hash,
      meeScanLink
    };

  } catch (error) {
    console.error('Error executing gas-abstracted transfer:', error);
    throw error;
  }
};

// Batch transfer function for multiple recipients
export const executeBatchGasAbstractedTransfer = async (
  biconomyClient: BiconomyClient,
  transfers: Array<{
    toAddress: `0x${string}`;
    amountInWei: bigint;
  }>,
  tokenAddress: `0x${string}`
): Promise<any> => {
  console.log('Starting batch gas-abstracted transfer:', {
    transferCount: transfers.length,
    tokenAddress
  });

  if (!biconomyClient.meeClient || !biconomyClient.smartAccount) {
    throw new Error('Biconomy client not properly initialized');
  }

  try {
    // Build transfer instructions for each recipient
    const transferInstructions = await Promise.all(
      transfers.map(({ toAddress, amountInWei }) =>
        biconomyClient.smartAccount.buildComposable({
          type: 'default',
          data: {
            abi: erc20Abi,
            chainId: base.id,
            to: tokenAddress,
            functionName: 'transfer',
            args: [toAddress as Hex, amountInWei]
          }
        })
      )
    );

    console.log('Batch transfer instructions built successfully');

    // Calculate total amount
    const totalAmount = transfers.reduce((sum, transfer) => sum + transfer.amountInWei, 0n);

    // Get fusion quote for batch
    const fusionQuote = await biconomyClient.meeClient.getFusionQuote({
      instructions: transferInstructions,
      trigger: {
        chainId: base.id,
        tokenAddress: tokenAddress,
        amount: totalAmount
      },
      feeToken: {
        address: tokenAddress,
        chainId: base.id
      }
    });

    console.log('Batch fusion quote received');

    // Execute the fusion quote
    const { hash } = await biconomyClient.meeClient.executeFusionQuote({ 
      fusionQuote 
    });

    console.log('Batch transaction hash:', hash);

    // Get MEE scan link
    const meeScanLink = getMeeScanLink(hash);
    console.log('MEE Scan link:', meeScanLink);

    // Wait for transaction completion
    const receipt = await biconomyClient.meeClient.waitForSupertransactionReceipt({ 
      hash 
    });

    console.log('Batch transaction completed successfully:', {
      status: receipt.transactionStatus,
      hash: receipt.hash
    });

    return {
      receipt,
      hash,
      meeScanLink
    };

  } catch (error) {
    console.error('Error executing batch gas-abstracted transfer:', error);
    throw error;
  }
};

// Helper function to get MEE scan link
export const getMeeScanLinkFromHash = (hash: string): string => {
  return getMeeScanLink(hash as `0x${string}`);
};