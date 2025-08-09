"use client";

import { base, polygon, arbitrum, celo, scroll, bsc } from "wagmi/chains";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { http, fallback } from "wagmi";
import { createConfig as createPrivyConfig } from "@privy-io/wagmi";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { SidebarProvider } from "@/compliance/user/components/ui/sidebar";

// Create a query client for React Query
const queryClient = new QueryClient();

// Configure wagmi with all supported wallet connectors
const wagmiConfig = createPrivyConfig({
  chains: [base, polygon, bsc, arbitrum, celo, scroll],
  ssr: true,
  transports: {
    [base.id]: fallback([
      http(process.env.NEXT_PUBLIC_COINBASE_BASE_RPC || 'https://api.developer.coinbase.com/rpc/v1/base/n4RnEAzBQtErAI53dP6DCa6l6HRGODgV'),
      http('https://mainnet.base.org'),
      http('https://base-mainnet.g.alchemy.com/v2/demo'),
      http('https://base.llamarpc.com'),
      http('https://1rpc.io/base')
    ]),
    [polygon.id]: fallback([
      http(process.env.NEXT_PUBLIC_POLYGON_RPC || 'https://polygon-mainnet.g.alchemy.com/v2/demo'),
      http('https://polygon-rpc.com'),
      http('https://rpc-mainnet.matic.network'),
      http('https://polygon.llamarpc.com'),
      http('https://1rpc.io/matic')
    ]),
    [bsc.id]: fallback([
      http(process.env.NEXT_PUBLIC_BSC_RPC || 'https://bsc-dataseed1.bnbchain.org'),
      http('https://bscrpc.com'),
      http('https://bsc-mainnet.public.blastapi.io'),
      http('https://1rpc.io/bnb'),
      http('https://binance.llamarpc.com')
    ]),
    [arbitrum.id]: fallback([
      http(process.env.NEXT_PUBLIC_ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc'),
      http('https://arbitrum-mainnet.infura.io/v3/demo'),
      http('https://arbitrum.public-rpc.com'),
      http('https://1rpc.io/arb'),
      http('https://arbitrum.llamarpc.com')
    ]),
    [celo.id]: fallback([
      http(process.env.NEXT_PUBLIC_CELO_RPC || 'https://forno.celo.org'),
      http('https://celo-mainnet.infura.io/v3/demo'),
      http('https://rpc.ankr.com/celo'),
      http('https://1rpc.io/celo'),
      http('https://celo.llamarpc.com')
    ]),
    [scroll.id]: fallback([
      http(process.env.NEXT_PUBLIC_SCROLL_RPC || 'https://rpc.scroll.io'),
      http('https://scroll-mainnet.public.blastapi.io'),
      http('https://1rpc.io/scroll'),
      http('https://scroll.llamarpc.com')
    ])
  }
});


export function Providers(props: { children: ReactNode }) {
  return (
    <SidebarProvider>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
        config={{
          appearance: {
            walletList: ['metamask', 'coinbase_wallet', 'wallet_connect', 'binance', 'bybit_wallet', 'okx_wallet'],
            walletChainType: 'ethereum-only'},
          embeddedWallets: {
            ethereum: {
              createOnLogin: "users-without-wallets",
            },
          },
          supportedChains: [base, bsc, arbitrum, polygon, celo, scroll]
        }}
      >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={wagmiConfig}>{props.children}</WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </ThemeProvider>
    </SidebarProvider>
  );
}
