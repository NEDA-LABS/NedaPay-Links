# NEDA Pay 
dashboard for the NEDA Pay ecosystem. Built with Next.js, React, ethers.js, wagmi, Privy, and Coinbase OnchainKit, it allows merchants to view real-time balances, connect wallets, manage stablecoins in Base Network, and seamlessly offramp to fiat.

---

## Table of Contents
- [NEDA Pay](#neda-pay)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Aerodrome Swaps](#aerodrome-swaps)
  - [Privy Authentication](#privy-authentication)
  - [Fiat Offramping](#fiat-offramping)
  - [Architecture](#architecture)

---

## Features

- **Privy Authentication System:**
  - Seamless authentication with both embedded wallets and external wallets (EOAs).
  - Supports social login with Farcaster, email authentication, and traditional wallet connections.
  - Built-in wallet creation for users without existing wallets.
  - Persistent authentication state across sessions.

- **Fiat Offramping:**
  - Direct USDC to fiat conversion with integrated payment processors.
  - Support for multiple fiat currencies and payment methods.
  - Gas abstraction for embedded wallet users - no need to hold ETH for transaction fees.
  - Yet to do KYC integration for compliance requirements.

- **Aerodrome DEX Integration:**
  - Robust, direct integration with Aerodrome for on-chain swaps.
  - Supports both stable and volatile pools, with automatic pool selection.
  - Accurate quote fetching and swap execution, using the official Aerodrome router and factory addresses.
  - All token amounts and outputs are formatted with the correct decimals for each stablecoin.

- **Multi-Wallet Support:**
  - Connect with MetaMask, Coinbase Wallet, and others by wallet connect or use Privy's embedded wallets.
  - Persistent wallet connection state across all pages.
  - ENS (.eth) and Base Name (.base) resolution for user-friendly display.

- **Stablecoin Balances:**
  - Real-time fetching of ERC-20 balances for supported stablecoins (e.g., cNGN, ZARP, EURC, etc.).
  - Each stablecoin entry now includes an explicit `decimals` field for precise formatting and conversion.
  - Shows all stablecoins, but only fetches balances for tokens deployed on the connected network.

- **Network Detection:**
  - Detects the connected network and prompts users to switch if not on Base Mainnet.
  - Only fetches balances for tokens on the current chain (using `chainId`).

- **Error Handling:**
  - Per-token error icons and tooltips for contract call failures (e.g., missing `decimals()` function).
  - Suppresses uncaught contract errors in the browser console.

- **User Experience:**
  - Clean, modern UI with clear feedback for network and token issues.
  - Swap modal displays user-friendly quotes and output estimates, clamped to the correct number of decimals for each token.
  - Always displays all tokens, with '0' balance for those not on the current network.

---

## Aerodrome Swaps

- The dashboard integrates directly with the Aerodrome DEX for token swaps.
- Supports both stable and volatile pools, using the official Aerodrome router and factory.
- Swap modal fetches quotes and executes swaps with proper decimals for every supported stablecoin.
- Output estimates are always formatted for human readability, based on each token's decimals.

---

## Privy Authentication

NEDA Pay uses Privy for comprehensive authentication and wallet management:

- **Embedded Wallets:**
  - Users can create wallets directly within the application.
  - No need to download additional wallet extensions.
  - Secured by Privy's infrastructure with MPC (Multi-Party Computation).
  - Gas abstraction available - users don't need to hold ETH for transaction fees.

- **External Wallet Support:**
  - Full compatibility with existing EOAs (Externally Owned Accounts).
  - Supports MetaMask, Coinbase Wallet, WalletConnect, and other popular wallets.
  - Seamless switching between embedded and external wallets.

- **Authentication Methods:**
  - Social logins (Farcaster).
  - Email authentication.
  - Traditional wallet connection.

---

## Fiat Offramping

Comprehensive fiat offramping solution integrated directly into the merchant dashboard:

- **USDC to Fiat Conversion:**
  - Direct conversion from USDC to local fiat currencies.
  - Competitive exchange rates with real-time pricing.
  - Support for multiple fiat currencies based on merchant location.

- **Gas Abstraction:**
  - Embedded wallet users enjoy gasless transactions during offramping.
  - Transaction fees are automatically deducted from the conversion amount.
  - No need to maintain ETH balances for gas fees.

- **Compliance & KYC:**
  - In progress

---

## Architecture

- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Authentication:** Privy (embedded wallets + EOA support)
- **Wallets:** wagmi, ethers.js, Coinbase OnchainKit, viem
- **State Management:** React Context (GlobalWalletContext)
- **Stablecoin Data:** TypeScript config in `app/data/stablecoins.ts`


---