import { api } from "@/lib/api/client";
import { isMockMode } from "@/lib/config";
import { mockDb } from "@/mocks/db";
import { simulate } from "@/mocks/scenario";
import type { ApiTransaction, ApiWallet } from "@/types/api";
import type { Transaction, Wallet } from "@/types/domain";
import { toTransaction } from "./adapters";

/** Backend per-minute rate used for estimates (see backend /billing/wallet `rate_per_minute`). */
const DEMO_RATE = 5.5;

export interface BillingService {
  wallet(): Promise<Wallet>;
  transactions(opts: { limit: number; offset: number; type?: "credit" | "debit" }): Promise<Transaction[]>;
}

const mockImpl: BillingService = {
  wallet: () =>
    simulate(() => {
      const b = mockDb().balanceInr;
      return { balanceInr: b, estimatedMinutes: Math.floor(b / DEMO_RATE), ratePerMinute: DEMO_RATE, lowBalance: b < 100 };
    }, { latency: 200 }),
  transactions: ({ limit, offset, type }) =>
    simulate(() => mockDb().transactions.filter((t) => !type || t.type === type).slice(offset, offset + limit)),
};

const apiImpl: BillingService = {
  async wallet() {
    const w = await api.get<ApiWallet>("/billing/wallet");
    return { balanceInr: w.balance_inr, estimatedMinutes: w.estimated_minutes_remaining, ratePerMinute: w.rate_per_minute, lowBalance: w.is_low_balance };
  },
  transactions: async ({ limit, offset, type }) => (await api.get<ApiTransaction[]>("/billing/transactions", { limit, offset, type })).map(toTransaction),
};

export const billingService: BillingService = isMockMode ? mockImpl : apiImpl;
