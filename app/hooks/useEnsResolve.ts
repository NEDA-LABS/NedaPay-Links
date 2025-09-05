import { useEffect, useMemo, useRef, useState } from "react";
import { isAddress } from "viem";
import {
  isPotentialEnsName,
  resolveEnsClient,
  EnsClientResult,
} from "@/utils/ens";
import { resolveBasenameToAddress, resolveEnsName } from "@/utils/getBaseName";

export function useEnsResolve(input: string) {
  const [isResolving, setIsResolving] = useState(false);
  const [result, setResult] = useState<EnsClientResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastQueried = useRef<string>(""); // avoid duplicate calls

  const trimmed = input.trim();

  const mode: "empty" | "address" | "ens" | "unknown" = useMemo(() => {
    if (!trimmed) return "empty";
    if (isAddress(trimmed as `0x${string}`)) return "address";
    if (isPotentialEnsName(trimmed, 1) || isPotentialEnsName(trimmed, 8453))
      return "ens";
    return "unknown";
  }, [trimmed]);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    // quick paths
    if (mode === "empty") {
      setResult(null);
      setIsResolving(false);
      return;
    }

    if (mode === "address") {
      setResult({
        name: null,
        address: trimmed as `0x${string}`,
        avatar: null,
      });
      setIsResolving(false);
      return;
    }

    if (mode === "unknown") {
      // not a valid address and not an ENS name
      setResult(null);
      setIsResolving(false);
      return;
    }

    // ENS path — debounce ~300ms
    const work = async () => {
      setIsResolving(true);
      const key = `${trimmed}-1`;
      if (lastQueried.current === key) {
        setIsResolving(false);
        return;
      }

      lastQueried.current = key;

      try {
      
        // Handle regular .eth domains
        // const r = await resolveEnsClient(trimmed, 1);
        // if (!r) {
          const address = await resolveEnsName(trimmed);
          if (address && !cancelled) {
            console.log("Resolved Base Name:", address);
            setResult({
              name: trimmed,
              address: address as `0x${string}`,
              avatar: null,
            });
            setError(null);
          } else {
            setResult(null);
            setError("No address found for this Base Name.");
          }
        }
        // if (!cancelled) {
        //   setResult(r);
        //   setError(!r ? "No address found for this ENS name." : null);
        // }
      catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Failed to resolve ENS name.");
          setResult(null);
        }
      } finally {
        if (!cancelled) setIsResolving(false);
      }
    };

    const t = setTimeout(work, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [mode, trimmed]);

  const resolvedAddress = result?.address ?? null;
  const isValid = !!resolvedAddress && isAddress(resolvedAddress);

  return {
    isResolving,
    result,
    resolvedAddress,
    isValid,
    error,
    mode,
  };
}
