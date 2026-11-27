import { ApiError } from "@/lib/api/errors";

/**
 * Demo scenarios let you preview every UI state without a backend:
 *  - populated: realistic demo workspace
 *  - empty: brand-new workspace (all lists empty)
 *  - error: every request fails like an unreachable backend
 * Stored in localStorage (non-sensitive UI preference). Changed from Settings → Preferences.
 */
export type DemoScenario = "populated" | "empty" | "error";
const KEY = "nexo.demo.scenario";

export function getScenario(): DemoScenario {
  if (typeof window === "undefined") return "populated";
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "empty" || v === "error" ? v : "populated";
  } catch {
    return "populated";
  }
}

export function setScenario(s: DemoScenario): void {
  try {
    window.localStorage.setItem(KEY, s);
  } catch {
    /* ignore */
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Wrap every mock read/write: realistic latency + scenario-driven failure. */
export async function simulate<T>(fn: () => T, { latency = 380, failable = true } = {}): Promise<T> {
  await wait(latency * (0.6 + Math.random() * 0.8));
  if (failable && getScenario() === "error") {
    throw new ApiError("network", "Demo scenario “error”: simulating an unreachable backend. Switch it in Settings → Preferences.");
  }
  // structuredClone so callers can't mutate the store by accident
  return structuredClone(fn());
}
