"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toApiError, type ApiError } from "@/lib/api/errors";

export interface AsyncState<T> {
  data: T | undefined;
  error: ApiError | null;
  /** True during the first load AND during refetches (data is kept while refetching). */
  loading: boolean;
  refetch: () => void;
  /** Optimistically replace data (e.g. after a mutation). */
  setData: (updater: T | ((prev: T | undefined) => T)) => void;
}

/**
 * Minimal data-fetching hook: runs `fn` whenever `key` changes, ignores stale
 * responses, keeps previous data while refetching, and normalises errors.
 * `key` should be a stable string built from the query params.
 */
export function useAsync<T>(fn: () => Promise<T>, key: string, opts: { enabled?: boolean; pollMs?: number } = {}): AsyncState<T> {
  const { enabled = true, pollMs } = opts;
  const [data, setDataState] = useState<T | undefined>(undefined);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  const seq = useRef(0);

  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    if (!enabled) return;
    const id = ++seq.current;
    let cancelled = false;
    // Defer state updates to a microtask so effects don't set state synchronously.
    Promise.resolve()
      .then(() => {
        if (cancelled) return;
        setLoading(true);
        return fnRef.current();
      })
      .then((result) => {
        if (cancelled || id !== seq.current) return;
        setDataState(result as T);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled || id !== seq.current || (err as Error)?.name === "AbortError") return;
        setError(toApiError(err));
      })
      .finally(() => {
        if (!cancelled && id === seq.current) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [key, tick, enabled]);

  useEffect(() => {
    if (!pollMs || !enabled) return;
    const t = setInterval(() => setTick((n) => n + 1), pollMs);
    return () => clearInterval(t);
  }, [pollMs, enabled]);

  const refetch = useCallback(() => setTick((n) => n + 1), []);
  const setData = useCallback((updater: T | ((prev: T | undefined) => T)) => {
    setDataState((prev) => (typeof updater === "function" ? (updater as (p: T | undefined) => T)(prev) : updater));
  }, []);

  return { data, error, loading, refetch, setData };
}

export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
