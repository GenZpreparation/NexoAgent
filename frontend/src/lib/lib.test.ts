import { describe, expect, it } from "vitest";
import { errorFromResponse } from "./api/errors";
import { buildUrl } from "./api/client";
import { toCsv } from "./csv";
import { formatDuration, formatPhone, isValidHttpsUrl, isValidPhone } from "./utils";

describe("errorFromResponse", () => {
  it("uses FastAPI string detail for client errors", () => {
    const e = errorFromResponse(402, { detail: "Insufficient wallet balance" });
    expect(e.kind).toBe("payment_required");
    expect(e.message).toBe("Insufficient wallet balance");
  });
  it("maps 422 validation arrays to field errors", () => {
    const e = errorFromResponse(422, { detail: [{ loc: ["body", "name"], msg: "String should have at least 2 characters", type: "x" }] });
    expect(e.kind).toBe("validation");
    expect(e.fieldErrors).toEqual({ name: "String should have at least 2 characters" });
    expect(e.message).toContain("name");
  });
  it("never exposes server error details", () => {
    const e = errorFromResponse(500, { detail: "Traceback: secret stuff" });
    expect(e.kind).toBe("server");
    expect(e.message).not.toContain("Traceback");
  });
});

describe("buildUrl", () => {
  it("drops empty and false query values", () => {
    expect(buildUrl("/leads", { search: "", hot_only: false, limit: 25, agent_id: undefined })).toBe("/api/v1/leads?limit=25");
    expect(buildUrl("calls", { status: "busy" })).toBe("/api/v1/calls?status=busy");
  });
});

describe("toCsv", () => {
  it("escapes quotes/commas and neutralises formula injection", () => {
    const csv = toCsv([{ a: 'He said "hi", ok', b: "=HYPERLINK(1)" }], [
      { header: "A", value: (r) => r.a },
      { header: "B", value: (r) => r.b },
    ]);
    expect(csv).toBe('A,B\r\n"He said ""hi"", ok",\'=HYPERLINK(1)');
  });
});

describe("format helpers", () => {
  it("formats durations and Indian phone numbers", () => {
    expect(formatDuration(75)).toBe("1:15");
    expect(formatDuration(0)).toBe("0:00");
    expect(formatPhone("+919876543210")).toBe("+91 98765 43210");
    expect(formatPhone("+14155550100")).toBe("+14155550100");
  });
  it("validates phones and webhook URLs", () => {
    expect(isValidPhone("+91 98765 43210")).toBe(true);
    expect(isValidPhone("12345")).toBe(false);
    expect(isValidHttpsUrl("https://crm.example.com/hook")).toBe(true);
    expect(isValidHttpsUrl("http://example.com")).toBe(false);
    expect(isValidHttpsUrl("http://localhost:4000/x")).toBe(true);
    expect(isValidHttpsUrl("javascript:alert(1)")).toBe(false);
  });
});
