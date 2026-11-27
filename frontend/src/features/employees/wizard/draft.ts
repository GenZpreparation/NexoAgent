import { uid } from "@/lib/utils";
import type { EmployeeDraft, Voice } from "@/types/domain";
import type { EmployeeTemplate } from "../templates";

export const STEPS = [
  { key: "describe", title: "Describe the job", short: "Job" },
  { key: "identity", title: "Name & voice", short: "Voice" },
  { key: "conversation", title: "Conversation", short: "Talk" },
  { key: "qualification", title: "Qualification", short: "Qualify" },
  { key: "followups", title: "Follow-ups", short: "Follow-up" },
  { key: "schedule", title: "Working hours", short: "Hours" },
  { key: "review", title: "Review & create", short: "Review" },
] as const;

export type StepKey = (typeof STEPS)[number]["key"];
export type DraftErrors = Partial<Record<string, string>>;

export function emptyDraft(): EmployeeDraft {
  return {
    name: "",
    role: "",
    description: "",
    language: "hi-IN",
    naturalSpeech: true,
    callingMode: null,
    voiceId: "",
    firstMessage: "",
    instructions: "",
    tone: "friendly",
    qualificationQuestions: [],
    hotLeadCriteria: "",
    followUp: { maxAttempts: 3, retryGapHours: 4, honourCallbackRequests: true, sendSummaryOnWhatsApp: false },
    workingHours: { days: [1, 2, 3, 4, 5, 6], start: "09:30", end: "19:00", timezone: "Asia/Kolkata" },
    templateId: null,
  };
}

export function applyTemplate(draft: EmployeeDraft, t: EmployeeTemplate): EmployeeDraft {
  const d = t.defaults;
  return {
    ...draft,
    templateId: t.id,
    name: d.name,
    role: d.role,
    description: d.description,
    language: d.language,
    callingMode: d.callingMode,
    firstMessage: d.firstMessage,
    instructions: d.instructions,
    qualificationQuestions: d.questions.map((q) => ({ ...q, id: uid("q") })),
    hotLeadCriteria: d.hotLeadCriteria,
    voiceId: "",
  };
}

/** Pick a voice that matches the chosen language, falling back to the first. */
export function suggestVoice(voices: Voice[], language: string): string {
  const prefix = language === "hinglish" ? "hi" : language.slice(0, 2);
  return (voices.find((v) => v.languageCode.startsWith(prefix)) ?? voices[0])?.id ?? "";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !["what", "is", "the", "your", "you", "are", "do", "how", "which", "a", "an", "to", "of", "and", "or", "would", "like", "can"].includes(w))
    .slice(0, 3)
    .join("_");
}

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/** Validation per step. Limits mirror the backend's AgentCreateRequest constraints. */
export function validateStep(step: StepKey, d: EmployeeDraft): DraftErrors {
  const e: DraftErrors = {};
  switch (step) {
    case "describe":
      if (d.description.trim().length < 30) e.description = "Describe the job in at least a sentence or two (30+ characters).";
      if (d.description.length > 2000) e.description = "Keep the description under 2,000 characters.";
      if (!d.callingMode) e.callingMode = "Choose how this employee should call.";
      break;
    case "identity":
      if (d.name.trim().length < 2) e.name = "Name must be at least 2 characters.";
      if (d.name.trim().length > 100) e.name = "Name must be under 100 characters.";
      if (!d.voiceId) e.voiceId = "Pick a voice.";
      if (d.firstMessage.trim().length < 5) e.firstMessage = "Write the opening line (at least 5 characters).";
      if (d.firstMessage.length > 500) e.firstMessage = "Opening line must be under 500 characters.";
      break;
    case "conversation":
      if (d.instructions.length > 4000) e.instructions = "Keep instructions under 4,000 characters.";
      break;
    case "qualification":
      d.qualificationQuestions.forEach((q, i) => {
        if (!q.question.trim()) e[`q.${i}.question`] = "Enter the question or remove it.";
        if (!/^[a-z][a-z0-9_]{0,39}$/.test(q.field)) e[`q.${i}.field`] = "Use lowercase letters, numbers and underscores.";
      });
      {
        const fields = d.qualificationQuestions.map((q) => q.field);
        fields.forEach((f, i) => {
          if (f && fields.indexOf(f) !== i) e[`q.${i}.field`] = "Each answer needs a unique key.";
        });
      }
      break;
    case "followups":
      if (d.followUp.maxAttempts < 1 || d.followUp.maxAttempts > 6) e.maxAttempts = "Between 1 and 6 attempts.";
      if (d.followUp.retryGapHours < 1 || d.followUp.retryGapHours > 72) e.retryGapHours = "Between 1 and 72 hours.";
      break;
    case "schedule":
      if (!d.workingHours.days.length) e.days = "Select at least one working day.";
      if (toMinutes(d.workingHours.end) <= toMinutes(d.workingHours.start)) e.hours = "End time must be after start time.";
      break;
    case "review":
      break;
  }
  return e;
}

export function firstInvalidStep(d: EmployeeDraft): number {
  return STEPS.findIndex((s) => Object.keys(validateStep(s.key, d)).length > 0);
}
