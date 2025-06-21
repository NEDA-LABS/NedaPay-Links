import { createBicoBundlerClient, createBicoPaymasterClient, toNexusAccount } from "@biconomy/abstractjs";
import { base } from "viem/chains";
import { http, parseEther } from "viem";
import { createWalletClient, custom } from 'viem';
import { privateKeyToAccount } from "viem/accounts";

// Biconomy configuration
const BUNDLER_URL = process.env.BICONOMY_BUNDLER_URL!;
const PAYMASTER_URL = process.env.BICONOMY_PAYMASTER_URL!;

// Initialize Biconomy Nexus client
export async function initBiconomyClient(wallet: any) {
  if (!wallet) {
    throw new Error('No wallet provided');
  }

  try {
    // Get the Ethereum provider from Privy wallet
    const provider = await wallet.getEthereumProvider();
    
    // Create a viem wallet client from the provider
    const walletClient = createWalletClient({
      account: wallet.address as `0x${string}`,
      chain: base,
      transport: custom(provider)
    });
    
    const nexusClient = await createBicoBundlerClient({
      account: await toNexusAccount({
        signer: walletClient,
        chain: base,
        transport: http('https://mainnet.base.org'),
      }),
      transport: http("https://bundler.biconomy.io/api/v3/8453/bundler_3Zd5UiobiThrL2wFnwNw9ZgN"),
      paymaster: createBicoPaymasterClient({ paymasterUrl: "https://paymaster.biconomy.io/api/v1/8453/DmE8Uzv_2.fa526c1b-0bde-48bd-b0a9-888a060ff57a" })
    });
    
    return nexusClient;
  } catch (error) {
    console.error('Error creating wallet client:', error);
    throw error;
  }
}

// Send gasless USDC transfer
export async function sendGaslessUsdcTransfer(
  nexusClient: any,
  toAddress: string,
  amount: string,
  usdcAddress: string = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
) {
  const call = {
    to: usdcAddress,
    // For USDC transfer, encode the function data for transfer(address, uint256)
    data: `0xa9059cbb${toAddress.slice(2).padStart(64, '0')}${parseEther(amount).toString(16).padStart(64, '0')}`,
    value: parseEther('0'),
  };

  const hash = await nexusClient.sendUserOperation({ calls: [call] });
  console.log("Gasless Transaction hash: ", hash);
  
  const receipt = await nexusClient.waitForUserOperationReceipt({ hash });
  return { hash, receipt };
}