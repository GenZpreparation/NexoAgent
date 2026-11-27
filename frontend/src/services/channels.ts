import { api } from "@/lib/api/client";
import { ApiError, unsupported } from "@/lib/api/errors";
import { isMockMode } from "@/lib/config";
import { uid } from "@/lib/utils";
import { mockDb } from "@/mocks/db";
import { simulate } from "@/mocks/scenario";
import type { ApiChannel, ApiChannelCreateRequest, ApiLiveConcurrency } from "@/types/api";
import type { Channel, ChannelInput, LiveActivity } from "@/types/domain";
import { toChannel } from "./adapters";

export interface ChannelsService {
  list(): Promise<Channel[]>;
  create(input: ChannelInput): Promise<Channel>;
  update(id: string, patch: Partial<Pick<Channel, "name" | "assignedEmployeeId" | "concurrency" | "active">>): Promise<Channel>;
  /** Live concurrency ticker. Polled today; replace with SSE/WebSocket when the backend offers one. */
  live(): Promise<LiveActivity>;
}

const mockImpl: ChannelsService = {
  list: () => simulate(() => mockDb().channels),
  create: (input) =>
    simulate(() => {
      const db = mockDb();
      if (db.channels.some((c) => c.phone === input.phone)) {
        throw new ApiError("validation", `Phone number '${input.phone}' is already added.`, 400);
      }
      const c: Channel = {
        id: uid("ch"),
        type: "phone",
        phone: input.phone,
        name: input.name || "Primary caller line",
        active: true,
        concurrency: input.concurrency,
        assignedEmployeeId: input.assignedEmployeeId,
        dltEntityId: input.dltEntityId || null,
        dltSenderId: input.dltSenderId || null,
      };
      db.channels.push(c);
      return c;
    }),
  update: (id, patch) =>
    simulate(() => {
      const c = mockDb().channels.find((x) => x.id === id);
      if (!c) throw new ApiError("not_found", "Channel not found.", 404);
      Object.assign(c, patch);
      return c;
    }),
  // Demo workspace never has live calls — we don't fake activity in the header.
  live: () => simulate(() => ({ activeCalls: 0, burnRatePerMin: 0, totalChannels: mockDb().channels.reduce((s, c) => s + (c.active ? c.concurrency : 0), 0) }), { latency: 100, failable: false }),
};

const apiImpl: ChannelsService = {
  list: async () => (await api.get<ApiChannel[]>("/channels")).map(toChannel),
  async create(input) {
    const body: ApiChannelCreateRequest = {
      phone_number: input.phone,
      friendly_name: input.name || undefined,
      concurrency_limit: input.concurrency,
      dlt_entity_id: input.dltEntityId || undefined,
      dlt_sender_id: input.dltSenderId || undefined,
      assigned_agent_id: input.assignedEmployeeId ? Number(input.assignedEmployeeId) : undefined,
    };
    return toChannel(await api.post<ApiChannel>("/channels", body));
  },
  update: async () => {
    throw unsupported("Editing a channel");
  },
  async live() {
    const r = await api.get<ApiLiveConcurrency>("/channels/live");
    return { activeCalls: r.active_calls_count, burnRatePerMin: r.burn_rate_inr_per_min, totalChannels: r.total_channels };
  },
};

export const channelsService: ChannelsService = isMockMode ? mockImpl : apiImpl;
