import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign } from "lucide-react";

interface AmountDescriptionFieldsProps {
  formData: {
    amount: string;
    description: string;
  };
  onUpdate: (updates: Partial<AmountDescriptionFieldsProps['formData']>) => void;
  linkType: "NORMAL" | "OFF_RAMP";
}

export const AmountDescriptionFields: React.FC<AmountDescriptionFieldsProps> = ({
  formData,
  onUpdate,
  linkType,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm">
        <Label htmlFor="amount" className="flex items-center text-white">
          Payment Amount
          <span className="ml-2 text-xs text-slate-400">
            {linkType === "OFF_RAMP" ? "(Required)" : "(Optional)"}
          </span>
        </Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            id="amount"
            type="number"
            value={formData.amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ amount: e.target.value })}
            placeholder="0.00"
            className="pl-10 h-12 text-lg bg-slate-800/50 border-slate-700 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 text-white placeholder:text-slate-400 transition-colors duration-300"
          />
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm">
        <Label htmlFor="description" className="text-white">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onUpdate({ description: e.target.value })}
          placeholder="Add a note (e.g., for invoice #123)"
          className="resize-none min-h-[100px] bg-slate-800/50 border-slate-700 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 text-white placeholder:text-slate-400 transition-colors duration-300"
        />
      </div>
    </div>
  );
};