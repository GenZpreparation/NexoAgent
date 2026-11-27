import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { isMockMode } from "@/lib/config";
import { mockDb } from "@/mocks/db";
import { filterConversations } from "@/mocks/query";
import { simulate } from "@/mocks/scenario";
import type { ApiCall, ApiCallList, ApiRecordingStream } from "@/types/api";
import type { Conversation, ConversationPage, ConversationQuery } from "@/types/domain";
import { toConversation } from "./adapters";
import { employeesService } from "./employees";

export interface ConversationsService {
  list(q: ConversationQuery): Promise<ConversationPage>;
  get(id: string): Promise<Conversation>;
  /** Short-lived streaming URL for a call recording. */
  recordingUrl(id: string): Promise<{ url: string; expiresInSec: number }>;
}

const mockImpl: ConversationsService = {
  list: (q) =>
    simulate(() => {
      const rows = filterConversations(mockDb().conversations, q);
      return { items: rows.slice(q.offset, q.offset + q.limit), total: rows.length };
    }),
  get: (id) =>
    simulate(() => {
      const c = mockDb().conversations.find((x) => x.id === id);
      if (!c) throw new ApiError("not_found", "Conversation not found.", 404);
      return c;
    }),
  recordingUrl: () =>
    simulate(() => {
      throw new ApiError("not_found", "Demo conversations have no audio recordings.", 404);
    }),
};

const apiImpl: ConversationsService = {
  async list(q) {
    // Backend supports: status, agent_id, limit (≤100), offset. Other filters are capability-gated in the UI.
    const [res, names] = await Promise.all([
      api.get<ApiCallList>("/calls", { status: q.status, agent_id: q.employeeId, limit: Math.min(q.limit, 100), offset: q.offset }),
      employeesService.nameMap(),
    ]);
    return { items: res.items.map((c) => toConversation(c, names)), total: res.total };
  },
  async get(id) {
    const [c, names] = await Promise.all([api.get<ApiCall>(`/calls/${encodeURIComponent(id)}`), employeesService.nameMap()]);
    return toConversation(c, names);
  },
  async recordingUrl(id) {
    const r = await api.get<ApiRecordingStream>(`/calls/${encodeURIComponent(id)}/recording`);
    return { url: r.streaming_url, expiresInSec: r.expires_in_seconds };
  },
};

export const conversationsService: ConversationsService = isMockMode ? mockImpl : apiImpl;
