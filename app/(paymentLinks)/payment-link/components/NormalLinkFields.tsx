import { SUPPORTED_CHAINS, ChainConfig } from "../utils/chains";
import { stablecoins } from "@/data/stablecoins";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Image from 'next/image';
import { useMemo, useEffect } from 'react';

// A placeholder for the actual stablecoin type.
interface Stablecoin {
  baseToken: string;
  [key: string]: any; // Allow other properties
}

interface NormalLinkFieldsProps {
  formData: {
    specifyChain: boolean;
    chainId: number;
    specifyCurrency: boolean;
    currency: string;
  };
  onUpdate: (updates: Partial<NormalLinkFieldsProps['formData']>) => void;
}

export const NormalLinkFields: React.FC<NormalLinkFieldsProps> = ({
  formData,
  onUpdate,
}) => {
  const filteredStablecoins = useMemo(() => {
    if (formData.specifyChain && formData.chainId) {
      return stablecoins.filter(coin => 
        Array.isArray(coin.chainIds) && coin.chainIds.includes(formData.chainId)
      );
    }
    return stablecoins;
  }, [formData.chainId, formData.specifyChain]);

  useEffect(() => {
    if (formData.currency && !filteredStablecoins.some(c => c.baseToken === formData.currency)) {
      onUpdate({ currency: '' });
    }
  }, [filteredStablecoins, formData.currency, onUpdate]);

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="specifyChain"
            checked={formData.specifyChain}
            onCheckedChange={(checked: boolean) => onUpdate({ specifyChain: checked })}
            className="h-5 w-5 rounded border-slate-600 bg-slate-800/50 text-blue-500 focus:ring-blue-500 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white"
          />
          <Label htmlFor="specifyChain" className="text-sm font-semibold text-white">
            Specify Blockchain Network?
          </Label>
        </div>
        {formData.specifyChain && (
          <div className="pl-6">
            <Label htmlFor="chain" className="block text-sm font-semibold text-white mb-2">
              Blockchain Network
            </Label>
            <Select
              value={String(formData.chainId)}
              onValueChange={(value: string) => onUpdate({ chainId: Number(value) })}
            >
              <SelectTrigger id="chain" className="w-full h-12 text-base bg-slate-800/50 border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white">
                <SelectValue placeholder="Select a chain" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900/80 backdrop-blur-md border-slate-700 text-white rounded-xl">
                {SUPPORTED_CHAINS.map((chain) => (
                  <SelectItem key={chain.id} value={String(chain.id)} className="focus:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Image src={chain.icon} alt={chain.name} width={24} height={24} className="rounded-full"/>
                      <span>{chain.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="specifyCurrency"
            checked={formData.specifyCurrency}
            onCheckedChange={(checked: boolean) => onUpdate({ specifyCurrency: checked })}
            className="h-5 w-5 rounded border-slate-600 bg-slate-800/50 text-blue-500 focus:ring-blue-500 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white"
          />
          <Label htmlFor="specifyCurrency" className="text-sm font-semibold text-white">
            Specify Stablecoin?
          </Label>
        </div>
        {formData.specifyCurrency && (
          <div className="pl-6">
            <Label htmlFor="currency" className="block text-sm font-semibold text-white mb-2">
              Currency
            </Label>
            <Select
              value={formData.currency}
              onValueChange={(value: string) => onUpdate({ currency: value })}
            >
              <SelectTrigger id="currency" className="w-full h-12 text-base bg-slate-800/50 border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white">
                <SelectValue placeholder="Select a currency" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900/80 backdrop-blur-md border-slate-700 text-white rounded-xl">
                {filteredStablecoins.map((coin) => (
                  <SelectItem key={coin.baseToken} value={coin.baseToken} className="focus:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Image src={coin.flag} alt={coin.name} width={24} height={24} className="rounded-full"/>
                      <span>{coin.baseToken}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
};