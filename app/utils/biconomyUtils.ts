import { createBicoBundlerClient, createBicoPaymasterClient, toNexusAccount } from "@biconomy/abstractjs";
import { base } from "viem/chains";
import { http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Biconomy configuration
const BUNDLER_URL = process.env.BICONOMY_BUNDLER_URL!;
const PAYMASTER_URL = process.env.BICONOMY_PAYMASTER_URL!;

// Initialize Biconomy Nexus client
export async function initBiconomyClient(signerPrivateKey: `0x${string}`) {
  const privateKey = signerPrivateKey;
  const account = privateKeyToAccount(privateKey);

  const nexusClient = await createBicoBundlerClient({
    account: await toNexusAccount({
      signer: account,
      chain: base,
      transport: http(),
    }),
    transport: http(BUNDLER_URL),
    paymaster: createBicoPaymasterClient({ paymasterUrl: PAYMASTER_URL })
  });

  return nexusClient;
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