import { api } from "@/lib/api/client";
import { ApiError, unsupported } from "@/lib/api/errors";
import { isMockMode } from "@/lib/config";
import { uid } from "@/lib/utils";
import { mockDb } from "@/mocks/db";
import { simulate } from "@/mocks/scenario";
import type { ApiCampaign, ApiCampaignCreateRequest, ApiCampaignLead, ApiCsvUploadResult } from "@/types/api";
import type { Campaign, CampaignLead, CsvUploadResult } from "@/types/domain";
import { toCampaign, toCampaignLead } from "./adapters";
import { employeesService } from "./employees";

export interface CampaignInput {
  name: string;
  employeeId: string;
  concurrency: number;
}

export interface CampaignsService {
  list(): Promise<Campaign[]>;
  create(input: CampaignInput): Promise<Campaign>;
  uploadCsv(id: string, file: File): Promise<CsvUploadResult>;
  /** Asks the BACKEND to start dialing. The frontend never places calls itself. */
  start(id: string): Promise<void>;
  pause(id: string): Promise<void>;
  leads(id: string): Promise<CampaignLead[]>;
}

const notFound = () => new ApiError("not_found", "Campaign not found.", 404);

const mockImpl: CampaignsService = {
  list: () => simulate(() => mockDb().campaigns),
  create: (input) =>
    simulate(() => {
      const db = mockDb();
      const emp = db.employees.find((e) => e.id === input.employeeId);
      const c: Campaign = {
        id: uid("cmp"),
        name: input.name.trim(),
        status: "draft",
        employeeId: input.employeeId,
        employeeName: emp?.name ?? null,
        source: "No list uploaded",
        totalLeads: 0,
        dialed: 0,
        connected: 0,
        concurrency: input.concurrency,
        createdAt: new Date().toISOString(),
      };
      db.campaigns.unshift(c);
      db.campaignLeads[c.id] = [];
      return c;
    }),
  uploadCsv: async (id, file) => {
    // Demo: parse the file locally to count rows. Nothing is uploaded anywhere.
    const text = await file.text();
    const rows = text.split(/\r?\n/).filter((l) => l.trim()).slice(1);
    const phones = rows.map((r) => r.split(",").find((cell) => /\+?\d{10,13}/.test(cell.replace(/\s/g, "")))).filter(Boolean);
    const unique = new Set(phones);
    return simulate(() => {
      const c = mockDb().campaigns.find((x) => x.id === id);
      if (!c) throw notFound();
      c.totalLeads += unique.size;
      c.source = `CSV upload · ${file.name}`;
      return { added: unique.size, processed: rows.length, dndBlocked: null, duplicates: phones.length - unique.size, invalid: rows.length - phones.length };
    }, { latency: 900 });
  },
  start: (id) =>
    simulate(() => {
      const c = mockDb().campaigns.find((x) => x.id === id);
      if (!c) throw notFound();
      c.status = "running";
    }),
  pause: (id) =>
    simulate(() => {
      const c = mockDb().campaigns.find((x) => x.id === id);
      if (!c) throw notFound();
      c.status = "paused";
    }),
  leads: (id) => simulate(() => mockDb().campaignLeads[id] ?? []),
};

const apiImpl: CampaignsService = {
  async list() {
    const [rows, names] = await Promise.all([api.get<ApiCampaign[]>("/campaigns"), employeesService.nameMap()]);
    return rows.map((c) => toCampaign(c, names));
  },
  async create(input) {
    const body: ApiCampaignCreateRequest = { name: input.name.trim(), agent_id: Number(input.employeeId), concurrency_limit: input.concurrency };
    const [c, names] = await Promise.all([api.post<ApiCampaign>("/campaigns", body), employeesService.nameMap()]);
    return toCampaign(c, names);
  },
  async uploadCsv(id, file) {
    const form = new FormData();
    form.append("file", file);
    const r = await api.upload<ApiCsvUploadResult>(`/campaigns/${encodeURIComponent(id)}/upload-csv`, form);
    return {
      added: Number(r.leads_added ?? 0),
      processed: r.total_rows_processed ?? null,
      dndBlocked: r.dnd_scrubbed_blocked ?? null,
      duplicates: r.duplicates_skipped ?? null,
      invalid: r.invalid_numbers_skipped ?? null,
    };
  },
  async start(id) {
    await api.post(`/campaigns/${encodeURIComponent(id)}/start`);
  },
  pause: async () => {
    throw unsupported("Pausing a campaign");
  },
  leads: async (id) => (await api.get<ApiCampaignLead[]>(`/campaigns/${encodeURIComponent(id)}/leads`, { limit: 50 })).map(toCampaignLead),
};

export const campaignsService: CampaignsService = isMockMode ? mockImpl : apiImpl;
