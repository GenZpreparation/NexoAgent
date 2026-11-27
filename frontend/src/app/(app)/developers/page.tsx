"use client";

import { useState } from "react";
import { BarChart3, Check, Copy, Eye, EyeOff, KeyRound, Plus, Send, Trash2, Webhook as WebhookIcon } from "lucide-react";
import { cn, formatDate, formatRelative, isValidHttpsUrl } from "@/lib/utils";
import { canReal } from "@/lib/capabilities";
import { isMockMode } from "@/lib/config";
import { WEBHOOK_EVENTS } from "@/lib/labels";
import { useAsync } from "@/hooks/useAsync";
import { developersService } from "@/services/developers";
import type { ApiKey, Webhook } from "@/types/domain";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { Tabs } from "@/components/ui/Tabs";
import { BackendNotice, PageHeader } from "@/components/ui/Misc";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/States";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";

type Tab = "keys" | "webhooks" | "docs" | "usage";

export default function DevelopersPage() {
  const [tab, setTab] = useState<Tab>("keys");
  return (
    <>
      <PageHeader title="Developers" description="Connect NexoAgent to your CRM, website or internal tools." />
      {isMockMode && (
        <BackendNotice className="mb-5" title="Credentials are never simulated">
          Demo mode doesn&apos;t create API keys or webhook secrets. Run the app against the backend (NEXT_PUBLIC_DATA_MODE=api) to manage real credentials.
        </BackendNotice>
      )}
      <Tabs className="mb-5" ariaLabel="Developer sections" value={tab} onChange={setTab} items={[{ value: "keys", label: "API keys" }, { value: "webhooks", label: "Webhooks" }, { value: "docs", label: "Quickstart" }, { value: "usage", label: "Usage" }]} />
      {tab === "keys" && <ApiKeys />}
      {tab === "webhooks" && <Webhooks />}
      {tab === "docs" && <Docs />}
      {tab === "usage" && (
        <Card>
          <EmptyState icon={<BarChart3 />} title="API usage isn't available yet" description="Request counts and errors per key need a backend usage endpoint. See the frontend–backend contract." />
        </Card>
      )}
    </>
  );
}

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const toast = useToast();
  const [done, setDone] = useState(false);
  return (
    <Button
      size="sm"
      icon={done ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          toast.error("Couldn't copy", "Your browser blocked clipboard access — select and copy manually.");
        }
      }}
    >
      {done ? "Copied" : label}
    </Button>
  );
}

