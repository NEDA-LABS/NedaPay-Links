# NEDA Pay 
A comprehensive Stablecoins digital payment platform built with Next.js, React, ethers.js, wagmi, Privy, and Coinbase OnchainKit. NEDA Pay offers end-to-end payment solutions for both individuals and businesses, including stablecoin management, fiat offramping, and robust compliance features.

---

## Table of Contents
- [NEDA Pay](#neda-pay)
  - [Table of Contents](#table-of-contents)
  - [Key Features](#key-features)
    - [Digital Payment Solutions](#digital-payment-solutions)
    - [Merchant Features](#merchant-features)
    - [Compliance \& Security](#compliance--security)
    - [User Experience](#user-experience)
  - [Aerodrome Swaps](#aerodrome-swaps)
  - [Privy Authentication](#privy-authentication)
  - [Fiat Offramping](#fiat-offramping)
  - [Architecture](#architecture)

---

## Key Features

### Digital Payment Solutions
- **Stablecoin Management:**
  - Real-time balance tracking
  - Secure stablecoin transactions in Base Network
  - Integration with major stablecoins
  - Transaction history and analytics

- **Fiat Offramping:**
  - Direct USDC to fiat conversion
  - Multiple fiat currency support
  - Integrated payment processors
  - Gas abstraction for seamless transactions

### Merchant Features
- **Business Verification (KYB):**
  - Multi-step business verification process
  - Document upload and verification
  - Business information management
  - Ownership structure tracking
  - Corporate agreement acceptance

- **Payment Processing:**
  - Secure payment links
  - Invoice creation and management
  - Mobile withdrawal options
  - Transaction monitoring

### Compliance & Security
- **Individual KYC:**
  - Multi-factor identity verification
  - Document upload and validation
  - Personal information management
  - Financial background assessment

- **Business KYB:**
  - Comprehensive business verification
  - Document management system
  - Ownership structure tracking
  - Corporate compliance checks
  - Audit trail and monitoring

- **Security Features:**
  - Privy Authentication System:
    - Embedded and external wallet support
    - Social login integration
    - Persistent authentication
  - Data Encryption:
    - End-to-end encryption
    - Secure document storage
    - Compliance with data protection standards
  - Audit Trail:
    - Comprehensive activity logging
    - User action tracking
    - Compliance monitoring

### User Experience
- **Modern UI/UX:**
  - Responsive design
  - Intuitive navigation
  - Clear status indicators
  - Progress tracking

- **Workflow Management:**
  - Step-by-step verification process
  - Document upload interface
  - Status updates and notifications
  - Review and approval workflow

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