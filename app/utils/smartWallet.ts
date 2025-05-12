import { ethers } from "ethers";
// @ts-ignore
import NedaPaySmartWalletFactoryABI from "../abi/NedaPaySmartWalletFactory.json";

const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS!;

export function getFactoryContract(signerOrProvider: ethers.Signer | ethers.providers.Provider) {
  return new ethers.Contract(factoryAddress, NedaPaySmartWalletFactoryABI, signerOrProvider);
}

// Create a smart wallet on-chain
type CreateWalletResult = {
  tx: ethers.ContractTransaction;
  receipt: ethers.ContractReceipt;
  walletAddress: string;
};

export async function createSmartWallet(owner: string, salt: number, signer: ethers.Signer): Promise<CreateWalletResult> {
  const factory = getFactoryContract(signer);
  const tx = await factory.createWallet(owner, salt);
  const receipt = await tx.wait();
  // Get the wallet address from the event
  const event = receipt.events?.find((e: any) => e.event === "WalletCreated");
  const walletAddress = event?.args?.wallet || "";
  return { tx, receipt, walletAddress };
}

// Get the deterministic smart wallet address from the factory
export async function getSmartWalletAddress(owner: string, salt: number, provider: ethers.providers.Provider): Promise<string> {
  const factory = getFactoryContract(provider);
  return await factory.getWalletAddress(owner, salt);
}
