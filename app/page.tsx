// "use client";
// export const dynamic = "force-dynamic";

// import React from "react";
// import { useSearchParams } from "next/navigation";
// import { useEffect, useState, useCallback, useMemo } from "react";
// import { ChainSelector, TokenSelector, AmountInput } from './components/PaymentSelectors';
// import dynamicImport from "next/dynamic";
// import { utils } from "ethers";
// import { useAccount } from "wagmi";
// import {
//   ChevronDown,
//   ClipboardCopy,
//   CheckCircle,
//   QrCode,
//   Wallet,
//   Download,
//   LogIn,
//   Shield,
//   Lock,
//   Zap,
//   ArrowRight,
//   ArrowLeft,
//   Info,
//   CheckCircle2,
//   AlertCircle,
//   Loader2,
// } from "lucide-react";
// import QRCode from "qrcode";
// import { SUPPORTED_CHAINS, SUPPORTED_CHAINS_NORMAL } from "../../../ramps/payramp/offrampHooks/constants";
// import { stablecoins } from "../../../data/stablecoins";
// import {
//   mainnet,
//   base,
//   polygon,
//   arbitrum,
//   celo,
//   scroll,
//   bsc,
// } from "viem/chains";
// import Header from "@/components/Header";
// import { usePrivy, useWallets } from "@privy-io/react-auth";
// import Image from "next/image";
// import { resolveName } from "@/utils/ensUtils";
// import { isAddress } from "viem";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Progress } from "@/components/ui/progress";
// import { Skeleton } from "@/components/ui/skeleton";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { motion, AnimatePresence } from "framer-motion";
// import { cn } from "@/lib/utils";

// // const PaymentQRCode = dynamicImport(() => import("./QRCode"), { ssr: false });
// const PayWithWallet = dynamicImport(() => import("./PayWithWallet"), {
//   ssr: false,
// });
// const OffRampPayment = dynamicImport(() => import("./OfframpPayment"), {
//   ssr: false,
// });

// // Supported chains for normal payments
// const NORMAL_PAYMENT_CHAINS = [
//   mainnet,
//   base,
//   polygon,
//   arbitrum,
//   celo,
//   scroll,
//   bsc,
// ];

// export default function PayPage({ params }: { params: { id: string } }) {
//   const searchParams = useSearchParams();
//   const { authenticated, login, ready } = usePrivy();
//   const [copied, setCopied] = useState(false);
//   const [isValidLink, setIsValidLink] = useState(true);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [isLoading, setIsLoading] = useState(true);
//   const [currentStep, setCurrentStep] = useState<"details" | "payment">("details");
//   const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
//   const [toEnsName, setToEnsName] = useState<string | null>(null);
  
//   const amountParam = searchParams.get("amount");
//   const amount = amountParam === "0" ? null : amountParam;
//   const currency = searchParams.get("currency");
//   const description = searchParams.get("description");
//   const to = searchParams.get("to");
//   const signature = searchParams.get("sig");
//   const offRampType = searchParams.get("offRampType");
//   const offRampValue = searchParams.get("offRampValue");
//   const offRampProvider = searchParams.get("offRampProvider");
//   const accountName = searchParams.get("accountName");

//   const chainIdParam = searchParams.get("chainId");
//   const chainId = chainIdParam ? parseInt(chainIdParam) : null;
//   const tokenParam = searchParams.get("token");

//   // Get the selected chain for the DetailsView
//   const selectedChainForDetails = chainId?.toString() || "8453";

//   // Determine link type
//   const linkType = offRampType ? "offramp" : "normal";

//   // Find the resolved chain for the DetailsView
//   const resolvedChain = NORMAL_PAYMENT_CHAINS.find(
//     (chain) => chain.id === parseInt(selectedChainForDetails)
//   );

//   // Generate QR code data
//   useEffect(() => {
//     const generateQRCode = async () => {
//       try {
//         const currentUrl = window.location.href;
//         const qrData = await QRCode.toDataURL(currentUrl, {
//           width: 200,
//           margin: 2,
//         });
//         setQrDataUrl(qrData);
//       } catch (error) {
//         console.error("Error generating QR code:", error);
//       }
//     };

//     generateQRCode();
//   }, []);

//   // Validate link on mount
//   useEffect(() => {
//     const validateLink = () => {
//       if (!signature) {
//         setIsValidLink(false);
//         setErrorMessage("Invalid payment link - missing signature");
//         return;
//       }

