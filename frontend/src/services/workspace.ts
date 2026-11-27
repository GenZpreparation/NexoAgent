import { api } from "@/lib/api/client";
import { ApiError, unsupported } from "@/lib/api/errors";
import { isMockMode } from "@/lib/config";
import { uid } from "@/lib/utils";
import { mockDb } from "@/mocks/db";
import { simulate } from "@/mocks/scenario";
import type { ApiMember, ApiMemberInviteRequest, ApiSearchResponse } from "@/types/api";
import type { Member, Notification, SearchResult } from "@/types/domain";
import { toMember } from "./adapters";

export interface WorkspaceService {
  members(): Promise<Member[]>;
  /** Backend creates the member with an initial password (POST /workspace/members). */
  invite(input: { name: string; email: string; password: string; role: string }): Promise<Member>;
  updateMember(id: string, patch: { role?: string; active?: boolean }): Promise<Member>;
  removeMember(id: string): Promise<void>;
  notifications(): Promise<Notification[]>;
  markAllRead(): Promise<void>;
  search(q: string): Promise<SearchResult[]>;
}

const mockImpl: WorkspaceService = {
  members: () => simulate(() => mockDb().members),
  invite: (input) =>
    simulate(() => {
      const db = mockDb();
      if (db.members.some((m) => m.email.toLowerCase() === input.email.toLowerCase())) {
        throw new ApiError("validation", "A user with this email already exists.", 400);
      }
      const m: Member = { id: uid("u"), name: input.name, email: input.email, role: input.role, active: true };
      db.members.push(m);
      return m;
    }),
  updateMember: (id, patch) =>
    simulate(() => {
      const m = mockDb().members.find((x) => x.id === id);
      if (!m) throw new ApiError("not_found", "Member not found.", 404);
      if (patch.role) m.role = patch.role;
      if (patch.active !== undefined) m.active = patch.active;
      return m;
    }),
  removeMember: (id) =>
    simulate(() => {
      const db = mockDb();
      db.members = db.members.filter((m) => m.id !== id);
    }),
  notifications: () => simulate(() => mockDb().notifications, { latency: 200 }),
  markAllRead: () =>
    simulate(() => {
      mockDb().notifications.forEach((n) => (n.read = true));
    }),
  search: (q) =>
    simulate(() => {
      const db = mockDb();
      const n = q.trim().toLowerCase();
      if (!n) return [];
      const out: SearchResult[] = [];
      db.employees.filter((e) => e.name.toLowerCase().includes(n)).slice(0, 4).forEach((e) => out.push({ category: "employee", id: e.id, title: e.name, subtitle: e.role, href: `/employees/${e.id}` }));
      db.leads.filter((l) => l.name.toLowerCase().includes(n) || l.phone.includes(n)).slice(0, 5).forEach((l) => out.push({ category: "lead", id: l.id, title: l.name, subtitle: l.phone, href: `/leads?search=${encodeURIComponent(l.phone)}` }));
      db.campaigns.filter((c) => c.name.toLowerCase().includes(n)).slice(0, 3).forEach((c) => out.push({ category: "campaign", id: c.id, title: c.name, subtitle: c.employeeName, href: `/campaigns?open=${c.id}` }));
      return out;
    }, { latency: 160 }),
};

const CATEGORY_MAP: Record<string, SearchResult["category"]> = { employee: "employee", agent: "employee", lead: "lead", campaign: "campaign", call: "call" };

const apiImpl: WorkspaceService = {
  members: async () => (await api.get<ApiMember[]>("/workspace/members")).map(toMember),
  async invite(input) {
    const body: ApiMemberInviteRequest = { full_name: input.name, email: input.email, password: input.password, role: input.role };
    return toMember(await api.post<ApiMember>("/workspace/members", body));
  },
  updateMember: async (id, patch) => toMember(await api.patch<ApiMember>(`/workspace/members/${encodeURIComponent(id)}`, { role: patch.role, is_active: patch.active })),
  removeMember: async (id) => {
    await api.delete(`/workspace/members/${encodeURIComponent(id)}`);
  },
  notifications: async () => {
    throw unsupported("The notifications feed");
  },
  markAllRead: async () => {
    throw unsupported("Notifications");
  },
  async search(q) {
    const r = await api.get<ApiSearchResponse>("/search", { q });
    // The backend returns `url` values for an older route scheme; we build hrefs from category + id instead.
    return r.results.map((x) => {
      const category = CATEGORY_MAP[x.category] ?? "page";
      const id = String(x.id);
      const href =
        category === "employee" ? `/employees/${id}` : category === "lead" ? `/leads?search=${encodeURIComponent(x.subtitle ?? x.title)}` : category === "campaign" ? `/campaigns?open=${id}` : category === "call" ? `/conversations?open=${id}` : "/";
      return { category, id, title: x.title, subtitle: x.subtitle, href };
    });
  },
};

export const workspaceService: WorkspaceService = isMockMode ? mockImpl : apiImpl;
