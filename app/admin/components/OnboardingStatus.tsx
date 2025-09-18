"use client";

import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Item = {
  userId: string;
  email: string | null;
  name: string | null;
  provider: string;
  idrxId: number;
  createdAt: string;
  updatedAt: string;
};

export default function OnboardingStatus() {
  const { data, isLoading, isError } = useQuery<{ statusCode: number; data: Item[] }>(
    {
      queryKey: ["idrx-onboarding-status"],
      queryFn: async () => {
        const res = await fetch("/api/idrxco/onboarding/status", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.message || "Failed to load status");
        }
        return json;
      },
      staleTime: 10_000,
    }
  );

  if (isLoading) {
    return <p className="text-sm text-slate-300">Loading onboarding status…</p>;
  }
  if (isError) {
    return <p className="text-sm text-red-400">Failed to load onboarding status.</p>;
  }

  const rows = data?.data ?? [];

  return (
    <div className="w-full overflow-hidden">
      <h3 className="text-sm font-semibold text-slate-200 mb-2">Recent Onboarded Users</h3>
      <div className="rounded-xl border border-slate-700/60 bg-slate-900/40">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-slate-300">Full Name</TableHead>
              <TableHead className="text-slate-300">Email</TableHead>
              <TableHead className="text-slate-300">Provider</TableHead>
              <TableHead className="text-slate-300">IDRX ID</TableHead>
              <TableHead className="text-slate-300">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.userId}>
                <TableCell className="text-slate-200">{r.name ?? "—"}</TableCell>
                <TableCell className="text-slate-400">{r.email ?? "—"}</TableCell>
                <TableCell className="text-slate-400">{r.provider}</TableCell>
                <TableCell className="text-slate-400">{r.idrxId}</TableCell>
                <TableCell className="text-slate-400">{new Date(r.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-500">
                  No onboarded users yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
