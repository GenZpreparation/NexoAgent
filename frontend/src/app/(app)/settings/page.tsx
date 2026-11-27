"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FlaskConical, LogOut, Monitor, Moon, MoreHorizontal, Sun, UserPlus, Users } from "lucide-react";
import { cn, isValidEmail, titleCase } from "@/lib/utils";
import { can } from "@/lib/capabilities";
import { config, isMockMode } from "@/lib/config";
import { useAsync } from "@/hooks/useAsync";
import { workspaceService } from "@/services/workspace";
import { getScenario, setScenario, type DemoScenario } from "@/mocks/scenario";
import { useSession } from "@/components/providers/SessionProvider";
import { useTheme, type Theme } from "@/components/providers/ThemeProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardFooter, CardHeader, DetailRow } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Field";
import { SwitchRow } from "@/components/ui/Switch";
import { Tabs } from "@/components/ui/Tabs";
import { Avatar, BackendNotice, NeedsBackend, PageHeader } from "@/components/ui/Misc";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { MenuItem, Popover } from "@/components/ui/Popover";
import { useToast } from "@/components/ui/Toast";

const TABS = ["profile", "workspace", "team", "preferences", "notifications", "security"] as const;
type Tab = (typeof TABS)[number];

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsInner />
    </Suspense>
  );
}

function SettingsInner() {
  const params = useSearchParams();
  const router = useRouter();
  const raw = params.get("tab");
  const tab: Tab = (TABS as readonly string[]).includes(raw ?? "") ? (raw as Tab) : "profile";

  return (
    <>
      <PageHeader title="Settings" description="Your profile, workspace, team and preferences." />
      <Tabs className="mb-6" ariaLabel="Settings sections" value={tab} onChange={(t) => router.replace(`/settings?tab=${t}`)} items={TABS.map((t) => ({ value: t, label: titleCase(t) }))} />
      <div className="max-w-3xl">
        {tab === "profile" && <Profile />}
        {tab === "workspace" && <WorkspaceTab />}
        {tab === "team" && <Team />}
        {tab === "preferences" && <Preferences />}
        {tab === "notifications" && <Notifications />}
        {tab === "security" && <Security />}
      </div>
    </>
  );
}

function Profile() {
  const { session } = useSession();
  const editable = can("settings.profileUpdate");
  return (
    <Card>
      <CardHeader title="Profile" description="How you appear to your team." action={!editable ? <NeedsBackend what="Editing your profile" /> : undefined} />
      <CardBody className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar name={session?.user.name ?? "?"} size="lg" />
          <div>
            <p className="text-sm font-semibold text-ink">{session?.user.name}</p>
            <p className="text-[13px] text-ink-2">{titleCase(session?.user.role ?? "")}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">{(id) => <Input id={id} defaultValue={session?.user.name} disabled={!editable} />}</Field>
          <Field label="Email">{(id) => <Input id={id} type="email" defaultValue={session?.user.email} disabled={!editable} />}</Field>
        </div>
      </CardBody>
      {editable && (
        <CardFooter>
          <Button variant="primary">Save</Button>
        </CardFooter>
      )}
    </Card>
  );
}

function WorkspaceTab() {
  const { session } = useSession();
  return (
    <Card>
      <CardHeader title="Workspace" description="Your organisation on NexoAgent." action={!can("settings.workspaceUpdate") ? <NeedsBackend what="Renaming the workspace" /> : undefined} />
      <CardBody className="space-y-4">
        <Field label="Workspace name">{(id) => <Input id={id} defaultValue={session?.workspace.name} disabled={!can("settings.workspaceUpdate")} />}</Field>
        <dl className="divide-y divide-line">
          <DetailRow label="Workspace ID"><span className="font-mono text-xs">{session?.workspace.id}</span></DetailRow>
          <DetailRow label="Slug"><span className="font-mono text-xs">{session?.workspace.slug}</span></DetailRow>
          <DetailRow label="Default time zone">Asia/Kolkata</DetailRow>
        </dl>
      </CardBody>
    </Card>
  );
}

const ROLES = [
  { value: "admin", label: "Admin", hint: "Full access including billing and API keys" },
  { value: "manager", label: "Manager", hint: "Manage employees, campaigns and leads" },
  { value: "member", label: "Member", hint: "View results and conversations" },
];

function Team() {
  const toast = useToast();
  const { session } = useSession();
  const members = useAsync(() => workspaceService.members(), "members");
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<{ id: string; name: string } | null>(null);

  async function update(id: string, patch: { role?: string; active?: boolean }) {
    try {
      const m = await workspaceService.updateMember(id, patch);
      members.setData((xs) => (xs ?? []).map((x) => (x.id === id ? m : x)));
      toast.success("Member updated");
    } catch (err) {
      toast.fromError(err, "Couldn't update member");
    }
  }

  return (
    <Card>
      <CardHeader title="Team members" description="People who can sign in to this workspace." action={<Button size="sm" variant="primary" icon={<UserPlus className="h-4 w-4" />} onClick={() => setInviting(true)}>Add member</Button>} />
      <div className="mt-3">
        {members.error ? (
          <ErrorState compact error={members.error} onRetry={members.refetch} />
        ) : !members.data ? (
          <SkeletonRows rows={3} />
        ) : members.data.length === 0 ? (
          <EmptyState compact icon={<Users />} title="Just you so far" description="Add teammates so they can review leads and conversations." />
        ) : (
          <ul className="divide-y divide-line">
            {members.data.map((m) => {
              const self = m.email === session?.user.email;
              return (
                <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={m.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-[13px] font-medium text-ink">
                      {m.name} {self && <span className="text-xs font-normal text-ink-3">(you)</span>}
                      {!m.active && <Badge>Deactivated</Badge>}
                    </p>
                    <p className="truncate text-xs text-ink-3">{m.email}</p>
                  </div>
                  <Badge tone={m.role === "admin" ? "accent" : "neutral"}>{titleCase(m.role)}</Badge>
                  {!self && (
                    <Popover
                      align="end"
                      className="w-52"
                      trigger={({ toggle, open }) => (
                        <Button variant="ghost" size="icon-sm" onClick={toggle} aria-expanded={open} aria-label={`Manage ${m.name}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      )}
                    >
                      {(close) => (
                        <div role="menu">
                          {ROLES.filter((r) => r.value !== m.role).map((r) => (
                            <MenuItem key={r.value} onSelect={() => { close(); update(m.id, { role: r.value }); }}>Make {r.label.toLowerCase()}</MenuItem>
                          ))}
                          <MenuItem onSelect={() => { close(); update(m.id, { active: !m.active }); }}>{m.active ? "Deactivate" : "Reactivate"}</MenuItem>
                          <MenuItem danger onSelect={() => { close(); setRemoving({ id: m.id, name: m.name }); }}>Remove from workspace</MenuItem>
                        </div>
                      )}
                    </Popover>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <InviteDialog open={inviting} onClose={() => setInviting(false)} onAdded={(m) => members.setData((xs) => [...(xs ?? []), m])} />
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        tone="danger"
        title={`Remove ${removing?.name ?? "member"}?`}
        description="They will lose access to this workspace immediately."
        confirmLabel="Remove"
        onConfirm={async () => {
          if (!removing) return;
          try {
            await workspaceService.removeMember(removing.id);
            members.setData((xs) => (xs ?? []).filter((x) => x.id !== removing.id));
            toast.success("Member removed");
          } catch (err) {
            toast.fromError(err, "Couldn't remove member");
          }
          setRemoving(null);
        }}
      />
    </Card>
  );
}

function InviteDialog({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: (m: Awaited<ReturnType<typeof workspaceService.invite>>) => void }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "manager" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const close = () => {
    setForm({ name: "", email: "", password: "", role: "manager" });
    setErrors({});
    onClose();
  };

  async function submit() {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Enter their name.";
    if (!isValidEmail(form.email)) e.email = "Enter a valid email.";
    if (form.password.length < 6) e.password = "At least 6 characters.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const m = await workspaceService.invite({ ...form, name: form.name.trim(), email: form.email.trim() });
      onAdded(m);
      toast.success(`${m.name} added`, "Share the temporary password with them securely.");
      close();
    } catch (err) {
      toast.fromError(err, "Couldn't add member");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Add a team member"
      description="Creates an account in this workspace with a temporary password."
      footer={
        <>
          <Button onClick={close}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={submit}>Add member</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Full name" error={errors.name}>{(id, d) => <Input id={id} aria-describedby={d} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} invalid={!!errors.name} data-autofocus />}</Field>
        <Field label="Email" error={errors.email}>{(id, d) => <Input id={id} aria-describedby={d} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} invalid={!!errors.email} />}</Field>
        <Field label="Temporary password" error={errors.password} hint="They should change it after first sign-in (password change needs backend support).">
          {(id, d) => <Input id={id} aria-describedby={d} type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} invalid={!!errors.password} />}
        </Field>
        <Field label="Role" hint={ROLES.find((r) => r.value === form.role)?.hint}>
          {(id, d) => (
            <Select id={id} aria-describedby={d} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Select>
          )}
        </Field>
      </div>
    </Dialog>
  );
}

function Preferences() {
  const { theme, setTheme } = useTheme();
  const [scenario, setScenarioState] = useState<DemoScenario>("populated");
  useEffect(() => {
    const s = getScenario();
    Promise.resolve().then(() => setScenarioState(s));
  }, []);
  const themes: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Appearance" description="Saved in this browser." />
        <CardBody>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
            {themes.map((t) => (
              <button key={t.value} type="button" role="radio" aria-checked={theme === t.value} onClick={() => setTheme(t.value)} className={cn("flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-[13px] font-medium transition-colors", theme === t.value ? "border-accent text-ink ring-2 ring-accent/15" : "border-line text-ink-2 hover:border-line-strong")}>
                <t.icon className="h-5 w-5" aria-hidden />
                {t.label}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Data source" description="Where this app reads and writes data." />
        <CardBody className="space-y-4">
          <dl className="divide-y divide-line">
            <DetailRow label="Mode">{isMockMode ? <Badge tone="warning" icon={<FlaskConical className="h-3 w-3" />}>Demo data</Badge> : <Badge tone="success">Backend API</Badge>}</DetailRow>
            <DetailRow label="API base URL"><span className="font-mono text-xs">{config.apiBaseUrl}</span></DetailRow>
          </dl>
          {isMockMode && (
            <Field label="Demo scenario" hint="Preview how pages look with data, for a brand-new workspace, or when the backend is unreachable. Reloads the page.">
              {(id, d) => (
                <Select
                  id={id}
                  aria-describedby={d}
                  value={scenario}
                  onChange={(e) => {
                    setScenario(e.target.value as DemoScenario);
                    window.location.reload();
                  }}
                >
                  <option value="populated">Populated workspace</option>
                  <option value="empty">Empty workspace</option>
                  <option value="error">Backend unreachable (errors)</option>
                </Select>
              )}
            </Field>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

const NOTIFY_KEY = "nexo.notify.prefs"; // non-sensitive UI preference, this device only

const NOTIFY_ITEMS = [
  { key: "hotLead", title: "Hot lead captured", description: "When an AI employee marks a lead as hot." },
  { key: "callback", title: "Callback requested", description: "When someone asks to be called back." },
  { key: "lowBalance", title: "Low balance", description: "When credits are about to run out." },
  { key: "sourceError", title: "Lead source problems", description: "When a connected source stops sending leads." },
  { key: "weekly", title: "Weekly summary", description: "A Monday email with last week's results." },
] as const;

function Notifications() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({ hotLead: true, callback: true, lowBalance: true, sourceError: true, weekly: false });
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(NOTIFY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, boolean>;
        Promise.resolve().then(() => setPrefs((p) => ({ ...p, ...parsed })));
      }
    } catch {
      /* ignore */
    }
  }, []);
  function toggle(key: string, v: boolean) {
    const next = { ...prefs, [key]: v };
    setPrefs(next);
    try {
      window.localStorage.setItem(NOTIFY_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }
  return (
    <Card>
      <CardHeader title="Email notifications" description="Choose what you want to hear about." />
      <CardBody>
        {!can("settings.notificationsSync") && (
          <BackendNotice title="Saved on this device only" className="mb-2">
            Sending notifications and syncing these choices to your account need backend support.
          </BackendNotice>
        )}
        <div className="divide-y divide-line">
          {NOTIFY_ITEMS.map((n) => (
            <SwitchRow key={n.key} title={n.title} description={n.description} checked={!!prefs[n.key]} onChange={(v) => toggle(n.key, v)} />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function Security() {
  const { signOut } = useSession();
  const editable = can("settings.passwordChange");
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Password" action={!editable ? <NeedsBackend what="Changing your password" /> : undefined} />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Current password">{(id) => <Input id={id} type="password" autoComplete="current-password" disabled={!editable} />}</Field>
          <div className="hidden sm:block" />
          <Field label="New password">{(id) => <Input id={id} type="password" autoComplete="new-password" disabled={!editable} />}</Field>
          <Field label="Confirm new password">{(id) => <Input id={id} type="password" autoComplete="new-password" disabled={!editable} />}</Field>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Session" description="How you're signed in on this device." />
        <CardBody className="space-y-3 text-[13px] text-ink-2">
          <p>
            {isMockMode
              ? "Demo mode doesn't use credentials."
              : "Your sign-in token is kept for this browser tab only and is cleared when the tab closes. It is never written to cookies or long-term storage by the app."}
          </p>
          <Button variant="outline-danger" icon={<LogOut className="h-4 w-4" />} onClick={signOut}>
            {isMockMode ? "Exit demo" : "Sign out"}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
