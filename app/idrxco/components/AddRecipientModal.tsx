'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BankAccountForm } from './BankAccountForm';

interface AddRecipientModalProps {
  onSuccess: () => void;
}

export function AddRecipientModal({ onSuccess }: AddRecipientModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = () => {
    onSuccess();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="h-auto p-0 text-sm font-semibold text-blue-600">
          Add new recipient
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Bank Account</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <BankAccountForm onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
