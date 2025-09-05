import {
    createMeeClient, 
  toMultichainNexusAccount,
  getMeeScanLink,
  getMEEVersion,
  MEEVersion,
  type MeeClient,
  type MultichainSmartAccount,
    mcUSDC, // multichain helper for USDC addresses
  } from "@biconomy/abstractjs";
  import { base, scroll } from "viem/chains";
  import { privateKeyToAccount } from "viem/accounts";
  import { Address, createWalletClient, custom, http, erc20Abi, encodeFunctionData, type Hex, type Chain } from "viem";
  
  
 
    export type ScrollToBaseClient = {
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
      [base.id]: base,
      [scroll.id]: scroll,
    };
    
    export const initializeScrollToBase = async (
      wallet: WalletType,
      signAuthorization: any, // EIP-7702 authorization - required for embedded wallets
      chainId: number
    ): Promise<ScrollToBaseClient> => {
      if (!wallet?.address) {
        console.log("Wallet not connected or address not available");
        throw new Error('Wallet not connected or address not available');
      }

      if (!signAuthorization) {
        console.log("Authorization is required for embedded wallet gas abstraction (EIP-7702)");
        throw new Error('Authorization is required for embedded wallet gas abstraction (EIP-7702)');
      }

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
              chain: scroll,
              transport: custom(provider),
              version: getMEEVersion(MEEVersion.V2_1_0)
            },
            {
              chain: base,
              transport: custom(provider),
              version: getMEEVersion(MEEVersion.V2_1_0)
            },
          ],
      signer: await wallet.getEthereumProvider(),
      accountAddress: wallet.address as `0x${string}`,
    });
  
    // 2) Create a MEE client bound to that multichain account
    const meeClient = createMeeClient({ account: smartAccount });

    console.log("meeClient", meeClient); //debugg

    return { meeClient, smartAccount, authorization };
}
  
    // 3) Build a cross-chain “pay on Scroll, receive on Base” plan
    //
    // The idea:
    // - Step A (Scroll): pull USDC from payer & invoke a bridge adapter toward Base
    // - Step B (Base): deliver USDC to recipient address on Base
    //
    // `bridgeAdapterCalldata` is a placeholder. In practice:
    //   • If you use LiFi: build calldata to LiFi's executor/diamond router
    //   • If you use CCTP: call Circle’s tokenMessenger on Scroll, then mint on Base
    //   • If you use Across/Orbiter/etc.: encode their router call
    //
    // You can also express bridging as a higher-level MEE action if you have it wired.
    const bridgeAdapterAddressOnScroll: Address = "0xBridgeAdapterOnScroll";
    const bridgeAdapterCalldata = "0xYourEncodedBridgeCallData"; // encode your route (USDC Scroll -> USDC Base)
  
    const quote = await meeClient.getQuote({
      instructions: [
        // STEP A: on SCROLL — approve + bridge
        {
          chainId: scroll.id,
          calls: [
            // (i) ensure the bridge can pull the USDC (approve)
            {
              to: mcUSDC.addressOn(scroll.id),
              data: encodeERC20Approve(
                bridgeAdapterAddressOnScroll,
                amountUSDC
              ),
              value: 0n,
            },
            // (ii) call the bridge adapter to move USDC Scroll -> USDC Base
            {
              to: bridgeAdapterAddressOnScroll,
              data: bridgeAdapterCalldata,
              value: 0n,
            },
          ],
        },
  
        // STEP B: on BASE — transfer the received USDC to recipient
        // (Some bridges let you specify the final recipient in Step A;
        //  if so, you can skip this extra transfer and send directly.)
        {
          chainId: base.id,
          calls: [
            {
              to: mcUSDC.addressOn(base.id),
              data: encodeERC20Transfer(recipientOnBase, amountUSDC),
              value: 0n,
            },
          ],
        },
      ],
  
      // Optional: pay fees in USDC on Base (or on Scroll) if your paymaster supports it.
      // Otherwise omit `feeToken` and pay native gas as usual.
      feeToken: {
        address: mcUSDC.addressOn(base.id),
        chainId: base.id,
      },
    });
  
    // 4) Execute the plan with a single user signature
    const { hash } = await mee.executeQuote({ quote });
    console.log("MEE super-transaction hash:", hash);
  
  
  // --- Minimal ERC20 helpers (ABI-encoding) ---
  function encodeERC20Approve(spender: Address, amount: bigint): `0x${string}` {
    // keccak256("approve(address,uint256)") -> 0x095ea7b3
    return encodeFunction("0x095ea7b3", [pad32(spender), pad32(amount)]);
  }
  function encodeERC20Transfer(to: Address, amount: bigint): `0x${string}` {
    // keccak256("transfer(address,uint256)") -> 0xa9059cbb
    return encodeFunction("0xa9059cbb", [pad32(to), pad32(amount)]);
  }
  function encodeFunction(selector: string, args: string[]): `0x${string}` {
    return (selector + args.map(a => a.slice(2)).join("")) as `0x${string}`;
  }
  function pad32(x: Address | bigint): string {
    const hex = typeof x === "bigint" ? `0x${x.toString(16)}` : x;
    return "0x" + hex.slice(2).padStart(64, "0");
  }

  