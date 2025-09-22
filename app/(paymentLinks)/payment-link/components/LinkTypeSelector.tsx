import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface LinkTypeSelectorProps {
  linkType: "NORMAL" | "OFF_RAMP";
  onLinkTypeChange: (type: "NORMAL" | "OFF_RAMP") => void;
}

export const LinkTypeSelector: React.FC<LinkTypeSelectorProps> = ({
  linkType,
  onLinkTypeChange,
}) => {
  return (
    <div className="space-y-2">
      <Label className="text-base font-semibold text-slate-300">Link Type</Label>
      <ToggleGroup
        type="single"
        value={linkType}
        onValueChange={(value: "NORMAL" | "OFF_RAMP") => {
          if (value) onLinkTypeChange(value);
        }}
        className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-800/50 p-1 border border-slate-700"
      >
        <ToggleGroupItem 
          value="NORMAL" 
          className="py-3 text-base rounded-xl text-slate-400 transition-all hover:bg-slate-700/50 hover:text-slate-200 data-[state=on]:bg-gradient-to-r data-[state=on]:from-blue-600 data-[state=on]:to-purple-600 data-[state=on]:text-white data-[state=on]:shadow-lg data-[state=on]:shadow-blue-600/20"
        >
          Stablecoin Payment
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="OFF_RAMP" 
          className="py-3 text-base rounded-xl text-slate-400 transition-all hover:bg-slate-700/50 hover:text-slate-200 data-[state=on]:bg-gradient-to-r data-[state=on]:from-blue-600 data-[state=on]:to-purple-600 data-[state=on]:text-white data-[state=on]:shadow-lg data-[state=on]:shadow-purple-600/20"
        >
          Fiat Payment
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};