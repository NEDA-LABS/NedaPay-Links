// 'use client';

// import { stablecoins } from '@/data/stablecoins';
// import { SettingsDto } from '../utils/types';

// type Props = {
//   data: Pick<SettingsDto,
//     'autoSettlement' | 'settlementThreshold' | 'settlementCurrency' | 'paymentExpiry'
//   >;
//   onChange: (delta: Partial<SettingsDto>) => void;
//   onSave: () => void;
//   isSaving: boolean;
// };

// export default function PaymentTab({ data, onChange, onSave, isSaving }: Props) {
//   return (
//     <>
//       <div className="p-6 border-b border-gray-200">
//         <h2 className="text-xl font-semibold text-gray-800">Payment Settings</h2>
//         <p className="text-gray-600 text-sm mt-1">Configure how you receive and manage payments</p>
//       </div>
//       <div className="p-6">
//         <div className="space-y-6">
//           <div>
//             <label className="flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
//                 checked={data.autoSettlement}
//                 onChange={(e) => onChange({ autoSettlement: e.target.checked })}
//               />
//               <span className="text-gray-700 font-medium">Enable automatic settlement</span>
//             </label>
//             <p className="text-gray-500 text-sm mt-1 ml-6">Automatically settle payments to your wallet when they reach the threshold</p>
//           </div>
//           {data.autoSettlement && (
//             <div>
//               <label className="block text-gray-700 font-medium mb-2">Settlement Threshold</label>
//               <div className="flex">
//                 <input
//                   type="text"
//                   className="flex-grow p-3 border border-gray-300 rounded-l-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500"
//                   value={data.settlementThreshold}
//                   onChange={(e) => onChange({ settlementThreshold: e.target.value })}
//                 />
//                 <select
//                   className="p-3 border border-gray-300 border-l-0 rounded-r-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500"
//                   value={data.settlementCurrency}
//                   onChange={(e) => onChange({ settlementCurrency: e.target.value })}
//                 >
//                   {stablecoins.map((c) => (
//                     <option key={c.baseToken} value={c.baseToken}>
//                       {c.baseToken} - {c.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//           )}
//           <div>
//             <label className="block text-gray-700 font-medium mb-2">Payment Link Expiry</label>
//             <div className="flex">
//               <input
//                 type="text"
//                 className="flex-grow p-3 border border-gray-300 rounded-l-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500"
//                 value={data.paymentExpiry}
//                 onChange={(e) => onChange({ paymentExpiry: e.target.value })}
//               />
//               <span className="p-3 border border-gray-300 border-l-0 rounded-r-lg bg-gray-50 text-gray-800 font-medium">minutes</span>
//             </div>
//             <p className="text-gray-500 text-sm mt-1">Payment links will expire after this duration</p>
//           </div>
//           <div className="pt-4">
//             <button
//               className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg shadow hover:shadow-lg transition-all disabled:opacity-50"
//               onClick={onSave}
//               disabled={isSaving}
//             >
//               {isSaving ? 'Saving...' : 'Save Changes'}
//             </button>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }