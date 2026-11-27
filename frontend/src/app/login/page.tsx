"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, FlaskConical } from "lucide-react";
import { isMockMode } from "@/lib/config";
import { isValidEmail } from "@/lib/utils";
import { toApiError } from "@/lib/api/errors";
import { authService } from "@/services/auth";
import { useSession } from "@/components/providers/SessionProvider";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Tabs";
import { Logo } from "@/components/layout/Logo";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

/** Only allow same-site relative redirects after sign-in (prevents open redirects). */
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setSession } = useSession();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [form, setForm] = useState({ email: "", password: "", fullName: "", company: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const e: Record<string, string> = {};
    if (!isValidEmail(form.email)) e.email = "Enter a valid email address.";
    if (form.password.length < 6) e.password = "Password must be at least 6 characters.";
    if (mode === "register") {
      if (form.fullName.trim().length < 2) e.fullName = "Enter your name.";
      if (form.company.trim().length < 2) e.company = "Enter your company name.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const session =
        mode === "signin"
          ? await authService.login({ email: form.email.trim(), password: form.password })
          : await authService.register({ email: form.email.trim(), password: form.password, full_name: form.fullName.trim(), company_name: form.company.trim() });
      setSession(session);
      router.replace(safeNext(params.get("next")));
    } catch (err) {
      setFormError(toApiError(err).message);
    } finally {
      setLoading(false);
    }
  }

  async function enterDemo() {
    setLoading(true);
    const s = await authService.me();
    setSession(s);
    router.replace(safeNext(params.get("next")));
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="card p-6">
          {isMockMode ? (
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-warning-soft text-warning">
                <FlaskConical className="h-5 w-5" />
              </div>
              <h1 className="text-base font-semibold text-ink">Demo mode</h1>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
                This build uses demo data generated in your browser, so no sign-in is needed. Set <code className="rounded bg-muted px-1 font-mono text-xs">NEXT_PUBLIC_DATA_MODE=api</code> to sign in against the backend.
              </p>
              <Button variant="primary" className="mt-5 w-full" onClick={enterDemo} loading={loading} icon={<ArrowRight className="h-4 w-4" />}>
                Continue to demo
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-base font-semibold text-ink">{mode === "signin" ? "Sign in to NexoAgent" : "Create your workspace"}</h1>
              <p className="mt-1 text-[13px] text-ink-2">{mode === "signin" ? "Welcome back." : "Set up a workspace for your team."}</p>
              <Segmented
                className="mt-4 w-full [&>button]:flex-1 [&>button]:justify-center"
                ariaLabel="Account action"
                value={mode}
                onChange={(m) => {
                  setMode(m);
                  setErrors({});
                  setFormError(null);
                }}
                items={[
                  { value: "signin", label: "Sign in" },
                  { value: "register", label: "Register" },
                ]}
              />
              <form onSubmit={onSubmit} noValidate className="mt-5 space-y-3.5">
                {mode === "register" && (
                  <>
                    <Field label="Your name" error={errors.fullName}>
                      {(id, d) => <Input id={id} aria-describedby={d} autoComplete="name" value={form.fullName} onChange={set("fullName")} invalid={!!errors.fullName} />}
                    </Field>
                    <Field label="Company" error={errors.company}>
                      {(id, d) => <Input id={id} aria-describedby={d} autoComplete="organization" value={form.company} onChange={set("company")} invalid={!!errors.company} />}
                    </Field>
                  </>
                )}
                <Field label="Work email" error={errors.email}>
                  {(id, d) => <Input id={id} aria-describedby={d} type="email" autoComplete="email" value={form.email} onChange={set("email")} invalid={!!errors.email} />}
                </Field>
                <Field label="Password" error={errors.password}>
                  {(id, d) => (
                    <Input id={id} aria-describedby={d} type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={form.password} onChange={set("password")} invalid={!!errors.password} />
                  )}
                </Field>
                {formError && (
                  <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger">
                    {formError}
                  </p>
                )}
                <Button type="submit" variant="primary" className="w-full" loading={loading}>
                  {mode === "signin" ? "Sign in" : "Create workspace"}
                </Button>
              </form>
            </>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-ink-3">AI employees that call, qualify and follow up with your leads.</p>
      </div>
    </div>
  );
}
