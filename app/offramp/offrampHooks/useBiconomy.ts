// import { useEffect, useState } from 'react';
// import { ChainConfig } from './constants';
// import { 
//   initializeBiconomyEmbedded
// } from '@/utils/biconomyEmbedded';
// import { 
//   initializeBiconomyExternal
// } from '@/utils/biconomyExternal';

// export const useBiconomy = (chain: ChainConfig, token: string) => {
//   const [biconomyClient, setBiconomyClient] = useState(null);
//   const [gasAbstractionActive, setGasAbstractionActive] = useState(false);
//   const [feeInfo, setFeeInfo] = useState({ fee: 0, currency: '' });

//   useEffect(() => {
//     const initBiconomy = async () => {
//       try {
//         const client = isEmbeddedWallet ? 
//           await initializeBiconomyEmbedded(chain.id) : 
//           await initializeBiconomyExternal(chain.id);
          
//         setBiconomyClient(client);
//         setGasAbstractionActive(true);
//         setFeeInfo({
//           fee: GAS_FEES.ABSTRACTED[token],
//           currency: token
//         });
//       } catch (err) {
//         setGasAbstractionActive(false);
//         setFeeInfo({
//           fee: GAS_FEES.NORMAL[chain.name.toUpperCase()],
//           currency: chain.nativeCurrency.symbol
//         });
//       }
//     };

//     initBiconomy();
//   }, [chain, token]);

//   return { biconomyClient, gasAbstractionActive, feeInfo };
// };