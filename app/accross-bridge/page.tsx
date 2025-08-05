"use client";

import { useState, useMemo } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { parseEther, formatUnits } from "viem";
import { acrossClient } from "@/utils/acrossProtocol";
import { optimism, arbitrum, base, bsc, polygon, scroll, celo } from "viem/chains";
import { type GetQuoteParams } from "@across-protocol/app-sdk";

const chains = { 1: polygon, 10: optimism, 42161: arbitrum, 42220: scroll, 42261: celo, 42250: base, 56: bsc };

export default function BridgePage() {
  const { login, authenticated, ready } = usePrivy();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  // --- form state ---
  const [fromChainId, setFromChainId] = useState(42161);
  const [toChainId, setToChainId] = useState(10);
  const [token, setToken] = useState(
    "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"
  ); // WETH arb
  const [amount, setAmount] = useState("1");
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<Awaited<
    ReturnType<typeof acrossClient.getQuote>
  > | null>(null);
  const [status, setStatus] = useState<string>("");

  // --- UI helpers ---
  const canBridge = useMemo(
    () => authenticated && address && walletClient,
    [authenticated, address, walletClient]
  );

  // --- quote fetch ---
  const getQuote = async () => {
    if (!amount) return;
    setLoading(true);
    try {
      const q = await acrossClient.getQuote({
        route: {
          originChainId: fromChainId,
          destinationChainId: toChainId,
          inputToken: token as `0x${string}`,
          outputToken:
            toChainId === 10
              ? ("0x4200000000000000000000000000000000000006" as `0x${string}`)
              : (token as `0x${string}`),
        },
        inputAmount: parseEther(amount),
      });
      setQuote(q);
    } catch (e: any) {
      setStatus("Error fetching quote: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- execute bridge ---
  const execute = async () => {
    if (!quote || !walletClient) return;
    setStatus("Bridging...");
    try {
      await acrossClient.executeQuote({
        walletClient,
        deposit: quote.deposit,
        onProgress: (p) => {
          setStatus(`${p.step}: ${p.status}`);
          if (p.step === "fill" && p.status === "txSuccess") {
            setStatus("Bridge complete ✅");
            setQuote(null);
          }
        },
      });
    } catch (e: any) {
      setStatus("Bridge failed: " + e.message);
    }
  };

  // --- render ---
  if (!ready) return <p className="p-8">Loading...</p>;

  if (!authenticated)
    return (
      <div className="p-8">
        <button
          onClick={login}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Login with Privy
        </button>
      </div>
    );

  return (
    <main className="max-w-xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Bridge with Across</h1>

      <label className="block">
        From Chain
        <select
          value={fromChainId}
          onChange={(e) => setFromChainId(Number(e.target.value))}
          className="block w-full border p-2 rounded"
        >
          {Object.entries(chains).map(([id, c]) => (
            <option key={id} value={id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        To Chain
        <select
          value={toChainId}
          onChange={(e) => setToChainId(Number(e.target.value))}
          className="block w-full border p-2 rounded"
        >
          {Object.entries(chains).map(([id, c]) => (
            <option key={id} value={id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        Amount (ETH/WETH)
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="block w-full border p-2 rounded"
          type="number"
          step="0.01"
        />
      </label>

      <button
        onClick={getQuote}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Loading..." : "Get Quote"}
      </button>

      {quote && (
        <div className="border rounded p-4">
          <p>
            You will receive{" "}
            <strong>{formatUnits(quote.deposit.outputAmount, 18)} WETH</strong>{" "}
            on {chains[toChainId as keyof typeof chains]?.name}
          </p>
          <p>
            Fee: {formatUnits(quote.fees.totalRelayFee.total, 18)} ETH (
            {quote.estimatedFillTimeSec}s)
          </p>
          <button
            onClick={execute}
            className="mt-2 bg-green-600 text-white px-4 py-1 rounded"
          >
            Bridge now
          </button>
        </div>
      )}

      {status && <p className="text-sm text-gray-700">{status}</p>}
    </main>
  );
}
