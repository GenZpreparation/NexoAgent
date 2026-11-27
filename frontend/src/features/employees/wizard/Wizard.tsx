"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Pencil, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CALLING_MODES, WEEKDAYS, languageLabel } from "@/lib/labels";
import { can } from "@/lib/capabilities";
import { isMockMode } from "@/lib/config";
import { useAsync } from "@/hooks/useAsync";
import { employeesService } from "@/services/employees";
import type { EmployeeDraft } from "@/types/domain";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { BackendNotice } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { compileSystemPrompt } from "../prompt";
import { getTemplate } from "../templates";
import { applyTemplate, emptyDraft, firstInvalidStep, STEPS, suggestVoice, validateStep, type DraftErrors } from "./draft";
import { ConversationStep, DescribeStep, FollowUpStep, IdentityStep, QualificationStep, ScheduleStep } from "./Steps";

export function HireWizard({ initialTemplate }: { initialTemplate: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const [draft, setDraft] = useState<EmployeeDraft>(() => {
    const t = getTemplate(initialTemplate);
    return t ? applyTemplate(emptyDraft(), t) : emptyDraft();
  });
  const [step, setStep] = useState(0);
  const [maxVisited, setMaxVisited] = useState(0);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [dirty, setDirty] = useState(!!initialTemplate);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [creating, setCreating] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const voices = useAsync(() => employeesService.voices(), "voices");

  // Pick a matching voice automatically when none is chosen (language change resets it).
  useEffect(() => {
    if (!draft.voiceId && voices.data?.length) {
      const id = suggestVoice(voices.data, draft.language);
      Promise.resolve().then(() => setDraft((d) => (d.voiceId ? d : { ...d, voiceId: id })));
    }
  }, [draft.voiceId, draft.language, voices.data]);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const current = STEPS[step];
  const set = (patch: Partial<EmployeeDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
    if (Object.keys(errors).length) setErrors({});
  };

  function goTo(i: number) {
    setStep(i);
    setMaxVisited((m) => Math.max(m, i));
    setErrors({});
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function next() {
    const e = validateStep(current.key, draft);
    setErrors(e);
    if (Object.keys(e).length) return;
    goTo(Math.min(step + 1, STEPS.length - 1));
  }

  function onTemplate(id: string) {
    const t = getTemplate(id);
    if (!t) return;
    setDraft((d) => applyTemplate(d, t));
    setDirty(true);
    setErrors({});
    toast.info(`“${t.title}” template applied`, "Every step is prefilled — review and adjust.");
  }

  async function create() {
    const bad = firstInvalidStep(draft);
    if (bad !== -1 && bad !== STEPS.length - 1) {
      goTo(bad);
      setErrors(validateStep(STEPS[bad].key, draft));
      return;
    }
    setCreating(true);
    try {
      const e = await employeesService.create(draft);
      setDirty(false);
      toast.success(`${e.name} has joined your team`, isMockMode ? "Created in demo data only." : "Saved to your workspace.");
      router.push(`/employees/${e.id}`);
    } catch (err) {
      toast.fromError(err, "Couldn't create the AI employee");
      setCreating(false);
    }
  }

  function cancel() {
    if (dirty) setConfirmCancel(true);
    else router.push("/employees");
  }

  return (
    <div ref={topRef} className="scroll-mt-20">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-accent">
            Step {step + 1} of {STEPS.length}
          </p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-ink">{step === 0 ? "Hire an AI employee" : current.title}</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={cancel} icon={<X className="h-4 w-4" />}>
          Cancel
        </Button>
      </div>

      {/* Mobile progress */}
      <div className="mb-5 lg:hidden" aria-hidden>
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <span key={s.key} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-accent" : "bg-muted")} />
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
        <nav aria-label="Wizard steps" className="hidden lg:block">
          <ol className="sticky top-20 space-y-0.5">
            {STEPS.map((s, i) => {
              const reachable = i <= maxVisited;
              const done = i < step || (i <= maxVisited && i !== step && Object.keys(validateStep(s.key, draft)).length === 0);
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    disabled={!reachable}
                    onClick={() => goTo(i)}
                    aria-current={i === step ? "step" : undefined}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors disabled:cursor-not-allowed",
                      i === step ? "bg-surface text-ink shadow-card ring-1 ring-line" : reachable ? "text-ink-2 hover:bg-muted hover:text-ink" : "text-ink-3",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-2xs font-semibold",
                        i === step ? "bg-accent text-white" : done ? "bg-accent-soft text-accent-ink" : "border border-line-strong text-ink-3",
                      )}
                    >
                      {done && i !== step ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    {s.title}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="min-w-0">
          <div className={cn(step === 0 ? "" : "card p-5 sm:p-6")}>
            {current.key === "describe" && <DescribeStep draft={draft} set={set} errors={errors} onTemplate={onTemplate} />}
            {current.key === "identity" && <IdentityStep draft={draft} set={set} errors={errors} voices={voices.data} voicesError={voices.error?.message ?? null} />}
            {current.key === "conversation" && <ConversationStep draft={draft} set={set} errors={errors} />}
            {current.key === "qualification" && <QualificationStep draft={draft} set={set} errors={errors} />}
            {current.key === "followups" && <FollowUpStep draft={draft} set={set} errors={errors} />}
            {current.key === "schedule" && <ScheduleStep draft={draft} set={set} errors={errors} />}
            {current.key === "review" && <ReviewStep draft={draft} voiceName={voices.data?.find((v) => v.id === draft.voiceId)?.name} onEdit={goTo} />}
          </div>

          {Object.keys(errors).length > 0 && (
            <p className="mt-3 text-[13px] text-danger" role="alert">
              Please fix the highlighted fields to continue.
            </p>
          )}

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
            <Button onClick={() => (step === 0 ? cancel() : goTo(step - 1))} icon={<ArrowLeft className="h-4 w-4" />}>
              {step === 0 ? "Cancel" : "Back"}
            </Button>
            {current.key === "review" ? (
              <Button variant="primary" size="lg" onClick={create} loading={creating} icon={<Sparkles className="h-4 w-4" />}>
                Create AI employee
              </Button>
            ) : (
              <Button variant="primary" onClick={next}>
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => {
          setDirty(false);
          router.push("/employees");
        }}
        tone="danger"
        title="Discard this AI employee?"
        description="Your setup hasn't been saved. If you leave now, the changes will be lost."
        confirmLabel="Discard"
      />
    </div>
  );
}

function ReviewSection({ title, step, onEdit, children }: { title: string; step: number; onEdit: (i: number) => void; children: React.ReactNode }) {
  return (
    <section className="border-b border-line py-4 first:pt-0 last:border-0">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
        <button type="button" onClick={() => onEdit(step)} className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
          <Pencil className="h-3 w-3" /> Edit
        </button>
      </div>
      <div className="text-[13px] leading-relaxed text-ink-2">{children}</div>
    </section>
  );
}

function ReviewStep({ draft, voiceName, onEdit }: { draft: EmployeeDraft; voiceName?: string; onEdit: (i: number) => void }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const prompt = useMemo(() => compileSystemPrompt(draft), [draft]);
  const qs = draft.qualificationQuestions.filter((q) => q.question.trim());
  return (
    <div>
      {!can("employees.structuredConfig") && (
        <BackendNotice title="Some settings are saved inside the instructions for now" className="mb-5">
          The backend stores name, voice, language, opening line and instructions. Calling mode, questions, follow-ups and hours are compiled into the instructions below until the backend stores them as separate fields.
        </BackendNotice>
      )}
      <ReviewSection title="Job" step={0} onEdit={onEdit}>
        <p className="text-ink">{draft.description}</p>
        <p className="mt-1.5">
          {languageLabel(draft.language)} · {draft.naturalSpeech ? "Natural speech" : "Formal speech"} · {draft.callingMode ? `${CALLING_MODES[draft.callingMode].label} calling` : "No mode"}
        </p>
      </ReviewSection>
      <ReviewSection title="Name & voice" step={1} onEdit={onEdit}>
        <p>
          <span className="font-medium text-ink">{draft.name}</span>
          {draft.role && ` · ${draft.role}`} · Voice: {voiceName ?? draft.voiceId}
        </p>
        <p className="mt-1 italic">“{draft.firstMessage}”</p>
      </ReviewSection>
      <ReviewSection title="Conversation" step={2} onEdit={onEdit}>
        <p className="capitalize">{draft.tone} tone</p>
        {draft.instructions ? <p className="mt-1 line-clamp-3 whitespace-pre-line">{draft.instructions}</p> : <p className="mt-1 text-ink-3">No extra instructions.</p>}
      </ReviewSection>
      <ReviewSection title="Qualification" step={3} onEdit={onEdit}>
        {qs.length ? (
          <ol className="list-decimal space-y-0.5 pl-4">
            {qs.map((q) => (
              <li key={q.id}>
                {q.question} <span className="font-mono text-xs text-ink-3">→ {q.field}</span>
                {q.required && <span className="ml-1 text-xs text-ink-3">(required)</span>}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-ink-3">No qualification questions.</p>
        )}
        {draft.hotLeadCriteria && <p className="mt-1.5">Hot lead when: {draft.hotLeadCriteria}</p>}
      </ReviewSection>
      <ReviewSection title="Follow-ups" step={4} onEdit={onEdit}>
        Up to {draft.followUp.maxAttempts} attempts, {draft.followUp.retryGapHours}h apart · Callbacks {draft.followUp.honourCallbackRequests ? "on" : "off"} · WhatsApp summary {draft.followUp.sendSummaryOnWhatsApp ? "on" : "off"}
      </ReviewSection>
      <ReviewSection title="Working hours" step={5} onEdit={onEdit}>
        {draft.workingHours.days.slice().sort().map((d) => WEEKDAYS[d]).join(", ")} · {draft.workingHours.start}–{draft.workingHours.end} ({draft.workingHours.timezone})
      </ReviewSection>

      <div className="mt-4 rounded-xl border border-line">
        <button type="button" onClick={() => setShowPrompt((v) => !v)} aria-expanded={showPrompt} className="flex w-full items-center justify-between px-4 py-3 text-[13px] font-medium text-ink">
          Preview compiled instructions
          <ChevronDown className={cn("h-4 w-4 text-ink-3 transition-transform", showPrompt && "rotate-180")} />
        </button>
        {showPrompt && <pre className="max-h-80 overflow-auto whitespace-pre-wrap border-t border-line bg-subtle px-4 py-3 font-mono text-xs leading-relaxed text-ink-2">{prompt}</pre>}
      </div>
    </div>
  );
}
