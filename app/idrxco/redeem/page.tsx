// app/(dashboard)/dashboard/redeem/page.tsx
import { RedeemForm } from '@/idrxco/components/RedeemForm';

export default function RedeemPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Redeem IDRX</h1>
        <p className="text-gray-600">Convert your IDRX to Indonesian Rupiah</p>
      </div>

      <RedeemForm />
    </div>
  );
}