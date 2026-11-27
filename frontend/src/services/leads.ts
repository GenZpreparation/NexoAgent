import { api } from "@/lib/api/client";
import { unsupported } from "@/lib/api/errors";
import { isMockMode } from "@/lib/config";
import { mockDb } from "@/mocks/db";
import { filterLeads, summarizeLeads } from "@/mocks/query";
import { simulate } from "@/mocks/scenario";
import type { ApiLeadsList } from "@/types/api";
import type { Lead, LeadPage, LeadQuery } from "@/types/domain";
import { toLead } from "./adapters";

export interface LeadsService {
  list(q: LeadQuery): Promise<LeadPage>;
  /** Full lead export as a CSV Blob. */
  exportCsv(q: Omit<LeadQuery, "limit" | "offset">): Promise<Blob | null>;
  scheduleFollowUp(id: string, at: string | null): Promise<Lead>;
}

const mockImpl: LeadsService = {
  list: (q) =>
    simulate(() => {
      const db = mockDb();
      const rows = filterLeads(db.leads, q);
      return { summary: summarizeLeads(db.leads), items: rows.slice(q.offset, q.offset + q.limit), hasMore: q.offset + q.limit < rows.length };
    }),
  // Mock mode: the page exports the rows it has; return null to signal "export client-side".
  exportCsv: () => simulate(() => null, { latency: 100 }),
  scheduleFollowUp: (id, at) =>
    simulate(() => {
      const lead = mockDb().leads.find((l) => l.id === id);
      if (!lead) throw unsupported("Lead");
      lead.followUp = at ? { status: Date.parse(at) < Date.now() ? "overdue" : "scheduled", at } : { status: "none", at: null };
      return lead;
    }),
};

const apiImpl: LeadsService = {
  async list(q) {
    // Backend supports: search, agent_id, outcome, hot_only, sort (recent|oldest), limit, offset.
    const res = await api.get<ApiLeadsList>("/leads", {
      search: q.search,
      agent_id: q.employeeId,
      outcome: q.outcome,
      hot_only: q.hotOnly,
      sort: q.sort === "oldest" ? "oldest" : "recent",
      limit: q.limit,
      offset: q.offset,
    });
    return {
      summary: { total: res.summary.total_leads, qualified: res.summary.qualified, pendingCallback: res.summary.pending_callback, hot: res.summary.hot_leads },
      items: res.leads.map(toLead),
      // Backend `total` is the page length, not the full count, so infer "more" from a full page.
      hasMore: res.leads.length === q.limit,
    };
  },
  async exportCsv() {
    const res = await api.download("/leads/export");
    return await res.blob();
  },
  scheduleFollowUp: async () => {
    throw unsupported("Scheduling follow-ups");
  },
};

export const leadsService: LeadsService = isMockMode ? mockImpl : apiImpl;