//       if (linkType === "offramp" && (!offRampType || !offRampValue)) {
//         setIsValidLink(false);
//         setErrorMessage("Invalid offramp link - missing required parameters");
//         return;
//       }

//       if (linkType === "normal" && !to) {
//         setIsValidLink(false);
//         setErrorMessage("Invalid payment link - missing recipient address");
//         return;
//       }

//       setIsValidLink(true);
//       setIsLoading(false);
//     };

//     validateLink();
//   }, [signature, linkType, offRampType, offRampValue, to]);

//   // Resolve ENS for the recipient address (merchant who generated the link)
//   useEffect(() => {
//     const work = async () => {
//       try {
//         if (to && isAddress(to as `0x${string}`)) {
//           const name = await resolveName({ address: to as `0x${string}` });
//           setToEnsName(name);
//         } else {
//           setToEnsName(null);
//         }
//       } catch {
//         setToEnsName(null);
//       }
//     };
//     work();
//   }, [to]);

//   // Copy to clipboard function
//   const copyToClipboard = (text: string) => {
//     navigator.clipboard.writeText(text);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   // Memoized Details View Component
//   const DetailsView = React.memo(({
//     amount,
//     currency,
//     selectedToken,
//     description,
//     resolvedChain,
//     linkType,
//     qrDataUrl,
//     onProceedToPay,
//     to,
//     toEnsName
//   }: {
//     amount: string | null;
//     currency: string | null;
//     selectedToken: string;
//     description: string | null;
//     resolvedChain: any;
//     linkType: string;
//     qrDataUrl: string | null;
//     onProceedToPay: () => void;
//     to: string | null;
//     toEnsName: string | null;
//   }) => {
//     return (
//       <Card className="border border-white/10 bg-white/5 backdrop-blur-sm shadow-lg overflow-hidden !rounded-2xl">
//         <CardContent className="p-4 space-y-4">
//           {/* Amount Display */}
//           <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10 !rounded-2xl">
//             <div className="flex items-center justify-between mb-3">
//               <span className="text-white text-xs font-medium">Amount</span>
//               {resolvedChain && (
//                 <Badge className="bg-blue-500/20 text-blue-200 border-blue-500/30 text-xs flex items-center space-x-1">
//                   <Image 
//                     src={SUPPORTED_CHAINS_NORMAL.find(c => c.id === resolvedChain.id)?.icon || '/base.svg'} 
//                     alt={resolvedChain.name} 
//                     width={12} 
//                     height={12} 
//                     className="rounded-full"
//                   />
//                   <span>{resolvedChain.name}</span>
//                 </Badge>
//               )}
//             </div>
//             <div className="flex items-center space-x-3">
//               {(selectedToken || currency) && (
//                 <Image
//                   src={stablecoins.find(t => 
//                     t.baseToken.toLowerCase() === (selectedToken || currency)?.toLowerCase() ||
//                     t.currency.toLowerCase() === (selectedToken || currency)?.toLowerCase()
//                   )?.flag || "/usdc-logo.svg"}
//                   alt={selectedToken || currency || "Token"}
//                   width={32}
//                   height={32}
//                   className="rounded-full"
//                 />
//               )}
//               <div>
//                 <div className="text-lg font-semibold text-white">
//                   {amount ? `${amount}` : "Any Amount"}
//                 </div>
//                 {(currency || selectedToken) && (
//                   <div className="text-slate-400 text-xs">
//                     {currency || selectedToken}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Description Section */}
//           {description && (
//             <div className="bg-slate-800/30 rounded-lg p-3 border border-white/10 !rounded-2xl">
//               <div className="flex items-center space-x-2 mb-2">
//                 <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
//                 <span className="text-white text-xs font-medium">Description</span>
//               </div>
//               <p className="text-slate-300 text-sm leading-relaxed">{description}</p>
//             </div>
//           )}
//           {/* Recipient (Merchant) */}
//           {to && (
//             <div className="bg-slate-800/30 rounded-lg p-3 border border-white/10 !rounded-2xl">
//               <div className="flex items-center space-x-2 mb-2">
//                 <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
//                 <span className="text-white text-xs font-medium">Recipient</span>
//                 {toEnsName && (
//                   <Badge className="ml-2 bg-indigo-600/30 text-indigo-200 border-indigo-500/30 text-[10px]">
//                     {toEnsName}
//                   </Badge>
//                 )}
//               </div>
//               <div className="flex items-center justify-between gap-2">
//                 <code className="text-slate-200 text-xs break-all font-mono flex-1">
//                   {`${to.slice(0, 6)}...${to.slice(-4)}`}
//                 </code>
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => to && copyToClipboard(to)}
//                   className="bg-slate-800/60 border-slate-600 text-slate-200 hover:bg-slate-700/60 !rounded-lg h-8 px-2"
//                 >
//                   <ClipboardCopy className="h-4 w-4" />
//                 </Button>
//               </div>
//             </div>
//           )}


