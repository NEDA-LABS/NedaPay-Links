'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BankAccountForm } from './BankAccountForm';

interface AddRecipientModalProps {
  onSuccess: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

export function AddRecipientModal({ onSuccess, open, onOpenChange, showTrigger = true }: AddRecipientModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const controlled = typeof open === 'boolean';
  const openState = controlled ? open! : isOpen;
  const setOpenState = controlled && onOpenChange ? onOpenChange : setIsOpen;

  const handleSuccess = () => {
    onSuccess();
    setOpenState(false);
  };

  return (
    <Dialog open={openState} onOpenChange={setOpenState}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button variant="link" className="h-auto p-0 text-sm font-semibold text-indigo-300">
            Add new recipient
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px] bg-slate-800 border border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Add New Bank Account</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <BankAccountForm onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
