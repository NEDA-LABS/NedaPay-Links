import OnboardManagedUserCard from "./components/OnboardManagedUserCard";
import BankAccountsCard from "./components/BankAccountCard";
import RedeemIdrxCard from "./components/RedeemIdrxCard";
import RedeemOtherStablecoinsCard from "./components/RedeemOtherStablecoinsCard";


export default function Page() {
return (
<div className="grid gap-6 md:grid-cols-2">
<OnboardManagedUserCard />
<BankAccountsCard />
<RedeemIdrxCard />
<RedeemOtherStablecoinsCard />
</div>
);
}