//           {/* Proceed to Pay Button */}
//           <Button
//             onClick={onProceedToPay}
//             className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg transition-all duration-200"
//           >
//             Proceed to Pay
//           </Button>

//           {/* QR Code Section */}
//           {qrDataUrl && (
//             <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10 !rounded-2xl text-center">
//               <div className="mb-3">
//                 <span className="text-white text-xs font-medium">Scan to Pay</span>
//               </div>
//               <Image
//                 src={qrDataUrl}
//                 alt="Payment QR Code"
//                 width={200}
//                 height={200}
//                 className="mx-auto rounded-lg bg-white p-2"
//               />
//               <p className="text-slate-400 text-xs mt-2">
//                 Scan with your wallet app
//               </p>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     );
//   });

//   // Payment View Component  
//   const PaymentView = React.memo(({
//     amount,
//     currency,
//     description,
//     linkType,
//     chainId,
//     tokenParam,
//     to,
//     params,
//     offRampType,
//     offRampValue,
//     offRampProvider,
//     accountName,
//     onBackToDetails
//   }: {
//     amount: string | null;
//     currency: string | null;
//     description: string | null;
//     linkType: string;
//     chainId: number | null;
//     tokenParam: string | null;
//     to: string | null;
//     params: { id: string };
//     offRampType: string | null;
//     offRampValue: string | null;
//     offRampProvider: string | null;
//     accountName: string | null;
//     onBackToDetails: () => void;
//   }) => {

//     // --- STATE MOVED HERE TO PREVENT TOP-LEVEL RE-RENDERS ---
//     const [internalSelectedChain, setInternalSelectedChain] = useState(chainId?.toString() || '8453');
//     const [internalSelectedToken, setInternalSelectedToken] = useState(tokenParam || currency || 'USDC');
//     const [internalCustomAmount, setInternalCustomAmount] = useState('');

//     const handleChainChange = useCallback((value: string) => {
//       setInternalSelectedChain(value);
//       const available = stablecoins.filter(token => token.chainIds.includes(parseInt(value)));
//       if (available.length > 0 && !available.find(t => t.baseToken === internalSelectedToken)) {
//         setInternalSelectedToken(available[0].baseToken);
//       }
//     }, [internalSelectedToken]);

//     const handleTokenChange = useCallback((value: string) => {
//       setInternalSelectedToken(value);
//     }, []);

//     const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
//       setInternalCustomAmount(e.target.value);
//     }, []);

//     const availableTokens = useMemo(() => {
//       return stablecoins.filter((token) => 
//         token.chainIds.includes(parseInt(internalSelectedChain))
//       );
//     }, [internalSelectedChain]);

//     return (
//       <Card className="border border-white/10 bg-white/5 backdrop-blur-sm shadow-lg overflow-hidden !rounded-2xl">
//         <CardContent className="p-4 space-y-4">
//           {/* Back Button */}
//           <div className="flex items-center space-x-2 mb-4">
//             <Button
//               onClick={onBackToDetails}
//               variant="outline"
//               size="sm"
//               className="bg-slate-800/50 border-white/20 text-white hover:bg-slate-700/50"
//             >
//               <ArrowLeft className="w-4 h-4 mr-1" />
//               Back to Details
//             </Button>
//           </div>

//           {/* Chain and Token Selection for Normal Payments */}
//           {linkType === "normal" && (
//             <motion.div 
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.1 }}
//               className="space-y-4 mb-6"
//             >
//               <ChainSelector 
//                 selectedChain={internalSelectedChain} 
//                 onChainChange={handleChainChange} 
//               />
              
//               <TokenSelector 
//                 selectedToken={internalSelectedToken} 
//                 onTokenChange={handleTokenChange} 
//                 availableTokens={availableTokens} 
//               />

