import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface Institution {
  code: string;
  name: string;
}

interface Currency {
  code: string;
  name: string;
}

interface OffRampFieldsProps {
  formData: {
    currency: string;
    offRampType: "PHONE" | "BANK_ACCOUNT";
    offRampValue: string;
    accountName: string;
    offRampProvider: string;
  };
  supportedInstitutions: Institution[];
  supportedCurrencies: Currency[];
  onUpdate: (updates: Partial<OffRampFieldsProps['formData']>) => void;
}

export const OffRampFields: React.FC<OffRampFieldsProps> = ({
  formData,
  supportedInstitutions,
  supportedCurrencies,
  onUpdate,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm">
        <Label htmlFor="currency" className="text-white">Currency</Label>
        <Select
          value={formData.currency}
          onValueChange={(value: string) => onUpdate({ currency: value })}
        >
          <SelectTrigger id="currency" className="h-12 text-base bg-slate-800/50 border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white">
            <SelectValue placeholder="Select a currency" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900/80 backdrop-blur-md border-slate-700 text-white rounded-xl">
            {supportedCurrencies.map((c) => (
              <SelectItem key={c.code} value={c.code} className="focus:bg-slate-800 rounded-lg">
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm">
        <Label className="text-white">Off-Ramp Type</Label>
        <ToggleGroup
          type="single"
          value={formData.offRampType}
          onValueChange={(value: "PHONE" | "BANK_ACCOUNT") => {
            if (value) onUpdate({ offRampType: value });
          }}
          className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-800/50 p-1 border border-slate-700"
        >
          <ToggleGroupItem value="PHONE" className="py-3 text-base rounded-xl text-slate-400 transition-all hover:bg-slate-700/50 hover:text-slate-200 data-[state=on]:bg-gradient-to-r data-[state=on]:from-blue-600 data-[state=on]:to-purple-600 data-[state=on]:text-white data-[state=on]:shadow-lg">Phone Number</ToggleGroupItem>
          <ToggleGroupItem value="BANK_ACCOUNT" className="py-3 text-base rounded-xl text-slate-400 transition-all hover:bg-slate-700/50 hover:text-slate-200 data-[state=on]:bg-gradient-to-r data-[state=on]:from-blue-600 data-[state=on]:to-purple-600 data-[state=on]:text-white data-[state=on]:shadow-lg">Bank Account</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm">
        <Label htmlFor="offRampValue" className="text-white">
          {formData.offRampType === "PHONE" ? "Phone Number" : "Bank Account Number"}
        </Label>
        <Input
          id="offRampValue"
          type="text"
          value={formData.offRampValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ offRampValue: e.target.value })}
          placeholder={formData.offRampType === "PHONE" ? "e.g. +2348123456789" : "e.g. 0123456789"}
          className="h-12 text-base bg-slate-800/50 border-slate-700 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 text-white placeholder:text-slate-400 transition-colors duration-300"
        />
      </div>

      <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm">
        <Label htmlFor="accountName" className="text-white">Account Name</Label>
        <Input
          id="accountName"
          type="text"
          value={formData.accountName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate({ accountName: e.target.value })}
          placeholder="e.g. John Doe"
          className="h-12 text-base bg-slate-800/50 border-slate-700 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 text-white placeholder:text-slate-400 transition-colors duration-300"
        />
      </div>

      <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm">
        <Label htmlFor="offRampProvider" className="text-white">
          {formData.offRampType === "PHONE" ? "Mobile Network" : "Bank"}
        </Label>
        <Select
          value={formData.offRampProvider}
          onValueChange={(value: string) => onUpdate({ offRampProvider: value })}
        >
          <SelectTrigger id="offRampProvider" className="h-12 text-base bg-slate-800/50 border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white">
            <SelectValue placeholder={`Select a ${formData.offRampType === "PHONE" ? "network" : "bank"}`} />
          </SelectTrigger>
          <SelectContent className="bg-slate-900/80 backdrop-blur-md border-slate-700 text-white rounded-xl">
            {supportedInstitutions.map((inst) => (
              <SelectItem key={inst.code} value={inst.code} className="focus:bg-slate-800 rounded-lg">
                {inst.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};