import { describe, expect, it } from "vitest";
import { parseTranscript, toConversation, toLead, toOutcome, toPerformance, toTemperature, toTransaction } from "./adapters";
import type { ApiCall, ApiLeadItem, ApiPerformance } from "@/types/api";

describe("parseTranscript", () => {
  it("splits a backend transcript string into speaker turns", () => {
    expect(parseTranscript("Agent: Namaste! User: Mujhe 3 BHK dekhna hai. Agent: Budget?")).toEqual([
      { speaker: "agent", text: "Namaste!" },
      { speaker: "customer", text: "Mujhe 3 BHK dekhna hai." },
      { speaker: "agent", text: "Budget?" },
    ]);
  });
  it("returns null for empty transcripts and a single turn for unlabelled text", () => {
    expect(parseTranscript(null)).toBeNull();
    expect(parseTranscript("   ")).toBeNull();
    expect(parseTranscript("hello there")).toEqual([{ speaker: "agent", text: "hello there" }]);
  });
});

describe("toOutcome / toTemperature", () => {
  it("maps backend statuses to UI outcomes", () => {
    expect(toOutcome("no-answer")).toBe("no_answer");
    expect(toOutcome("dnd_blocked")).toBe("dnd");
    expect(toOutcome("retry_scheduled")).toBe("callback");
    expect(toOutcome("completed")).toBe("completed");
    expect(toOutcome("something-new")).toBe("pending");
  });
  it("derives temperature from sentiment or captured lead_interest", () => {
    expect(toTemperature("Hot")).toBe("hot");
    expect(toTemperature("Positive")).toBe("warm");
    expect(toTemperature(null, { lead_interest: "Hot" })).toBe("hot");
    expect(toTemperature("Neutral")).toBe("neutral");
  });
});

describe("toLead", () => {
  const wire: ApiLeadItem = {
    id: 7,
    name: "Aman",
    phone_number: "+919876543210",
    city: "Noida",
    campaign_name: "Diwali",
    status: "completed",
    lead_source: "meta_ads",
    sentiment: "Hot",
    outcome: "completed",
    captured_info: { budget: "2 Cr", visit: null, nested: { a: 1 } },
    call_attempts: 2,
    call_sid: "CA1",
    last_contacted_at: "2026-11-20T10:00:00Z",
    created_at: "2026-11-19T10:00:00Z",
  };
  it("adapts and stringifies captured info, dropping nulls", () => {
    const l = toLead(wire);
    expect(l.id).toBe("7");
    expect(l.qualified).toBe(true);
    expect(l.temperature).toBe("hot");
    expect(l.capturedInfo).toEqual({ budget: "2 Cr", nested: '{"a":1}' });
    expect(l.followUp.status).toBe("none");
  });
});

describe("toConversation", () => {
  it("labels employees from the name map and detects recordings", () => {
    const call: ApiCall = {
      id: 1,
      call_sid: "CA-1",
      workspace_id: 1,
      agent_id: 3,
      customer_phone: "+919800000000",
      direction: "inbound",
      status: "completed",
      duration_seconds: 75,
      cost_inr: 11,
      recording_url: "recordings/x.mp3",
      created_at: "2026-11-11T12:30:00Z",
      log: { id: 1, transcript: "Agent: Hi User: Hello", summary: "ok", sentiment: "Positive", extracted_data: { budget: "1 Cr" }, whatsapp_status: "sent" },
    };
    const c = toConversation(call, new Map([["3", "Pooja"]]));
    expect(c.employeeName).toBe("Pooja");
    expect(c.direction).toBe("inbound");
    expect(c.recordingAvailable).toBe(true);
    expect(c.transcript).toHaveLength(2);
    expect(c.outcome).toBeNull();
  });
});

describe("toPerformance", () => {
  it("marks breakdowns the backend does not provide as null", () => {
    const p: ApiPerformance = {
      summary: { total_calls: 10, calls_change_pct: 10, connect_rate_pct: 50, connected_calls: 5, conversion_rate_pct: 40, qualified_leads: 2, avg_call_length_seconds: 60, total_duration_minutes: 6, success_rate_pct: 90, credits_used_inr: 33, last_hour_calls: 0, last_24h_calls: 1 },
      calls_over_time: [],
      conversion_funnel: { dialed: 10, connected: 5, engaged_gt_30s: 3, qualified: 2 },
      outcomes: { interested: 2, callback: 0, not_interested: 0, busy: 1, dnd_scrubbed: 0, failed: 1 },
    };
    const d = toPerformance(p);
    expect(d.byChannel).toBeNull();
    expect(d.leaderboard).toBeNull();
    expect(d.outcomes.map((o) => o.outcome)).toEqual(["interested", "busy", "failed"]);
    expect(d.funnel[0]).toEqual({ stage: "Dialed", value: 10 });
  });
});

describe("toTransaction", () => {
  it("normalises type and amount sign", () => {
    expect(toTransaction({ id: 1, workspace_id: 1, transaction_type: "debit", amount_inr: -5.5, opening_balance_inr: 10, closing_balance_inr: 4.5, reference_id: null, description: "Call", created_at: "x" })).toMatchObject({ type: "debit", amountInr: 5.5 });
  });
});
