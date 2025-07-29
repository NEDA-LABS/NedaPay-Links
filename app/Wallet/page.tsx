'use client';

import { useEffect, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useFundWallet, useSendTransaction, useWallets } from '@privy-io/react-auth';
import { formatUnits, parseEther, isAddress } from 'viem';
import { base, bsc, scroll } from 'viem/chains';
import { stablecoins } from '@/data/stablecoins';
import toast from 'react-hot-toast';

const SUPPORTED = [base, bsc, scroll];

const ERC20_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export default function WalletModal() {
  const { wallets } = useWallets();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { fundWallet } = useFundWallet();
  const { sendTransaction } = useSendTransaction();

  const [active, setActive] = useState(base);
  const [balances, setBalances] = useState<
    { symbol: string; balance: string; usd: string }[]
  >([]);
  const [fundAmount, setFundAmount] = useState('');
  const [fundAsset, setFundAsset] = useState<'native-currency' | 'USDC'>('USDC');
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');

  /* ---------- switch chain ---------- */
  const switchChain = async (c: any) => {
    try {
      await wallets[0]?.switchChain(c.id);
      setActive(c);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  /* ---------- load balances ---------- */
  useEffect(() => {
    if (!address) return;
    const load = async () => {
      const relevant = stablecoins.filter(
        (sc) => sc.chainIds.includes(active.id) && sc.addresses[active.id],
      );
      const rows: typeof balances = [];
      for (const sc of relevant) {
        try {
          const decimals =
            typeof sc.decimals === 'object'
              ? (sc.decimals as any)[active.id] ?? 6
              : sc.decimals;
          const raw = await publicClient?.readContract({
            address: sc.addresses[active.id] as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address],
          });
          const formatted = parseFloat(formatUnits(raw as bigint, decimals));
          if (formatted > 0) {
            rows.push({ symbol: sc.baseToken, balance: formatted.toFixed(6), usd: (formatted * 1).toFixed(2) });
          }
        } catch {
          /* ignore unsupported / broken tokens */
        }
      }
      setBalances(rows);
    };
    load();
  }, [address, active, publicClient]);

  /* ---------- fund ---------- */
  const handleFund = async () => {
    if (!address || !fundAmount) return toast.error('Missing amount');
    try {
      await fundWallet(address, { chain: active, amount: fundAmount, asset: fundAsset });
      toast.success('Funding flow opened');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  /* ---------- send ---------- */
  const handleSend = async () => {
    if (!sendTo || !sendAmount || !isAddress(sendTo)) return toast.error('Bad inputs');
    try {
      const { hash } = await sendTransaction({ to: sendTo, value: parseEther(sendAmount) });
      toast.success(`Tx: ${hash}`);
      setSendTo('');
      setSendAmount('');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4 bg-gray-50 rounded-xl shadow">
      <h2 className="text-xl font-bold !text-slate-800">Wallet</h2>

      {/* Chain switcher */}
      <div className="flex gap-2">
        {SUPPORTED.map((c) => (
          <button
            key={c.id}
            onClick={() => switchChain(c)}
            className={`px-3 py-1 text-sm rounded-lg transition ${
              active.id === c.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Balances */}
      <div className="space-y-2">
        {balances.length
          ? balances.map((b) => (
              <div key={b.symbol} className="flex justify-between bg-white p-3 rounded">
                <span className='!text-slate-800'>{b.symbol}</span>
                <span className='!text-slate-800'>{b.balance} ≈ ${b.usd}</span>
              </div>
            ))
          : <p className="text-sm text-gray-500">No supported tokens on {active.name}</p>}
      </div>

      {/* Fund */}
      <div className="space-y-2">
        <input
          value={fundAmount}
          onChange={(e) => setFundAmount(e.target.value)}
          placeholder={`Amount`}
          className="w-full px-2 py-1 border rounded text-slate-800"
        />
        <select
          value={fundAsset}
          onChange={(e) => setFundAsset(e.target.value as any)}
          className="w-full px-2 py-1 border rounded text-slate-800"
        >
          <option value="native-currency">{active.nativeCurrency.symbol}</option>
          <option value="USDC">USDC</option>
        </select>
        <button onClick={handleFund} className="w-full bg-blue-600 text-white py-2 rounded">
          Fund Wallet
        </button>
      </div>

      {/* Send */}
      <div className="space-y-2">
        <input
          value={sendTo}
          onChange={(e) => setSendTo(e.target.value)}
          placeholder="Recipient"
          className="w-full px-2 py-1 border rounded text-slate-800"
        />
        <input
          value={sendAmount}
          onChange={(e) => setSendAmount(e.target.value)}
          placeholder={`Amount ${active.nativeCurrency.symbol}`}
          className="w-full px-2 py-1 border rounded text-slate-800"
        />
        <button onClick={handleSend} className="w-full bg-green-600 text-white py-2 rounded">
          Send Transaction
        </button>
      </div>
    </div>
  );
}