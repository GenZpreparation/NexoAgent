import { describe, expect, it } from "vitest";
import { buildSeed } from "./seed";
import { computePerformance, filterLeads, summarizeLeads } from "./query";

const NOW = Date.parse("2026-11-27T12:00:00Z");
const db = buildSeed(NOW);

describe("mock seed", () => {
  it("is deterministic and never fabricates recordings", () => {
    const again = buildSeed(NOW);
    expect(again.leads.map((l) => l.id)).toEqual(db.leads.map((l) => l.id));
    expect(db.conversations.every((c) => c.recordingAvailable === false)).toBe(true);
  });
});

describe("filterLeads", () => {
  it("searches name, phone digits and captured info", () => {
    const target = db.leads.find((l) => Object.keys(l.capturedInfo).length)!;
    const value = Object.values(target.capturedInfo)[0];
    expect(filterLeads(db.leads, { search: value }).some((l) => l.id === target.id)).toBe(true);
    const digits = target.phone.slice(-6);
    expect(filterLeads(db.leads, { search: digits }).every((l) => l.phone.includes(digits))).toBe(true);
  });
  it("filters hot leads and sorts oldest first", () => {
    const hot = filterLeads(db.leads, { hotOnly: true });
    expect(hot.length).toBeGreaterThan(0);
    expect(hot.every((l) => l.temperature === "hot")).toBe(true);
    const oldest = filterLeads(db.leads, { sort: "oldest" });
    expect(oldest[0].createdAt <= oldest[oldest.length - 1].createdAt).toBe(true);
  });
  it("summarises totals consistently", () => {
    const s = summarizeLeads(db.leads);
    expect(s.total).toBe(db.leads.length);
    expect(s.qualified).toBe(db.leads.filter((l) => l.qualified).length);
  });
});

describe("computePerformance", () => {
  it("produces internally consistent metrics", () => {
    const p = computePerformance(db.conversations, db.employees, { days: 30 }, NOW);
    expect(p.funnel[0].value).toBe(p.summary.calls);
    expect(p.funnel[1].value).toBeLessThanOrEqual(p.funnel[0].value);
    expect(p.callsOverTime.reduce((s, d) => s + d.dialed, 0)).toBeLessThanOrEqual(p.summary.calls);
    expect(p.leaderboard!.reduce((s, r) => s + r.calls, 0)).toBe(p.summary.calls);
  });
  it("returns zeros, not NaN, when nothing matches", () => {
    const p = computePerformance([], [], { days: 7 }, NOW);
    expect(p.summary.connectRatePct).toBe(0);
    expect(p.summary.avgCallLengthSec).toBe(0);
    expect(p.callsOverTime).toHaveLength(7);
  });
});
