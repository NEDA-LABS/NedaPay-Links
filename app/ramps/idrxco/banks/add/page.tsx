// app/(dashboard)/dashboard/banks/add/page.tsx
import { BankAccountForm } from '@/idrxco/components/BankAccountForm';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function AddBankPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/banks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Add Bank Account</h1>
          <p className="text-gray-600">Add a new Indonesian bank account</p>
        </div>
      </div>

      <BankAccountForm />
    </div>
  );
}