function ApiKeys() {
  const toast = useToast();
  const enabled = canReal("developers.apiKeys");
  const keys = useAsync(() => developersService.apiKeys(), "api-keys");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [secret, setSecret] = useState<{ name: string; value: string } | null>(null);
  const [revoke, setRevoke] = useState<ApiKey | null>(null);

  async function create() {
    if (name.trim().length < 2) return setNameError("Give the key a name (2+ characters).");
    setSaving(true);
    try {
      const r = await developersService.createApiKey(name.trim());
      keys.setData((xs) => [r.key, ...(xs ?? [])]);
      setCreating(false);
      setName("");
      setSecret({ name: r.key.name, value: r.secret }); // held in component state only, never persisted
    } catch (err) {
      toast.fromError(err, "Couldn't create key");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader title="API keys" description="Authenticate server-to-server requests with the X-API-Key header. Keep keys secret — never use them in browser code." action={<Button size="sm" variant="primary" icon={<Plus className="h-4 w-4" />} disabled={!enabled} onClick={() => setCreating(true)}>Create key</Button>} />
      <div className="mt-3">
        {keys.error ? (
          <ErrorState compact error={keys.error} onRetry={keys.refetch} />
        ) : !keys.data ? (
          <SkeletonRows rows={2} />
        ) : keys.data.length === 0 ? (
          <EmptyState compact icon={<KeyRound />} title="No API keys" description={enabled ? "Create a key to call the NexoAgent API from your systems." : "API keys can be created when the app is connected to the backend."} />
        ) : (
          <ul className="divide-y divide-line">
            {keys.data.map((k) => (
              <li key={k.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <KeyRound className="h-4 w-4 text-ink-3" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
                    {k.name} {!k.active && <Badge>Revoked</Badge>}
                  </p>
                  <p className="text-xs text-ink-3">
                    <span className="font-mono">{k.prefix}</span> · created {formatDate(k.createdAt)} · {k.lastUsedAt ? `last used ${formatRelative(k.lastUsedAt)}` : "never used"}
                  </p>
                </div>
                {k.active && <Button size="sm" variant="outline-danger" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setRevoke(k)}>Revoke</Button>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog
        open={creating}
        onClose={() => { setCreating(false); setName(""); setNameError(undefined); }}
        title="Create API key"
        size="sm"
        footer={
          <>
            <Button onClick={() => setCreating(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={create}>Create</Button>
          </>
        }
      >
        <Field label="Key name" error={nameError} hint="e.g. “HubSpot integration”. Only admins can create keys.">
          {(id, d) => <Input id={id} aria-describedby={d} value={name} maxLength={100} onChange={(e) => { setName(e.target.value); setNameError(undefined); }} invalid={!!nameError} data-autofocus />}
        </Field>
      </Dialog>

      <Dialog
        open={!!secret}
        onClose={() => setSecret(null)}
        title="Copy your new API key"
        description="This is the only time the full key is shown. Store it in your secrets manager."
        footer={<Button variant="primary" onClick={() => setSecret(null)}>I&apos;ve stored it safely</Button>}
      >
        {secret && (
          <div className="space-y-3">
            <p className="text-[13px] text-ink-2">{secret.name}</p>
            <div className="flex items-center gap-2 rounded-lg border border-line bg-subtle p-2">
              <code className="min-w-0 flex-1 break-all px-1 font-mono text-xs text-ink">{secret.value}</code>
              <CopyButton value={secret.value} />
            </div>
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={!!revoke}
        onClose={() => setRevoke(null)}
        tone="danger"
        title={`Revoke “${revoke?.name ?? ""}”?`}
        description="Requests using this key will fail immediately. This can't be undone."
        confirmLabel="Revoke key"
        onConfirm={async () => {
          if (!revoke) return;
          try {
            await developersService.revokeApiKey(revoke.id);
            keys.setData((xs) => (xs ?? []).filter((x) => x.id !== revoke.id));
            toast.success("Key revoked");
          } catch (err) {
            toast.fromError(err, "Couldn't revoke key");
          }
          setRevoke(null);
        }}
      />
    </Card>
  );
}

function Webhooks() {
  const toast = useToast();
  const enabled = canReal("developers.webhooks");
  const hooks = useAsync(() => developersService.webhooks(), "webhooks");
  const [creating, setCreating] = useState(false);
  const [remove, setRemove] = useState<Webhook | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<string | null>(null);

  async function test(id: string) {
    setTesting(id);
    try {
      toast.info("Test event", await developersService.testWebhook(id));
    } catch (err) {
      toast.fromError(err, "Test failed");
    } finally {
      setTesting(null);
    }
  }

  return (
    <Card>
      <CardHeader title="Webhooks" description="NexoAgent sends a signed POST to your URL when events happen. Verify the HMAC-SHA256 signature with the endpoint's secret." action={<Button size="sm" variant="primary" icon={<Plus className="h-4 w-4" />} disabled={!enabled} onClick={() => setCreating(true)}>Add endpoint</Button>} />
      <div className="mt-3">
        {hooks.error ? (
          <ErrorState compact error={hooks.error} onRetry={hooks.refetch} />
        ) : !hooks.data ? (
          <SkeletonRows rows={2} />
        ) : hooks.data.length === 0 ? (
          <EmptyState compact icon={<WebhookIcon />} title="No webhook endpoints" description={enabled ? "Add an endpoint to receive call and lead events in your CRM." : "Webhooks can be managed when the app is connected to the backend."} />
        ) : (
          <ul className="divide-y divide-line">
            {hooks.data.map((h) => (
              <li key={h.id} className="space-y-2 px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-ink">{h.url}</code>
                  <Button size="sm" icon={<Send className="h-3.5 w-3.5" />} loading={testing === h.id} onClick={() => test(h.id)}>Send test</Button>
                  <Button size="sm" variant="outline-danger" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setRemove(h)}>Delete</Button>
                </div>
                {h.description && <p className="text-[13px] text-ink-2">{h.description}</p>}
                <div className="flex flex-wrap items-center gap-1.5">
                  {h.events.map((e) => <Badge key={e} tone="accent">{e}</Badge>)}
                </div>
                <div className="flex items-center gap-2 text-xs text-ink-3">
                  Signing secret:
                  <code className="font-mono text-ink-2">{revealed[h.id] ? h.secret : `${h.secret.slice(0, 6)}${"•".repeat(16)}`}</code>
                  <button type="button" className="rounded p-0.5 hover:text-ink" onClick={() => setRevealed((r) => ({ ...r, [h.id]: !r[h.id] }))} aria-label={revealed[h.id] ? "Hide secret" : "Reveal secret"}>
                    {revealed[h.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <WebhookDialog open={creating} onClose={() => setCreating(false)} onCreated={(w) => hooks.setData((xs) => [...(xs ?? []), w])} />
      <ConfirmDialog
        open={!!remove}
        onClose={() => setRemove(null)}
        tone="danger"
        title="Delete this endpoint?"
        description="Events will stop being sent to this URL."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!remove) return;
          try {
            await developersService.deleteWebhook(remove.id);
            hooks.setData((xs) => (xs ?? []).filter((x) => x.id !== remove.id));
            toast.success("Endpoint deleted");
          } catch (err) {
            toast.fromError(err, "Couldn't delete endpoint");
          }
          setRemove(null);
        }}
      />
    </Card>
  );
}

function WebhookDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (w: Webhook) => void }) {
  const toast = useToast();
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [events, setEvents] = useState<string[]>(["call.completed", "lead.qualified"]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const close = () => {
    setUrl("");
    setDescription("");
    setEvents(["call.completed", "lead.qualified"]);
    setErrors({});
    onClose();
  };

  async function submit() {
    const e: Record<string, string> = {};
    if (!isValidHttpsUrl(url.trim())) e.url = "Use an https:// URL (http is allowed only for localhost).";
    if (!events.length) e.events = "Select at least one event.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      onCreated(await developersService.createWebhook({ url: url.trim(), description: description.trim(), events }));
      toast.success("Endpoint added");
      close();
    } catch (err) {
      toast.fromError(err, "Couldn't add endpoint");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={close} title="Add webhook endpoint" footer={<><Button onClick={close}>Cancel</Button><Button variant="primary" loading={saving} onClick={submit}>Add endpoint</Button></>}>
      <div className="space-y-4">
        <Field label="Endpoint URL" error={errors.url}>{(id, d) => <Input id={id} aria-describedby={d} type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://crm.example.com/hooks/nexoagent" invalid={!!errors.url} className="font-mono text-[13px]" data-autofocus />}</Field>
        <Field label="Description">{(id) => <Input id={id} value={description} maxLength={120} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. HubSpot lead pipeline" />}</Field>
        <fieldset>
          <legend className="label">Events</legend>
          <div className="mt-1.5 space-y-1.5">
            {WEBHOOK_EVENTS.map((ev) => (
              <label key={ev.id} className="flex items-center gap-2.5 text-[13px] text-ink">
                <input type="checkbox" className="h-4 w-4 rounded border-line-strong accent-[rgb(var(--accent))]" checked={events.includes(ev.id)} onChange={(e) => setEvents((xs) => (e.target.checked ? [...xs, ev.id] : xs.filter((x) => x !== ev.id)))} />
                <span>{ev.label}</span>
                <code className="font-mono text-xs text-ink-3">{ev.id}</code>
              </label>
            ))}
          </div>
          {errors.events && <p className="mt-1 text-xs text-danger">{errors.events}</p>}
        </fieldset>
      </div>
    </Dialog>
  );
}

const ENDPOINTS: [string, string, string][] = [
  ["GET", "/api/v1/me", "Who am I — user, workspace and credits"],
  ["POST", "/api/v1/calls", "Place a single outbound call (supports Idempotency-Key, dry_run)"],
  ["GET", "/api/v1/calls", "List calls with summaries and transcripts"],
  ["GET", "/api/v1/leads", "List leads with captured info"],
  ["GET", "/api/v1/leads/export", "Download all leads as CSV"],
  ["GET", "/api/v1/agents", "List AI employees"],
  ["POST", "/api/v1/campaigns", "Create a campaign"],
];

function Docs() {
  const curl = `curl -X POST "$NEXO_API_URL/api/v1/calls" \\
  -H "X-API-Key: $NEXO_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: lead-12345" \\
  -d '{"phone_number": "+919876543210", "agent_id": 1, "dry_run": true}'`;
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Place your first call" description="Set NEXO_API_URL to your backend's public URL and NEXO_API_KEY to a key from the API keys tab. dry_run validates without dialing." />
        <CardBody>
          <div className="relative">
            <pre className="overflow-x-auto rounded-xl bg-ink px-4 py-3.5 font-mono text-xs leading-relaxed text-canvas">{curl}</pre>
            <div className="absolute right-2 top-2"><CopyButton value={curl} /></div>
          </div>
        </CardBody>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader title="Common endpoints" description="Verified against the current backend. Full interactive reference: open /docs on your backend URL (FastAPI)." />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-[13px]">
            <tbody className="divide-y divide-line border-t border-line">
              {ENDPOINTS.map(([m, path, desc]) => (
                <tr key={path + m}>
                  <td className="w-20 px-5 py-2.5"><span className={cn("rounded px-1.5 py-0.5 font-mono text-2xs font-semibold", m === "GET" ? "bg-info-soft text-info" : "bg-success-soft text-success")}>{m}</span></td>
                  <td className="px-3 py-2.5 font-mono text-xs text-ink">{path}</td>
                  <td className="px-5 py-2.5 text-ink-2">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
