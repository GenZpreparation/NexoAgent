"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, Check, ChevronRight, Inbox, ListChecks, Plus, Trash2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { CALLING_MODES, LANGUAGES, WEEKDAYS, languageLabel } from "@/lib/labels";
import { uid } from "@/lib/utils";
import type { CallingMode, EmployeeDraft, Voice } from "@/types/domain";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Switch, SwitchRow } from "@/components/ui/Switch";
import { Segmented } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/States";
import { TEMPLATES } from "../templates";
import { TemplateCard } from "../TemplateCard";
import { slugify, type DraftErrors } from "./draft";

export interface StepProps {
  draft: EmployeeDraft;
  set: (patch: Partial<EmployeeDraft>) => void;
  errors: DraftErrors;
}

const MODE_ICONS: Record<CallingMode, typeof Zap> = { instant: Zap, bulk: ListChecks, inbound: Inbox };

const DESCRIPTION_IDEAS = [
  "Call new property enquiries within a minute, understand budget and book site visits.",
  "Answer clinic calls, book appointments and take messages for doctors.",
  "Call through my loan leads list and book callbacks for eligible applicants.",
];

// ----------------------------------------------------------- Step 1 ----
export function DescribeStep({ draft, set, errors, onTemplate }: StepProps & { onTemplate: (id: string) => void }) {
  return (
    <div className="space-y-7">
      <div>
        <label htmlFor="job-description" className="block text-base font-semibold text-ink">
          What should your AI employee do?
        </label>
        <p className="mt-1 text-[13px] text-ink-2">Describe the job like you would to a new hire — who they call, what they ask, and what a good outcome looks like.</p>
        <div className={cn("mt-3 rounded-xl border bg-surface shadow-card transition-colors focus-within:border-accent/60 focus-within:shadow-focus", errors.description ? "border-danger/60" : "border-line")}>
          <textarea
            id="job-description"
            value={draft.description}
            onChange={(e) => set({ description: e.target.value })}
            rows={5}
            maxLength={2000}
            placeholder="e.g. Call people who fill our Facebook lead form within a minute. Ask about budget and preferred location, and book a site visit for interested buyers…"
            className="block w-full resize-none rounded-t-xl bg-transparent px-4 pt-3.5 text-[15px] leading-relaxed text-ink placeholder:text-ink-3 focus:outline-none"
            aria-invalid={!!errors.description}
            aria-describedby="job-description-msg"
          />
          <div className="flex flex-wrap items-center gap-3 border-t border-line px-3 py-2">
            <label className="flex items-center gap-2 text-[13px] text-ink-2">
              <span className="sr-only">Language</span>
              <Select value={draft.language} onChange={(e) => set({ language: e.target.value, voiceId: "" })} className="w-44" aria-label="Language">
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </Select>
            </label>
            <div className="flex items-center gap-2 text-[13px] text-ink-2">
              <Switch id="natural-speech" checked={draft.naturalSpeech} onChange={(v) => set({ naturalSpeech: v })} label="Natural spoken interaction" size="sm" />
              <label htmlFor="natural-speech" className="cursor-pointer select-none">
                Natural spoken interaction
              </label>
            </div>
            <span className="ml-auto text-xs tabular text-ink-3">{draft.description.length}/2000</span>
          </div>
        </div>
        <p id="job-description-msg" className={cn("mt-1.5 text-xs", errors.description ? "text-danger" : "text-ink-3")} role={errors.description ? "alert" : undefined}>
          {errors.description ?? (draft.naturalSpeech ? "Natural speech: short sentences, brief acknowledgements, and lets callers interrupt." : "Formal speech: clear and scripted, without filler words.")}
        </p>
        {!draft.description && (
          <div className="mt-3 flex flex-wrap gap-2">
            {DESCRIPTION_IDEAS.map((idea) => (
              <button key={idea} type="button" onClick={() => set({ description: idea })} className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink-2 transition-colors hover:border-accent/40 hover:text-ink">
                {idea.length > 60 ? `${idea.slice(0, 58)}…` : idea}
              </button>
            ))}
          </div>
        )}
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-ink">How should it call?</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Calling mode">
          {(Object.keys(CALLING_MODES) as CallingMode[]).map((m) => {
            const Icon = MODE_ICONS[m];
            const active = draft.callingMode === m;
            return (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => set({ callingMode: m })}
                className={cn(
                  "relative rounded-xl border bg-surface p-4 text-left shadow-card transition-all hover:border-line-strong focus-visible:shadow-focus",
                  active ? "border-accent ring-2 ring-accent/15" : "border-line",
                )}
              >
                {active && (
                  <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
                <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", active ? "bg-accent text-white" : "bg-accent-soft text-accent-ink")}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="mt-3 block text-sm font-semibold text-ink">{CALLING_MODES[m].label}</span>
                <span className="mt-0.5 block text-[13px] leading-snug text-ink-2">{CALLING_MODES[m].description}</span>
              </button>
            );
          })}
        </div>
        {errors.callingMode && (
          <p className="mt-1.5 text-xs text-danger" role="alert">
            {errors.callingMode}
          </p>
        )}
      </fieldset>

      <div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-ink">Or start from a template</h3>
            <p className="text-[13px] text-ink-2">Prefills every step — you can change anything.</p>
          </div>
          <Link href="/employees/templates" className="flex shrink-0 items-center gap-0.5 text-[13px] font-medium text-accent hover:underline">
            All templates <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
          {TEMPLATES.slice(0, 6).map((t) => (
            <TemplateCard key={t.id} template={t} compact selected={draft.templateId === t.id} onSelect={() => onTemplate(t.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------- Step 2 ----
export function IdentityStep({ draft, set, errors, voices, voicesError }: StepProps & { voices: Voice[] | undefined; voicesError: string | null }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required error={errors.name} hint="What the employee calls itself on the phone.">
          {(id, d) => <Input id={id} aria-describedby={d} value={draft.name} maxLength={100} onChange={(e) => set({ name: e.target.value })} invalid={!!errors.name} placeholder="e.g. Pooja" />}
        </Field>
        <Field label="Role" hint="Shown to your team, e.g. “Property advisor”.">
          {(id, d) => <Input id={id} aria-describedby={d} value={draft.role} maxLength={80} onChange={(e) => set({ role: e.target.value })} placeholder="e.g. Property advisor" />}
        </Field>
      </div>

      <fieldset>
        <legend className="label">
          Voice <span className="text-danger">*</span>
        </legend>
        <p className="mt-0.5 text-xs text-ink-3">Voices matching {languageLabel(draft.language)} are listed first.</p>
        {voicesError ? (
          <p className="mt-2 rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger">{voicesError}</p>
        ) : !voices ? (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px]" />
            ))}
          </div>
        ) : (
          <div className="mt-2 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Voice">
            {[...voices]
              .sort((a, b) => Number(b.languageCode.startsWith(draft.language === "hinglish" ? "hi" : draft.language.slice(0, 2))) - Number(a.languageCode.startsWith(draft.language === "hinglish" ? "hi" : draft.language.slice(0, 2))))
              .map((v) => {
                const active = draft.voiceId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => set({ voiceId: v.id })}
                    className={cn("flex items-start gap-3 rounded-xl border bg-surface p-3 text-left transition-colors", active ? "border-accent ring-2 ring-accent/15" : "border-line hover:border-line-strong")}
                  >
                    <span className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border", active ? "border-accent bg-accent" : "border-line-strong")}>
                      {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-ink">
                        {v.name}
                        <span className="font-normal text-ink-3">· {v.language} · {v.gender}</span>
                        {v.tier === "premium" && <Badge tone="accent">Premium</Badge>}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-ink-2">{v.description}</span>
                    </span>
                  </button>
                );
              })}
          </div>
        )}
        {errors.voiceId && <p className="mt-1.5 text-xs text-danger" role="alert">{errors.voiceId}</p>}
        <p className="mt-2 text-xs text-ink-3">Voice previews will play here once the backend serves sample audio.</p>
      </fieldset>

      <Field label="Opening line" required error={errors.firstMessage} hint="The first thing the employee says when the call connects.">
        {(id, d) => <Textarea id={id} aria-describedby={d} value={draft.firstMessage} maxLength={500} rows={3} onChange={(e) => set({ firstMessage: e.target.value })} invalid={!!errors.firstMessage} />}
      </Field>
    </div>
  );
}

// ----------------------------------------------------------- Step 3 ----
export function ConversationStep({ draft, set, errors }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <span className="label block">Tone</span>
        <Segmented
          className="mt-1.5"
          ariaLabel="Tone"
          value={draft.tone}
          onChange={(tone) => set({ tone })}
          items={[
            { value: "friendly", label: "Friendly" },
            { value: "professional", label: "Professional" },
            { value: "energetic", label: "Energetic" },
          ]}
        />
      </div>
      <Field label="Instructions & rules" error={errors.instructions} hint="What to say, what never to say, how to handle objections, and when to hand over to a human.">
        {(id, d) => (
          <Textarea
            id={id}
            aria-describedby={d}
            rows={9}
            maxLength={4000}
            value={draft.instructions}
            onChange={(e) => set({ instructions: e.target.value })}
            invalid={!!errors.instructions}
            placeholder={"- Confirm the caller's name before asking questions\n- Never quote prices; say a manager will share them\n- If the caller is busy, offer a callback time"}
          />
        )}
      </Field>
      <div className="rounded-xl border border-line bg-subtle p-4 text-[13px] text-ink-2">
        <p className="font-medium text-ink">Always included</p>
        <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
          <li>Be honest that it&apos;s an AI assistant if asked.</li>
          <li>Never invent prices, approvals or availability.</li>
          <li>End politely when the person isn&apos;t interested.</li>
        </ul>
      </div>
    </div>
  );
}

// ----------------------------------------------------------- Step 4 ----
export function QualificationStep({ draft, set, errors }: StepProps) {
  const qs = draft.qualificationQuestions;
  const update = (i: number, patch: Partial<(typeof qs)[number]>) => set({ qualificationQuestions: qs.map((q, j) => (j === i ? { ...q, ...patch } : q)) });
  const move = (i: number, dir: -1 | 1) => {
    const next = [...qs];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    set({ qualificationQuestions: next });
  };
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-ink">Questions to ask</h3>
        <p className="text-[13px] text-ink-2">Answers are captured on the lead under the key you choose, so you can filter and export them.</p>
      </div>
      {qs.length === 0 && (
        <div className="rounded-xl border border-dashed border-line-strong p-6 text-center text-[13px] text-ink-2">No questions yet. Add the details you need to qualify a lead.</div>
      )}
      <ol className="space-y-3">
        {qs.map((q, i) => (
          <li key={q.id} className="rounded-xl border border-line bg-surface p-3.5">
            <div className="flex items-start gap-3">
              <span className="mt-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-2xs font-semibold text-ink-2">{i + 1}</span>
              <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[1fr_180px]">
                <Field label="Question" error={errors[`q.${i}.question`]}>
                  {(id, d) => (
                    <Input
                      id={id}
                      aria-describedby={d}
                      value={q.question}
                      onChange={(e) => update(i, { question: e.target.value })}
                      onBlur={() => !q.field && q.question && update(i, { field: slugify(q.question) })}
                      invalid={!!errors[`q.${i}.question`]}
                      placeholder="What is your budget?"
                    />
                  )}
                </Field>
                <Field label="Save answer as" error={errors[`q.${i}.field`]}>
                  {(id, d) => (
                    <Input
                      id={id}
                      aria-describedby={d}
                      value={q.field}
                      onChange={(e) => update(i, { field: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })}
                      invalid={!!errors[`q.${i}.field`]}
                      placeholder="budget"
                      className="font-mono text-[13px]"
                    />
                  )}
                </Field>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between pl-8">
              <label className="flex items-center gap-2 text-[13px] text-ink-2">
                <Switch size="sm" checked={q.required} onChange={(v) => update(i, { required: v })} label="Required" />
                Required to qualify
              </label>
              <div className="flex gap-0.5">
                <Button variant="ghost" size="icon-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => move(i, 1)} disabled={i === qs.length - 1} aria-label="Move down">
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => set({ qualificationQuestions: qs.filter((_, j) => j !== i) })} aria-label="Remove question">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <Button icon={<Plus className="h-4 w-4" />} onClick={() => set({ qualificationQuestions: [...qs, { id: uid("q"), question: "", field: "", required: false }] })} disabled={qs.length >= 12}>
        Add question
      </Button>
      <Field label="Mark as a hot lead when…" hint="Plain words, e.g. “budget above ₹1 Cr and wants to visit this week”.">
        {(id, d) => <Textarea id={id} aria-describedby={d} rows={2} value={draft.hotLeadCriteria} maxLength={500} onChange={(e) => set({ hotLeadCriteria: e.target.value })} />}
      </Field>
    </div>
  );
}

// ----------------------------------------------------------- Step 5 ----
export function FollowUpStep({ draft, set, errors }: StepProps) {
  const f = draft.followUp;
  const setF = (patch: Partial<typeof f>) => set({ followUp: { ...f, ...patch } });
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Attempts if unreachable" error={errors.maxAttempts} hint="Total tries for busy / no-answer.">
          {(id, d) => (
            <Select id={id} aria-describedby={d} value={f.maxAttempts} onChange={(e) => setF({ maxAttempts: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "attempt" : "attempts"}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Time between attempts" error={errors.retryGapHours}>
          {(id, d) => (
            <Select id={id} aria-describedby={d} value={f.retryGapHours} onChange={(e) => setF({ retryGapHours: Number(e.target.value) })}>
              {[1, 2, 4, 8, 24, 48].map((n) => (
                <option key={n} value={n}>
                  {n < 24 ? `${n} hour${n > 1 ? "s" : ""}` : `${n / 24} day${n > 24 ? "s" : ""}`}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <div className="divide-y divide-line rounded-xl border border-line bg-surface px-4">
        <SwitchRow title="Honour callback requests" description="If the person asks to be called later, agree on a time and schedule a follow-up." checked={f.honourCallbackRequests} onChange={(v) => setF({ honourCallbackRequests: v })} />
        <SwitchRow title="Offer a WhatsApp summary" description="Offer to send a summary or brochure on WhatsApp after the call." checked={f.sendSummaryOnWhatsApp} onChange={(v) => setF({ sendSummaryOnWhatsApp: v })} />
      </div>
    </div>
  );
}

// ----------------------------------------------------------- Step 6 ----
export function ScheduleStep({ draft, set, errors }: StepProps) {
  const w = draft.workingHours;
  const setW = (patch: Partial<typeof w>) => set({ workingHours: { ...w, ...patch } });
  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="label">Working days</legend>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {WEEKDAYS.map((day, i) => {
            const on = w.days.includes(i);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={on}
                onClick={() => setW({ days: on ? w.days.filter((x) => x !== i) : [...w.days, i] })}
                className={cn("h-9 w-12 rounded-lg border text-[13px] font-medium transition-colors", on ? "border-accent bg-accent-soft text-accent-ink" : "border-line bg-surface text-ink-2 hover:border-line-strong")}
              >
                {day}
              </button>
            );
          })}
        </div>
        {errors.days && <p className="mt-1.5 text-xs text-danger" role="alert">{errors.days}</p>}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="From">{(id) => <Input id={id} type="time" value={w.start} onChange={(e) => setW({ start: e.target.value })} />}</Field>
        <Field label="To" error={errors.hours}>{(id, d) => <Input id={id} aria-describedby={d} type="time" value={w.end} onChange={(e) => setW({ end: e.target.value })} invalid={!!errors.hours} />}</Field>
        <Field label="Time zone">
          {(id) => (
            <Select id={id} value={w.timezone} onChange={(e) => setW({ timezone: e.target.value })}>
              <option value="Asia/Kolkata">India (IST)</option>
              <option value="Asia/Dubai">Gulf (GST)</option>
              <option value="Asia/Singapore">Singapore (SGT)</option>
              <option value="Europe/London">UK (GMT/BST)</option>
            </Select>
          )}
        </Field>
      </div>
      <p className="rounded-xl border border-line bg-subtle p-4 text-[13px] leading-relaxed text-ink-2">
        Outside these hours new leads wait in the queue and are called when the day starts.{" "}
        {draft.callingMode === "inbound" && "Inbound calls outside hours get a polite “we're closed” message once the backend supports it."}
      </p>
    </div>
  );
}
