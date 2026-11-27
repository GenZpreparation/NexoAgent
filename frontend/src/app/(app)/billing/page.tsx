"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, CreditCard, Info, Plus, Receipt, Wallet } from "lucide-react";
import { cn, formatDateTime, formatInr, formatNumber } from "@/lib/utils";
import { canReal } from "@/lib/capabilities";
import { useAsync } from "@/hooks/useAsync";
import { billingService } from "@/services/billing";
import { performanceService } from "@/services/performance";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Tabs";
import { BackendNotice, PageHeader, Pagination, StatCard } from "@/components/ui/Misc";
import { EmptyState, ErrorState, Skeleton, SkeletonRows } from "@/components/ui/States";
import { Dialog } from "@/components/ui/Dialog";
import { ChartCard, ColumnChart, DataTable } from "@/components/charts/Charts";

type TxFilter = "all" | "credit" | "debit";
const LIMIT = 15;

export default function BillingPage() {
  return (
    <Suspense>
      <BillingInner />
    </Suspense>
  );
}

function BillingInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(params.get("add") === "1");
  const [filter, setFilter] = useState<TxFilter>("all");
  const [offset, setOffset] = useState(0);
  const wallet = useAsync(() => billingService.wallet(), "wallet");
  const usage = useAsync(() => performanceService.get({ days: 30 }), "billing:usage");
  const tx = useAsync(() => billingService.transactions({ limit: LIMIT, offset, type: filter === "all" ? undefined : filter }), `tx:${filter}:${offset}`);
  const debits = useAsync(() => billingService.transactions({ limit: 100, offset: 0, type: "debit" }), "tx:debits");

  const [now] = useState(() => Date.now());
  const daily = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => new Date(now - (29 - i) * 86_400_000).toISOString().slice(0, 10));
    const map = new Map(days.map((d) => [d, 0]));
    for (const t of debits.data ?? []) {
      const k = t.createdAt.slice(0, 10);
      if (map.has(k)) map.set(k, Math.round(((map.get(k) ?? 0) + t.amountInr) * 100) / 100);
    }
    return days.map((date) => ({ date, spend: map.get(date) ?? 0 }));
  }, [debits.data, now]);

  const w = wallet.data;

  return (
    <>
      <PageHeader
        title="Credits & billing"
        description="Your calling balance, usage and every credit or charge on your account."
        actions={<Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>Add credits</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="relative overflow-hidden lg:col-span-1">
          <CardBody className="py-5">
            <div className="flex items-center gap-2 text-[13px] font-medium text-ink-2">
              <Wallet className="h-4 w-4" aria-hidden /> Current balance
            </div>
            {wallet.error ? (
              <ErrorState compact error={wallet.error} onRetry={wallet.refetch} />
            ) : !w ? (
              <Skeleton className="mt-3 h-9 w-40" />
            ) : (
              <>
                <p className="tabular mt-2 text-3xl font-semibold tracking-tight text-ink">{formatInr(w.balanceInr)}</p>
                <p className="mt-1 text-[13px] text-ink-2">≈ {formatNumber(w.estimatedMinutes)} calling minutes at {formatInr(w.ratePerMinute)}/min</p>
                {w.lowBalance && (
                  <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-warning-soft px-3 py-2 text-[13px] font-medium text-warning">
                    <AlertTriangle className="h-4 w-4" aria-hidden /> Low balance — calls may stop soon.
                  </p>
                )}
                <Button className="mt-4 w-full" variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>Add credits</Button>
              </>
            )}
          </CardBody>
        </Card>
        <div className="grid grid-cols-2 gap-3 lg:col-span-2">
          <StatCard label="Spent (30 days)" value={usage.data ? formatInr(usage.data.summary.creditsUsedInr) : "—"} icon={<CreditCard />} tone="accent" loading={!usage.data && !usage.error} />
          <StatCard label="Calls (30 days)" value={usage.data ? formatNumber(usage.data.summary.calls) : "—"} icon={<Receipt />} loading={!usage.data && !usage.error} />
          <Card className="col-span-2 p-4">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" aria-hidden />
              <div className="text-[13px] leading-relaxed text-ink-2">
                <p className="font-medium text-ink">How usage is charged</p>
                <p className="mt-0.5">
                  Calls are charged per connected minute from your prepaid balance{w ? `, currently ${formatInr(w.ratePerMinute)}/min as reported by the backend` : ""}. Unanswered calls show ₹0 in the call log. Final pricing, taxes and invoices come from the billing backend.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <ChartCard
        className="mt-4"
        title="Daily spend"
        description="Call charges over the last 30 days"
        loading={!debits.data && !debits.error}
        error={debits.error}
        onRetry={debits.refetch}
        empty={daily.every((d) => d.spend === 0)}
        emptyText="No call charges in the last 30 days."
        table={<DataTable columns={["Date", "Spend (₹)"]} rows={daily.filter((d) => d.spend > 0).map((d) => [d.date, d.spend.toFixed(2)])} />}
      >
        <ColumnChart data={daily} xKey="date" yKey="spend" label="Spend (₹)" height={200} xFormatter={(d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} />
      </ChartCard>

      <Card className="mt-4 overflow-hidden">
        <CardHeader
          title="Transaction history"
          action={
            <Segmented
              ariaLabel="Transaction type"
              value={filter}
              onChange={(v) => {
                setFilter(v);
                setOffset(0);
              }}
              items={[
                { value: "all", label: "All" },
                { value: "credit", label: "Credits" },
                { value: "debit", label: "Charges" },
              ]}
            />
          }
        />
        <div className="mt-3">
          {tx.error ? (
            <ErrorState error={tx.error} onRetry={tx.refetch} />
          ) : !tx.data ? (
            <SkeletonRows rows={6} />
          ) : tx.data.length === 0 && offset === 0 ? (
            <EmptyState icon={<Receipt />} title="No transactions yet" description="Credits you add and call charges will be listed here." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-[13px]">
                  <thead>
                    <tr className="border-y border-line bg-subtle/60 text-left text-xs text-ink-3">
                      <th className="px-5 py-2.5 font-medium">Description</th>
                      <th className="px-3 py-2.5 font-medium">Date</th>
                      <th className="px-3 py-2.5 font-medium">Reference</th>
                      <th className="px-3 py-2.5 text-right font-medium">Amount</th>
                      <th className="px-5 py-2.5 text-right font-medium">Balance after</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {tx.data.map((t) => {
                      const credit = t.type === "credit";
                      return (
                        <tr key={t.id}>
                          <td className="px-5 py-3">
                            <span className="flex items-center gap-2.5">
                              <span className={cn("flex h-7 w-7 items-center justify-center rounded-full", credit ? "bg-success-soft text-success" : "bg-muted text-ink-2")}>
                                {credit ? <ArrowDownLeft className="h-3.5 w-3.5" aria-label="Credit" /> : <ArrowUpRight className="h-3.5 w-3.5" aria-label="Charge" />}
                              </span>
                              <span className="font-medium text-ink">{t.description}</span>
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-ink-2">{formatDateTime(t.createdAt)}</td>
                          <td className="px-3 py-3 font-mono text-xs text-ink-3">{t.reference ?? "—"}</td>
                          <td className={cn("tabular px-3 py-3 text-right font-medium", credit ? "text-success" : "text-ink")}>
                            {credit ? "+" : "−"}
                            {formatInr(t.amountInr)}
                          </td>
                          <td className="tabular px-5 py-3 text-right text-ink-2">{formatInr(t.closingBalanceInr)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination offset={offset} limit={LIMIT} count={tx.data.length} hasMore={tx.data.length === LIMIT} onChange={setOffset} />
            </>
          )}
        </div>
      </Card>

      <AddCreditsDialog
        open={addOpen}
        rate={w?.ratePerMinute}
        onClose={() => {
          setAddOpen(false);
          if (params.get("add")) router.replace("/billing");
        }}
      />
    </>
  );
}

const PACKS = [1000, 2500, 5000, 10000];

function AddCreditsDialog({ open, onClose, rate }: { open: boolean; onClose: () => void; rate?: number }) {
  const [amount, setAmount] = useState<number>(2500);
  const [custom, setCustom] = useState("");
  const value = custom ? Number(custom) : amount;
  const valid = Number.isFinite(value) && value >= 100 && value <= 500000;
  const checkout = canReal("billing.checkout");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add credits"
      description="Top up your prepaid calling balance."
      footer={
        <>
          <Button onClick={onClose}>Close</Button>
          <Button variant="primary" disabled={!checkout || !valid} title={checkout ? undefined : "Checkout isn't connected yet"}>
            Continue to payment
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Amount">
          {PACKS.map((p) => {
            const active = !custom && amount === p;
            return (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setAmount(p);
                  setCustom("");
                }}
                className={cn("rounded-xl border px-3 py-3 text-left transition-colors", active ? "border-accent ring-2 ring-accent/15" : "border-line hover:border-line-strong")}
              >
                <span className="tabular block text-sm font-semibold text-ink">{formatInr(p)}</span>
                {rate && <span className="block text-xs text-ink-3">≈ {formatNumber(Math.floor(p / rate))} min</span>}
              </button>
            );
          })}
        </div>
        <Field label="Or enter an amount (₹)" error={custom && !valid ? "Enter between ₹100 and ₹5,00,000." : null}>
          {(id, d) => <Input id={id} aria-describedby={d} inputMode="numeric" value={custom} onChange={(e) => setCustom(e.target.value.replace(/[^\d]/g, ""))} placeholder="e.g. 3000" invalid={!!custom && !valid} />}
        </Field>
        {!checkout && (
          <BackendNotice title="Payments aren't connected in this app yet">
            The backend can create Razorpay orders, but the checkout and payment verification flow hasn&apos;t been wired into the frontend. No payment will be taken and no credits will be added from here.
          </BackendNotice>
        )}
      </div>
    </Dialog>
  );
}
