import type { EmployeeDraft } from "@/types/domain";
import { CALLING_MODES, languageLabel, WEEKDAYS } from "@/lib/labels";

/**
 * The current backend stores an AI employee as { name, system_prompt, first_message,
 * voice, language }. Until it stores calling mode, qualification questions,
 * follow-ups and working hours as structured fields (PROPOSED in the contract),
 * the wizard compiles them into the system prompt so nothing the user configured is lost.
 */
export function compileSystemPrompt(d: EmployeeDraft): string {
  const lines: string[] = [];
  lines.push(`You are ${d.name || "an AI employee"}${d.role ? `, ${d.role}` : ""}.`);
  if (d.description.trim()) lines.push("", "## Purpose", d.description.trim());

  lines.push(
    "",
    "## How to speak",
    `- Language: ${languageLabel(d.language)}.`,
    `- Tone: ${d.tone}.`,
    d.naturalSpeech
      ? "- Speak naturally like a person on the phone: short sentences, brief acknowledgements, allow interruptions."
      : "- Speak clearly and formally; avoid filler words.",
  );

  if (d.callingMode) lines.push(`- Calling mode: ${CALLING_MODES[d.callingMode].label} — ${CALLING_MODES[d.callingMode].description}`);

  if (d.instructions.trim()) lines.push("", "## Instructions", d.instructions.trim());

  const qs = d.qualificationQuestions.filter((q) => q.question.trim());
  if (qs.length) {
    lines.push("", "## Qualification — capture these details");
    qs.forEach((q, i) => lines.push(`${i + 1}. ${q.question.trim()} → save as "${q.field}"${q.required ? " (required)" : ""}`));
  }
  if (d.hotLeadCriteria.trim()) lines.push("", "## Mark as a hot lead when", d.hotLeadCriteria.trim());

  lines.push(
    "",
    "## Follow-ups",
    `- If unreachable, retry up to ${d.followUp.maxAttempts} time(s), ${d.followUp.retryGapHours}h apart.`,
    d.followUp.honourCallbackRequests ? "- If the caller asks to be called later, confirm a time and schedule a callback." : "- Do not offer callbacks.",
  );
  if (d.followUp.sendSummaryOnWhatsApp) lines.push("- Offer to send a summary on WhatsApp after the call.");

  const days = d.workingHours.days.slice().sort().map((i) => WEEKDAYS[i]).join(", ");
  lines.push("", "## Working hours", `${days || "No days selected"}, ${d.workingHours.start}–${d.workingHours.end} (${d.workingHours.timezone}).`);

  lines.push("", "## Always", "- Be honest that you are an AI assistant if asked.", "- Never invent prices, approvals or availability.", "- End politely if the person is not interested.");
  return lines.join("\n");
}
