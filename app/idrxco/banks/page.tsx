// app/(dashboard)/dashboard/banks/page.tsx
import { BankAccountsList } from '@/app/components/banks/bank-accounts-list';
import { AddBankButton } from '@/app/components/banks/add-bank-button';

export default function BanksPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bank Accounts</h1>
          <p className="text-gray-600">Manage your Indonesian bank accounts</p>
        </div>
        <AddBankButton />
      </div>

      <BankAccountsList />
    </div>
  );
}