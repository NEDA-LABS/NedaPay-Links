// ===============================================================
// components/idrx/BankAccountsCard.tsx — add/list/delete bank accounts
// ===============================================================
"use client";
import useSWR from "swr";
import { useState } from "react";
import { Card, CardTitle, Button, Input, Label } from "./UI";

export default function BankAccountsCard() {
  const { data, mutate, isLoading } = useSWR("/api/idrx/bank-accounts");
  const [adding, setAdding] = useState(false);

  async function addBankAccount(formData: FormData) {
    setAdding(true);
    try {
      await fetch("/api/idrx/bank-accounts", {
        method: "POST",
        body: formData,
      });
      await mutate();
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/idrx/bank-accounts/${id}`, { method: "DELETE" });
    await mutate();
  }

  return (
    <Card>
      <CardTitle>Bank accounts</CardTitle>
      <form action={addBankAccount} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Bank code</Label>
            <Input name="bankCode" required placeholder="e.g. 014 for BCA" />
          </div>
          <div>
            <Label>Account number</Label>
            <Input name="bankAccountNumber" required placeholder="5017…" />
          </div>
        </div>
        <Button type="submit" disabled={adding}>
          {adding ? "Adding…" : "Add"}
        </Button>
      </form>

      <div className="mt-4 space-y-2">
        {isLoading ? (
          <p>Loading…</p>
        ) : (
          (data?.data ?? []).map((b: any) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded border p-2"
            >
              <div>
                <div className="font-medium">
                  {b.bankName} ({b.bankCode})
                </div>
                <div className="text-sm text-gray-600">
                  {b.bankAccountName} · {b.bankAccountNumber}
                </div>
                {b.DepositWalletAddress?.walletAddress && (
                  <div className="text-xs text-gray-500 break-all">
                    Deposit address: {b.DepositWalletAddress.walletAddress}
                  </div>
                )}
              </div>
              <Button onClick={() => remove(String(b.id))}>Delete</Button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
