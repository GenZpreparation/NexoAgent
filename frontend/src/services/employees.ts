import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { isMockMode } from "@/lib/config";
import { uid } from "@/lib/utils";
import { mockDb } from "@/mocks/db";
import { simulate } from "@/mocks/scenario";
import { MOCK_VOICES } from "@/mocks/voices";
import { compileSystemPrompt } from "@/features/employees/prompt";
import type { ApiAgent, ApiAgentCreateRequest, ApiAgentUpdateRequest, ApiVoice } from "@/types/api";
import type { Employee, EmployeeDraft, Voice } from "@/types/domain";
import { toEmployee, toVoice } from "./adapters";

export interface EmployeePatch {
  name?: string;
  instructions?: string;
  firstMessage?: string;
  status?: Employee["status"];
  voiceId?: string;
  language?: string;
}

export interface EmployeesService {
  list(): Promise<Employee[]>;
  get(id: string): Promise<Employee>;
  create(draft: EmployeeDraft): Promise<Employee>;
  update(id: string, patch: EmployeePatch): Promise<Employee>;
  duplicate(id: string): Promise<Employee>;
  remove(id: string): Promise<void>;
  voices(): Promise<Voice[]>;
  /** id → display name, cached briefly; used to label calls/campaigns that only carry agent_id. */
  nameMap(): Promise<Map<string, string>>;
}

const notFound = () => new ApiError("not_found", "That AI employee no longer exists.", 404);

const mockImpl: EmployeesService = {
  list: () => simulate(() => mockDb().employees),
  get: (id) =>
    simulate(() => {
      const e = mockDb().employees.find((x) => x.id === id);
      if (!e) throw notFound();
      return e;
    }),
  create: (d) =>
    simulate(() => {
      const now = new Date().toISOString();
      const voice = MOCK_VOICES.find((v) => v.id === d.voiceId);
      const e: Employee = {
        id: uid("emp"),
        name: d.name.trim(),
        role: d.role.trim(),
        status: "active",
        language: d.language,
        voiceId: d.voiceId,
        voiceProvider: voice?.provider ?? "sarvam",
        firstMessage: d.firstMessage.trim(),
        instructions: d.instructions.trim(),
        callingMode: d.callingMode,
        naturalSpeech: d.naturalSpeech,
        qualificationQuestions: d.qualificationQuestions.filter((q) => q.question.trim()),
        followUp: d.followUp,
        workingHours: d.workingHours,
        channels: [],
        templateId: d.templateId,
        stats: { calls: 0, qualified: 0, lastActiveAt: null },
        createdAt: now,
        updatedAt: now,
      };
      mockDb().employees.unshift(e);
      return e;
    }, { latency: 900 }),
  update: (id, patch) =>
    simulate(() => {
      const e = mockDb().employees.find((x) => x.id === id);
      if (!e) throw notFound();
      Object.assign(e, Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)), { updatedAt: new Date().toISOString() });
      return e;
    }),
  duplicate: (id) =>
    simulate(() => {
      const db = mockDb();
      const src = db.employees.find((x) => x.id === id);
      if (!src) throw notFound();
      const now = new Date().toISOString();
      const copy: Employee = { ...structuredClone(src), id: uid("emp"), name: `${src.name} (Copy)`, status: "paused", stats: { calls: 0, qualified: 0, lastActiveAt: null }, createdAt: now, updatedAt: now };
      db.employees.unshift(copy);
      return copy;
    }),
  remove: (id) =>
    simulate(() => {
      const db = mockDb();
      db.employees = db.employees.filter((x) => x.id !== id);
    }),
  voices: () => simulate(() => MOCK_VOICES, { latency: 150 }),
  nameMap: async () => new Map(mockDb().employees.map((e) => [e.id, e.name])),
};

let nameCache: { at: number; map: Map<string, string> } | null = null;

const apiImpl: EmployeesService = {
  async list() {
    const rows = (await api.get<ApiAgent[]>("/agents")).map(toEmployee);
    nameCache = { at: Date.now(), map: new Map(rows.map((e) => [e.id, e.name])) };
    return rows;
  },
  get: async (id) => toEmployee(await api.get<ApiAgent>(`/agents/${encodeURIComponent(id)}`)),
  async create(d) {
    const voice = (await apiImpl.voices()).find((v) => v.id === d.voiceId);
    const body: ApiAgentCreateRequest = {
      name: d.name.trim(),
      system_prompt: compileSystemPrompt(d),
      first_message: d.firstMessage.trim(),
      voice_id: d.voiceId,
      voice_provider: voice?.provider ?? "sarvam",
      language: d.language,
      temperature: 0.3,
    };
    nameCache = null;
    return toEmployee(await api.post<ApiAgent>("/agents", body));
  },
  async update(id, patch) {
    const body: ApiAgentUpdateRequest = {
      name: patch.name,
      system_prompt: patch.instructions,
      first_message: patch.firstMessage,
      voice_id: patch.voiceId,
      language: patch.language,
      is_active: patch.status === undefined ? undefined : patch.status === "active",
    };
    nameCache = null;
    return toEmployee(await api.patch<ApiAgent>(`/agents/${encodeURIComponent(id)}`, body));
  },
  async duplicate(id) {
    nameCache = null;
    return toEmployee(await api.post<ApiAgent>(`/agents/${encodeURIComponent(id)}/duplicate`));
  },
  async remove(id) {
    nameCache = null;
    await api.delete(`/agents/${encodeURIComponent(id)}`);
  },
  voices: async () => (await api.get<ApiVoice[]>("/voices")).map(toVoice),
  async nameMap() {
    if (nameCache && Date.now() - nameCache.at < 30_000) return nameCache.map;
    try {
      await apiImpl.list();
    } catch {
      return new Map();
    }
    return nameCache?.map ?? new Map();
  },
};

export const employeesService: EmployeesService = isMockMode ? mockImpl : apiImpl;
