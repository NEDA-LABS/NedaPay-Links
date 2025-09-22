import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ExpirationFieldProps {
  formData: {
    expirationEnabled: boolean;
    expiresAt: string;
  };
  onUpdate: (updates: Partial<ExpirationFieldProps['formData']>) => void;
}

export const ExpirationField: React.FC<ExpirationFieldProps> = ({
  formData,
  onUpdate,
}) => {
  return (
    <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="expirationEnabled"
          checked={formData.expirationEnabled}
          onCheckedChange={(checked: boolean) => onUpdate({ expirationEnabled: checked })}
          className="h-5 w-5 rounded border-slate-600 bg-slate-800/50 text-blue-500 focus:ring-blue-500 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white"
        />
        <Label htmlFor="expirationEnabled" className="text-sm font-medium leading-none text-white">
          Set Expiration Date
        </Label>
      </div>

      {formData.expirationEnabled && (
        <div className="pl-6 space-y-2">
          <Label htmlFor="expiresAt" className="text-xs font-medium text-slate-400">
            Expiration Date
          </Label>
          <Input
            id="expiresAt"
            type="date"
            value={formData.expiresAt ? formData.expiresAt.split('T')[0] : ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const dateValue = e.target.value;
              if (dateValue) {
                // Always set time to end of day (23:59) when date is selected
                const fullDateTime = `${dateValue}T23:59`;
                onUpdate({ expiresAt: fullDateTime });
              } else {
                onUpdate({ expiresAt: '' });
              }
            }}
            className="h-11 bg-slate-800/50 border-slate-700 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 text-white placeholder:text-slate-400 transition-colors duration-300 dark:[color-scheme:dark]"
          />
        </div>
      )}
    </div>
  );
};