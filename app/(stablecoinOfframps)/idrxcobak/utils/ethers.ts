"use client";
import { ethers } from "ethers";
import { WalletWithMetadata, ConnectedWallet } from "@privy-io/react-auth";


export async function getSignerFromWallet(wallet: ConnectedWallet) {
// Works for both embedded and external wallets
// @ts-ignore
const provider = new ethers.providers.Web3Provider(
    await wallet.getEthereumProvider()
  );
const signer = provider.getSigner();
return { provider, signer };
}