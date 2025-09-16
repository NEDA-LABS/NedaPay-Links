// app/components/banks/add-bank-button.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export function AddBankButton() {
  return (
    <Link href="/dashboard/banks/add">
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Add Bank Account
      </Button>
    </Link>
  );
}