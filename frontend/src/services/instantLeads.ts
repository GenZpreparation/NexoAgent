import { unsupported } from "@/lib/api/errors";
import { isMockMode } from "@/lib/config";
import { uid } from "@/lib/utils";
import { mockDb } from "@/mocks/db";
import { simulate } from "@/mocks/scenario";
import { SOURCE_PROVIDERS } from "@/lib/labels";
import type { InstantLeadSettings, InstantLeadStats, LeadSource, QueueItem, SourceProvider } from "@/types/domain";

/**
 * Instant (speed-to-lead) calling. The backend currently exposes only the inbound
 * Meta Lead Ads webhook (POST /webhooks/meta-leads); there is no API to list,
 * connect or configure sources, nor queue/analytics endpoints. In API mode
 * these methods reject with an "unsupported" error and the UI shows backend notices.
 */
export interface InstantLeadsService {
  sources(): Promise<LeadSource[]>;
  connect(provider: SourceProvider, employeeId: string | null): Promise<LeadSource>;
  disconnect(id: string): Promise<void>;
  stats(): Promise<InstantLeadStats>;
  queue(): Promise<QueueItem[]>;
  settings(): Promise<InstantLeadSettings>;
  saveSettings(s: InstantLeadSettings): Promise<InstantLeadSettings>;
}

const DAY = 86_400_000;

const mockImpl: InstantLeadsService = {
  sources: () => simulate(() => mockDb().sources),
  connect: (provider, employeeId) =>
    simulate(() => {
      const s: LeadSource = { id: uid("src"), provider, name: SOURCE_PROVIDERS[provider].label, status: "connected", employeeId, leadsLast7d: 0, lastLeadAt: null };
      mockDb().sources.push(s);
      return s;
    }, { latency: 900 }),
  disconnect: (id) =>
    simulate(() => {
      const db = mockDb();
      db.sources = db.sources.filter((s) => s.id !== id);
    }),
  stats: () =>
    simulate(() => {
      const db = mockDb();
      const now = Date.now();
      const instant = db.leads.filter((l) => ["meta_ads", "website_form", "google_ads"].includes(l.source) && now - Date.parse(l.createdAt) < 7 * DAY);
      const called = instant.filter((l) => l.lastContactedAt);
      const connected = called.filter((l) => ["interested", "callback", "not_interested"].includes(l.outcome));
      const daily = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now - (6 - i) * DAY).toISOString().slice(0, 10);
        const day = instant.filter((l) => l.createdAt.startsWith(date));
        return { date, received: day.length, called: day.filter((l) => l.lastContactedAt).length };
      });
      return {
        leadsReceived: instant.length,
        calledWithin60sPct: instant.length ? Math.round((called.length / instant.length) * 92) : 0,
        medianSpeedToLeadSec: instant.length ? 24 : 0,
        connectRatePct: called.length ? Math.round((connected.length / called.length) * 100) : 0,
        daily,
      };
    }),
  queue: () => simulate(() => mockDb().queue),
  settings: () => simulate(() => mockDb().instantSettings),
  saveSettings: (s) =>
    simulate(() => {
      mockDb().instantSettings = s;
      return s;
    }),
};

const reject = (what: string) => async (): Promise<never> => {
  throw unsupported(what);
};

const apiImpl: InstantLeadsService = {
  sources: reject("Listing lead sources"),
  connect: reject("Connecting a lead source"),
  disconnect: reject("Disconnecting a lead source"),
  stats: reject("Instant-lead analytics"),
  queue: reject("The instant-lead queue"),
  settings: reject("Instant-lead settings"),
  saveSettings: reject("Saving instant-lead settings"),
};

export const instantLeadsService: InstantLeadsService = isMockMode ? mockImpl : apiImpl;
