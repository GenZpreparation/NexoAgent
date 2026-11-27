import { describe, expect, it } from "vitest";
import { applyTemplate, emptyDraft, firstInvalidStep, slugify, validateStep } from "./draft";
import { TEMPLATES } from "../templates";
import { compileSystemPrompt } from "../prompt";

describe("wizard validation", () => {
  it("blocks the first step until description and calling mode are set", () => {
    const d = emptyDraft();
    const e = validateStep("describe", d);
    expect(e.description).toBeDefined();
    expect(e.callingMode).toBeDefined();
    expect(firstInvalidStep(d)).toBe(0);
  });
  it("accepts a template-filled draft once a voice is chosen", () => {
    const d = { ...applyTemplate(emptyDraft(), TEMPLATES[1]), voiceId: "bulbul:v3/pooja" };
    expect(firstInvalidStep(d)).toBe(-1);
  });
  it("rejects duplicate answer keys and inverted working hours", () => {
    const d = emptyDraft();
    d.qualificationQuestions = [
      { id: "1", question: "Budget?", field: "budget", required: true },
      { id: "2", question: "Budget again?", field: "budget", required: false },
    ];
    expect(validateStep("qualification", d)["q.1.field"]).toBeDefined();
    d.workingHours = { ...d.workingHours, start: "18:00", end: "09:00" };
    expect(validateStep("schedule", d).hours).toBeDefined();
  });
  it("slugifies questions into answer keys", () => {
    expect(slugify("What is your approximate budget?")).toBe("approximate_budget");
  });
});

describe("compileSystemPrompt", () => {
  it("includes every structured setting so nothing is lost on the current backend", () => {
    const d = { ...applyTemplate(emptyDraft(), TEMPLATES[0]), voiceId: "x" };
    const prompt = compileSystemPrompt(d);
    expect(prompt).toContain(d.name);
    expect(prompt).toContain("Calling mode: Instant");
    for (const q of d.qualificationQuestions) expect(prompt).toContain(q.field);
    expect(prompt).toContain("Working hours");
    expect(prompt.length).toBeGreaterThan(10); // backend requires system_prompt min_length 10
  });
});
