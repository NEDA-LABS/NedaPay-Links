// ===============================================================
// components/idrx/RedeemIdrxCard.tsx — Redeem flow requiring burn tx hash
// ===============================================================
"use client";
import { useState } from "react";
import useSWR from "swr";
import { Card, CardTitle, Button, Input, Label } from "./UI";

export default function RedeemIdrxCard() {
  const { data } = useSWR("/api/idrx/bank-accounts");
  const [loading, setLoading] = useState(false);
  const banks = (data?.data ?? []) as any[];

  async function submit(formData: FormData) {
    setLoading(true);
    try {
      await fetch("/api/idrx/redeem-idrx", { method: "POST", body: formData });
      alert("Redeem submitted");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardTitle>Redeem IDRX → Indonesian bank</CardTitle>
      <form action={submit} className="space-y-3">
        <div>
          <Label>Amount (IDR)</Label>
          <Input type="number" name="amount" required min="20000" step="1" />
        </div>
        <div>
          <Label>Bank account</Label>
          <select
            name="bankAccountHash"
            className="w-full rounded-xl border p-2"
            required
          >
            <option value="">Select…</option>
            {banks.map((b) => (
              <option key={b.id} value={`${b.bankName}_${b.bankAccountNumber}`}>
                {b.bankName} · {b.bankAccountNumber}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Burn transaction hash</Label>
          <Input name="burnTxHash" placeholder="0x…" required />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Submitting…" : "Submit redeem"}
        </Button>
      </form>
      <p className="mt-2 text-xs text-gray-500">
        Note: bankAccountHash format must be {"{bankName}_{bankAccountNumber}"}.
      </p>
    </Card>
  );
}
