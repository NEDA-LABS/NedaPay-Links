import { createWalletClient, custom, http } from 'viem';
import { base } from 'viem/chains';
import { createMeeClient, toMultichainNexusAccount } from '@biconomy/abstractjs';
import { ethers } from 'ethers';

// Types
export type BiconomyClient = {
  meeClient: any; 
  authorization: any;
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

// Constants
const NEXUS_IMPLEMENTATION_ADDRESS = '0x000000004F43C49e93C970E84001853a70923B03';


export const initializeBiconomy = async (
  wallet: WalletType,
  signAuthorization: SignAuthorizationFunction
): Promise<BiconomyClient> => {
  if (!wallet?.address) {
    throw new Error('Wallet not connected or address not available');
  }

  // Ensure we're on Base chain
  await wallet.switchChain(base.id);
  console.log('Switched to Base chain successfully', wallet.switchChain(base.id))
  
  const provider = await wallet.getEthereumProvider();
  if (!provider) {
    throw new Error('Ethereum provider not available');
  }

  console.log('Provider configured successfully', provider)

  // Create Nexus account
  const nexusAccount = await toMultichainNexusAccount({
    chains: [base],
    transports: [http()],
    signer: await wallet.getEthereumProvider(),
    accountAddress: wallet.address,
  });

  // console.log('Nexus account created successfully', nexusAccount)

  // Sign authorization
  const authorization = await signAuthorization({
    contractAddress: NEXUS_IMPLEMENTATION_ADDRESS,
    chainId: base.id,
    nonce: 0,
    
  });

  // console.log('Authorization signed successfully', authorization)

  // Create MEE client
  const meeClient = await createMeeClient({
    account: nexusAccount,
  });

  // console.log('Biconomy client initialized successfully', meeClient)
  return { meeClient, authorization };
};


export const executeGasAbstractedTransfer = async (
  biconomyClient: BiconomyClient,
  toAddress: `0x${string}`,
  amountInWei: bigint,
  tokenAddress: `0x${string}`,
  tokenAbi: string[]
): Promise<any> => {
  console.log('Starting gas-abstracted transfer with parameters:', {
    toAddress,
    amountInWei: amountInWei.toString(),
    tokenAddress
  });

  // Validate inputs
  if (!biconomyClient.meeClient || !biconomyClient.authorization) {
    throw new Error('Biconomy client not properly initialized');
  }

  if (!ethers.utils.isAddress(toAddress)) {
    throw new Error('Invalid recipient address');
  }

  // console.log('Creating token transfer data for:', {
  //   toAddress,
  //   amountInWei: amountInWei.toString(),
  //   tokenAddress
  // });
  const tokenInterface = new ethers.utils.Interface(tokenAbi);
  const transferData = tokenInterface.encodeFunctionData('transfer', [toAddress, amountInWei]);
  // console.log('Transfer data created:', transferData);

  // console.log('Executing transaction with authorization:', {
  //   hasAuthorization: !!biconomyClient.authorization,
  //   feeToken: tokenAddress
  // });
  const { hash } = await biconomyClient.meeClient.execute({
    authorization: biconomyClient.authorization,
    delegate: true,
    feeToken: {
      address: tokenAddress,
      chainId: base.id,
    },
    instructions: [{
      chainId: base.id,
      calls: [{
        to: tokenAddress,
        value: 0n,
        data: transferData,
      }],
    }],
  });
  // console.log('Transaction hash:', hash);

  // console.log('Waiting for transaction receipt for hash:', hash);
  const receipt = await biconomyClient.meeClient.waitForSupertransactionReceipt({ hash });
  // console.log('Transaction receipt received:', {
  //   status: receipt.status,
  //   transactionHash: receipt.transactionHash,
  //   blockNumber: receipt.blockNumber
  // });

  // console.log('Transaction completed successfully with receipt:', {
  //   status: receipt.status,
  //   transactionHash: receipt.transactionHash
  // });
  return receipt;
};