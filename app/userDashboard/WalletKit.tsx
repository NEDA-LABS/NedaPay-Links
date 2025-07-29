import { Button } from "@/components/Button";
import { StablecoinBalanceButton } from '@/components/StablecoinBalanceTracker';
import { Send, Activity } from "lucide-react";

export default function WalletKit() {
  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/20 text-center">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <StablecoinBalanceButton />
          </div>
        </div>
        <div className="pt-4 border-t border-white/20">
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20"
            >
              <Send className="h-3 w-3 mr-1" />
              <a href="/Wallet">Send</a>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20"
            >
              <Activity className="h-3 w-3 mr-1" />
              Receive
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}