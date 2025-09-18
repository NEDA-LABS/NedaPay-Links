// app/components/dashboard/quick-actions.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Menu } from 'lucide-react';
import { AddRecipientModal } from './AddRecipientModal';

export function QuickActions() {
  const [openRecipient, setOpenRecipient] = useState(false);

  return (
    <div className="w-full flex items-center justify-end">
      {/* Minimal dropdown trigger */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            size="sm"
            className="flex items-center gap-2 bg-slate-800 text-white hover:bg-slate-700"
          >
            <Menu className="h-4 w-4" />
            Quick Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="z-[100] bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
          <DropdownMenuItem asChild>
            <Link href="/idrxco">Redeem</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenRecipient(true)}>Add Recipient</DropdownMenuItem>
          <DropdownMenuItem disabled>Mint (soon)</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal lives here so it can be triggered from the dropdown */}
      <AddRecipientModal
        onSuccess={() => setOpenRecipient(false)}
        open={openRecipient}
        onOpenChange={setOpenRecipient}
        showTrigger={false}
      />
    </div>
  );
}