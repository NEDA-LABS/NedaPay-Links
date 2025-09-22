import { motion } from 'framer-motion';
import { Wallet, ShieldAlert } from 'lucide-react';

interface WalletStatusProps {
    getMerchantAddress: () => string;
    isConnected: boolean;
}

export const WalletStatus: React.FC<WalletStatusProps> = ({ 
    getMerchantAddress, 
    isConnected 
}) => {
    const address = getMerchantAddress();
    const statusConfig = address 
      ? {
          bg: "bg-slate-800/50",
          borderColor: "border-emerald-500/30",
          shadowColor: "shadow-emerald-500/10",
          iconBg: "bg-emerald-500/10",
          iconColor: "text-emerald-400",
          titleColor: "text-emerald-400",
          textColor: "text-slate-400",
          statusText: "Wallet Connected",
          Icon: Wallet
        }
      : {
          bg: "bg-slate-800/50",
          borderColor: "border-amber-500/30",
          shadowColor: "shadow-amber-500/10",
          iconBg: "bg-amber-500/10",
          iconColor: "text-amber-400",
          titleColor: "text-amber-400",
          textColor: "text-slate-400",
          statusText: "Wallet Required",
          Icon: ShieldAlert
        };

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`text-sm mb-8 p-3 rounded-2xl border backdrop-blur-sm transition-all duration-300 ${statusConfig.bg} ${statusConfig.borderColor} ${statusConfig.shadowColor} shadow-lg`}
      >
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg ${statusConfig.iconBg}`}>
            <statusConfig.Icon className={`w-6 h-6 ${statusConfig.iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className={`font-semibold text-sm ${statusConfig.titleColor}`}>
              {statusConfig.statusText}
            </h3>
            <p className={`text-xs ${statusConfig.textColor} font-mono break-all mt-1`}>
              {address || "Please connect your wallet to create payment links"}
            </p>
          </div>
        </div>
      </motion.div>
    );
};