//               {/* Custom Amount Input for "Any Amount" links */}
//               {!amount && (
//                 <AmountInput 
//                   customAmount={internalCustomAmount} 
//                   onAmountChange={handleAmountChange} 
//                 />
//               )}
//             </motion.div>
//           )}

//           {/* Payment Content */}
//           {linkType === "offramp" && 
//            amount && 
//            currency && 
//            to && 
//            offRampType && 
//            offRampValue && 
//            offRampProvider && 
//            accountName && 
//            (offRampType === "PHONE" || offRampType === "BANK_ACCOUNT") ? (
//             <OffRampPayment
//               amount={amount}
//               currency={currency}
//               description={description || undefined}
//               chainId={chainId || undefined}
//               to={to}
//               offRampType={offRampType as "PHONE" | "BANK_ACCOUNT"}
//               offRampValue={offRampValue}
//               offRampProvider={offRampProvider}
//               accountName={accountName}
//               linkId={params.id}
//             />
//           ) : linkType === "offramp" ? (
//             <Alert className="bg-red-900/20 border-red-500/50">
//               <AlertCircle className="h-4 w-4" />
//               <AlertDescription>
//                 Invalid offramp payment link. Missing required parameters.
//               </AlertDescription>
//             </Alert>
//           ) : (
//             <PayWithWallet
//               to={to || ""}
//               amount={amount || internalCustomAmount || "0"}
//               currency={internalSelectedToken || currency || "USDC"}
//               description={description || undefined}
//               linkId={params.id}
//               chainId={parseInt(internalSelectedChain) || chainId || undefined}
//             />
//           )}
//         </CardContent>
//       </Card>
//     );
//   });

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
//         <Header />
//         <div className="container mx-auto px-4 py-8 max-w-md">
//           <div className="flex items-center justify-center min-h-[400px]">
//             <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!isValidLink) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
//         <Header />
//         <div className="container mx-auto px-4 py-8 max-w-md">
//           <Alert className="border-red-500/20 bg-red-500/10">
//             <AlertCircle className="h-4 w-4 text-red-400" />
//             <AlertDescription className="text-red-300">
//               {errorMessage}
//             </AlertDescription>
//           </Alert>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
//       <Header />
      
//       <div className="container mx-auto px-4 py-8 max-w-md h-[calc(100vh-80px)] overflow-y-auto">
//         <div className="space-y-6">
//           {/* Logo and Title */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="text-center space-y-4"
//           >
//             <div className="relative mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 shadow-lg shadow-blue-500/25">
//               <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center">
//                 <Image
//                   src="/NEDApayLogo.png"
//                   alt="NedaPay"
//                   width={40}
//                   height={40}
//                   className="rounded-lg"
//                 />
//               </div>
//             </div>
//             <div>
//               <h1 className="text-2xl font-bold text-white">
//                 {linkType === "offramp" ? "Off-Ramp Payment" : "Stablecoin Payment"}
//               </h1>
//               <p className="text-slate-100 text-sm">
//                 {linkType === "offramp" ? "Convert stablecoin to local currency" : "Send stablecoin to a wallet"}
//               </p>
//             </div>
//           </motion.div>

//           {/* Two-Step Flow */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.2 }}
//           >
//             {currentStep === "details" ? (
//               <DetailsView
//                 amount={amount}
//                 currency={currency}
//                 selectedToken={tokenParam || currency || "USDC"} // Pass initial token
//                 description={description}
//                 resolvedChain={resolvedChain}
//                 linkType={linkType}
//                 qrDataUrl={qrDataUrl}
//                 to={to}
//                 toEnsName={toEnsName}
//                 onProceedToPay={() => setCurrentStep("payment")}
//               />
//             ) : (
//               <PaymentView
//                 amount={amount}
//                 currency={currency}
//                 description={description}
//                 linkType={linkType}
//                 chainId={chainId}
//                 tokenParam={tokenParam}
//                 to={to}
//                 params={params}
//                 offRampType={offRampType}
//                 offRampValue={offRampValue}
//                 offRampProvider={offRampProvider}
//                 accountName={accountName}
//                 onBackToDetails={() => setCurrentStep("details")}
//               />
//             )}
//           </motion.div>
//         </div>
//       </div>
//     </div>
//   );
// }
