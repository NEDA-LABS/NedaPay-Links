// 'use client';

// import React, { useState } from 'react';
// import { usePrivy, useWallets } from '@privy-io/react-auth';
// import Header from '@/components/Header';
// import Footer from '@/components/Footer';
// import ChainSelector from './ChainSelector';
// import OffRampForm from './OffRampForm';
// import { WalletType } from '../utils/biconomyExternal';
// import { SUPPORTED_CHAINS, DEFAULT_CHAIN, ChainConfig, ChainId } from './offrampHooks/constants';
// import { withDashboardLayout } from '@/utils/withDashboardLayout';

// type SupportedToken = 'USDC' | 'USDT';

// const OffRampPage: React.FC = () => {
//   const { authenticated, login, connectWallet } = usePrivy();
//   const { wallets } = useWallets();
//   const activeWallet = wallets[0] as WalletType | undefined;
  
//   const [selectedChain, setSelectedChain] = useState<ChainConfig | null>(null);
//   const [selectedToken, setSelectedToken] = useState<SupportedToken>(() => {
//     const defaultToken = DEFAULT_CHAIN.tokens[0] as SupportedToken;
//     return defaultToken;
//   });
//   const [isAccountVerified, setIsAccountVerified] = useState(false);

//   const handleChainSelect = (chain: ChainConfig, token: string) => {
//     // Ensure the token is valid for this chain
//     if (chain.tokens.includes(token)) {
//       setSelectedChain(chain);
//       setSelectedToken(token as SupportedToken);
//     } else {
//       // Fallback to first available token
//       const defaultToken = chain.tokens[0] as SupportedToken;
//       setSelectedChain(chain);
//       setSelectedToken(defaultToken);
//     }
//   };

//   const handleBack = () => {
//     setSelectedChain(null);
//     // Reset to default token when going back
//     const defaultToken = DEFAULT_CHAIN.tokens[0] as SupportedToken;
//     setSelectedToken(defaultToken);
//   };

//   return (
//     <div className="min-h-screen">
//       <div className="overflow-y-auto">
//         <Header />
        
//         <div className="container mx-auto xl:w-[50%] max-w-6xl px-1 pt-6">
//           <div className="text-center mb-8 relative">
//             <div className="absolute inset-0 bg-gradient-to-r from-purple-200/30 to-blue-200/30 blur-3xl rounded-4xl"></div>
//             {/* <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-xs font-medium animate-pulse mb-4 border border-purple-200">
//               Stablecoins to Fiat Offramp
//             </div> */}
//             <h1 className="text-xl font-semibold text-gray-900 mb-2">
//               <span className="block bg-gradient-to-r from-purple-100 to-blue-100 bg-clip-text text-transparent">
//                 Convert stablecoins to Cash
//               </span>
//             </h1>
//           </div>

//           {!authenticated ? (
//             <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 backdrop-blur-sm">
//               <div className="flex items-center gap-3">
//                 <div className="p-2 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
//                   <svg
//                     className="w-4 h-4 text-amber-600"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
//                     />
//                   </svg>
//                 </div>
//                 <div className="flex-1">
//                   <h3 className="font-medium text-amber-900 text-sm">
//                     Authentication Required
//                   </h3>
//                   <p className="text-amber-700 text-xs mt-1">
//                     Please login to access the offramp service
//                   </p>
//                 </div>
//                 <button
//                   onClick={login}
//                   className="px-4 py-2 !bg-gradient-to-r !from-purple-600 !to-blue-600 hover:!from-purple-700 hover:!to-blue-700 !text-white !font-medium !rounded-xl !shadow-lg hover:!shadow-xl !transition-all !duration-300 text-base transform hover:-translate-y-0.5"
//                 >
//                   Login with Privy
//                 </button>
//               </div>
//             </div>
//           ) : !activeWallet ? (
//             <div className="mb-6 p-4 rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 backdrop-blur-sm">
//               <div className="flex items-center gap-3">
//                 <div className="p-2 rounded-xl bg-gradient-to-br from-orange-100 to-red-100">
//                   <svg
//                     className="w-4 h-4 text-orange-600"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.4 16c-.77 1.333.192 3 1.732 3z"
//                     />
//                   </svg>
//                 </div>
//                 <div className="flex-1">
//                   <h3 className="font-medium text-orange-900 text-sm">
//                     Wallet Connection Required
//                   </h3>
//                   <p className="text-orange-700 text-xs mt-1">
//                     Please connect a wallet to proceed with the offramp
//                   </p>
//                 </div>
//                 <button
//                   onClick={connectWallet}
//                   className="px-4 py-2 !bg-gradient-to-r !from-emerald-600 !to-green-600 hover:!from-emerald-700 hover:!to-green-700 !text-white !font-medium !rounded-xl !shadow-lg hover:!shadow-xl !transition-all !duration-300 text-base transform hover:-translate-y-0.5"
//                 >
//                   Connect Wallet
//                 </button>
//               </div>
//             </div>
//           ) : !selectedChain ? (
//             <ChainSelector
//               chains={SUPPORTED_CHAINS}
//               onSelectChain={handleChainSelect}
//               userAddress={activeWallet?.address || ''}
//             />
//           ) : (
//             <OffRampForm
//               chain={selectedChain}
//               token={selectedToken}
//               onTokenChange={(token) => {
//                 setSelectedToken(token as SupportedToken);
//               }}
//               onBack={handleBack}
//               isAccountVerified={isAccountVerified}
//               setIsAccountVerified={setIsAccountVerified}
//             />
//           )}
//         </div>
        
//         {/* <Footer /> */}
//       </div>
//     </div>
//   );
// };

// export default withDashboardLayout(OffRampPage);