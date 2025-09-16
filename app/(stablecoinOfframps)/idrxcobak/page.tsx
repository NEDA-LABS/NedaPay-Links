"use client";
import useSWR from "swr";
import { useState } from "react";
import { usePrivy, useWallets, WalletWithMetadata } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { ERC20_BURNABLE_ABI, ERC20_ABI } from "./utils/abis";
import { getSignerFromWallet } from "./utils/ethers";
import {
  CHAIN_PARAMS,
  IDRX_ADDRESSES,
  DEFAULT_TOKENS,
} from "./utils/constants";

function Section({ title, children }: any) {
  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function Dashboard() {
  const { user } = usePrivy();
  const { data: bankRes, mutate: refreshBanks } = useSWR(
    "/api/idrx/bank-accounts",
    (u) => fetch(u).then((r) => r.json())
  );
  const banks = (bankRes?.data ?? []) as any[];

  const { wallets } = useWallets();
  const active = wallets[0];

  async function ensureChain(chainKey: keyof typeof CHAIN_PARAMS) {
    if (!active) throw new Error("Connect a wallet with Privy");
    // @ts-ignore
    const eip1193 = await active.getEthereumProvider?.();
    const { chainIdHex } = CHAIN_PARAMS[chainKey];
    await eip1193.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  }

  async function burnIdrxAndRedeem({
    chainKey,
    amountIdr,
    bankAccountHash,
  }: {
    chainKey: keyof typeof CHAIN_PARAMS;
    amountIdr: number;
    bankAccountHash: string;
  }) {
    if (!active) throw new Error("No wallet");
    await ensureChain(chainKey);
    const { signer } = await getSignerFromWallet(active);

    const idrxAddr = IDRX_ADDRESSES[chainKey];
    const c = new ethers.Contract(idrxAddr, ERC20_BURNABLE_ABI, signer);
    const decimals: number = await c.decimals();
    const toBurn = ethers.utils.parseUnits(String(amountIdr), decimals);
    const burnTx = await c.burn(toBurn);
    const receipt = await burnTx.wait();

    const payload = {
      amount: amountIdr,
      bankAccountHash,
      burnTxHash: receipt.hash,
    };
    const resp = await fetch("/api/idrx/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error(await resp.text());
    alert("Redeem submitted");
  }

  async function sendOtherStablecoin({
    chainKey,
    tokenAddr,
    amount,
    toDeposit,
  }: {
    chainKey: keyof typeof CHAIN_PARAMS;
    tokenAddr: `0x${string}`;
    amount: string;
    toDeposit: string;
  }) {
    if (!active) throw new Error("No wallet");
    await ensureChain(chainKey);
    const { signer } = await getSignerFromWallet(active);
    const erc = new ethers.Contract(tokenAddr, ERC20_ABI, signer);
    const decimals: number = await erc.decimals();
    const qty = ethers.utils.parseUnits(amount, decimals);
    const tx = await erc.transfer(toDeposit, qty);
    await tx.wait();
    alert("Transfer sent to deposit address");
  }

  return (
    <div className="space-y-6">
      <Section title="1) Request access to IDRX rails">
        <RequestAccess />
      </Section>

      <Section title="2) Manage your bank accounts">
        <AddBank onAdded={refreshBanks} />
        <ListBanks banks={banks} onChanged={refreshBanks} />
      </Section>

      <Section title="3) Redeem IDRX → IDR (requires on-chain burn)">
        <RedeemIdrx banks={banks} onSubmit={burnIdrxAndRedeem} />
      </Section>

      <Section title="4) Redeem from other stablecoins (USDT/USDC)">
        <RedeemOther banks={banks} onSend={sendOtherStablecoin} />
      </Section>
    </div>
  );
}

function RequestAccess() {
  const { data, mutate } = useSWR("/api/me", (u) =>
    fetch(u).then((r) => r.json())
  );
  async function toggle() {
    await fetch("/api/me/request-idrx", { method: "POST" });
    await mutate();
  }
  return (
    <div className="flex items-center justify-between rounded border p-3">
      <div>
        <div className="font-medium">
          Ask admin to enable IDRX for my account
        </div>
        <div className="text-sm text-gray-600">
          Your KYC must be APPROVED in our system first.
        </div>
      </div>
      <button onClick={toggle} className="rounded-xl border px-3 py-2">
        Request
      </button>
    </div>
  );
}

function AddBank({ onAdded }: { onAdded: () => void }) {
  const [loading, setLoading] = useState(false);
  const [methods, setMethods] = useState<any[]>([]);
  async function loadMethods() {
    const r = await fetch("/api/idrx/methods");
    const j = await r.json();
    setMethods(j?.data ?? []);
  }
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget as HTMLFormElement);
        const payload = {
          bankAccountNumber: fd.get("bankAccountNumber"),
          bankCode: fd.get("bankCode"),
        };
        setLoading(true);
        try {
          const r = await fetch("/api/idrx/bank-accounts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!r.ok) throw new Error(await r.text());
          onAdded();
        } finally {
          setLoading(false);
        }
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Bank code</label>
          <input
            name="bankCode"
            className="w-full rounded-xl border p-2"
            placeholder="014"
            onFocus={loadMethods}
            list="bank-codes"
            required
          />
          <datalist id="bank-codes">
            {methods.map((m) => (
              <option key={m.bankCode} value={m.bankCode}>
                {m.bankName}
              </option>
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Account number
          </label>
          <input
            name="bankAccountNumber"
            className="w-full rounded-xl border p-2"
            required
          />
        </div>
      </div>
      <button disabled={loading} className="rounded-xl border px-3 py-2">
        {loading ? "Adding…" : "Add bank"}
      </button>
    </form>
  );
}

function ListBanks({
  banks,
  onChanged,
}: {
  banks: any[];
  onChanged: () => void;
}) {
  return (
    <div className="space-y-2">
      {banks.map((b) => (
        <div
          key={b.id}
          className="flex items-center justify-between rounded border p-2"
        >
          <div>
            <div className="font-medium">
              {b.bankName} ({b.bankCode})
            </div>
            <div className="text-sm">
              {b.bankAccountName} · {b.bankAccountNumber}
            </div>
            {b.DepositWalletAddress?.walletAddress && (
              <div className="text-xs text-gray-600 break-all">
                Deposit: {b.DepositWalletAddress.walletAddress}
              </div>
            )}
          </div>
          <button
            onClick={async () => {
              await fetch(`/api/idrx/bank-accounts/${b.id}`, {
                method: "DELETE",
              });
              onChanged();
            }}
            className="rounded-xl border px-3 py-2"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

function RedeemIdrx({
  banks,
  onSubmit,
}: {
  banks: any[];
  onSubmit: (args: any) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
          const fd = new FormData(e.currentTarget as HTMLFormElement);
          const amountIdr = Number(fd.get("amount"));
          const b = String(fd.get("bankAccountHash"));
          const chainKey = String(fd.get("chainKey")) as any;
          await onSubmit({ chainKey, amountIdr, bankAccountHash: b });
        } finally {
          setLoading(false);
        }
      }}
    >
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Amount (IDR)</label>
          <input
            name="amount"
            type="number"
            min="20000"
            step="1"
            className="w-full rounded-xl border p-2"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Min 20,000 IDR. ≤250M processed realtime; 250M–1B Mon–Fri
            08:00–15:00 WIB.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Bank account</label>
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
          <label className="block text-sm font-medium mb-1">Chain</label>
          <select
            name="chainKey"
            className="w-full rounded-xl border p-2"
            required
          >
            <option value="polygon">Polygon</option>
            <option value="bsc">BNB Chain</option>
            <option value="base">Base</option>
            <option value="lisk">Lisk</option>
          </select>
        </div>
      </div>
      <button disabled={loading} className="rounded-xl border px-3 py-2">
        {loading ? "Processing…" : "Burn & Redeem"}
      </button>
    </form>
  );
}

function RedeemOther({
  banks,
  onSend,
}: {
  banks: any[];
  onSend: (args: any) => Promise<void>;
}) {
  const [chainKey, setChainKey] =
    useState<keyof typeof CHAIN_PARAMS>("polygon");
  const [token, setToken] = useState<`0x${string}`>(
    DEFAULT_TOKENS.polygon_usdt.address
  );
  const [amount, setAmount] = useState("5");
  const [to, setTo] = useState<string>("");

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Chain</label>
          <select
            className="w-full rounded-xl border p-2"
            value={chainKey}
            onChange={(e) => {
              const k = e.target.value as any;
              setChainKey(k);
              if (k === "polygon")
                setToken(DEFAULT_TOKENS.polygon_usdt.address);
              else if (k === "bsc") setToken(DEFAULT_TOKENS.bsc_usdt.address);
              else if (k === "base") setToken(DEFAULT_TOKENS.base_usdc.address);
            }}
          >
            <option value="polygon">Polygon (USDT)</option>
            <option value="bsc">BNB Chain (USDT)</option>
            <option value="base">Base (USDC)</option>
            <option value="lisk">Lisk (USDT0 — set address)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Token Address
          </label>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value as any)}
            className="w-full rounded-xl border p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Amount</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border p-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            Min $2, Max $5,555. ≤$5,555 processed realtime.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Deposit Address
          </label>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Pick from your bank list below"
            className="w-full rounded-xl border p-2"
          />
        </div>
      </div>
      <div className="text-sm">
        Your deposit addresses (from linked bank accounts):
      </div>
      <div className="grid gap-2">
        {banks.map((b) => (
          <button
            key={b.id}
            className="rounded border px-3 py-2 text-left"
            onClick={() => setTo(b.DepositWalletAddress?.walletAddress ?? "")}
          >
            {b.bankName} · {b.bankAccountNumber}
            <div className="text-xs break-all">
              {b.DepositWalletAddress?.walletAddress ?? "—"}
            </div>
          </button>
        ))}
      </div>
      <button
        className="rounded-xl border px-3 py-2"
        onClick={() =>
          onSend({ chainKey, tokenAddr: token, amount, toDeposit: to })
        }
      >
        Send token to deposit address
      </button>
      <RatesWidget />
    </div>
  );
}

function RatesWidget() {
  const { data } = useSWR("/api/idrx/rates", (u) =>
    fetch(u).then((r) => r.json())
  );
  return (
    <pre className="mt-3 overflow-auto rounded bg-gray-50 p-3 text-xs">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
