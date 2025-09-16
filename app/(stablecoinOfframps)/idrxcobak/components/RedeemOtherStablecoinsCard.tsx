"use client";
import useSWR from "swr";
import { Card, CardTitle } from "./UI";

export default function RedeemOtherStablecoinsCard() {
  const { data } = useSWR("/api/idrx/bank-accounts");
  const { data: rates } = useSWR("/api/idrx/rates");
  const banks = (data?.data ?? []) as any[];

  return (
    <Card>
      <CardTitle>Redeem from other stablecoins</CardTitle>
      <p className="text-sm mb-2">
        Send supported tokens to a bank account’s deposit address to initiate
        USD→IDR redemption. Displaying your accounts and current quotes.
      </p>
      <div className="space-y-2">
        {banks.map((b) => (
          <div key={b.id} className="rounded border p-2">
            <div className="font-medium">
              {b.bankName} · {b.bankAccountNumber}
            </div>
            <div className="text-xs break-all">
              Deposit address: {b.DepositWalletAddress?.walletAddress ?? "—"}
            </div>
          </div>
        ))}
      </div>
      <pre className="mt-3 overflow-auto rounded bg-gray-50 p-3 text-xs">
        {JSON.stringify(rates, null, 2)}
      </pre>
    </Card>
  );
}
