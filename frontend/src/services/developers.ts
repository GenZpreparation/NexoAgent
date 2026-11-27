import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { isMockMode } from "@/lib/config";
import { simulate } from "@/mocks/scenario";
import type { ApiKeyCreated, ApiKeyItem, ApiWebhook, ApiWebhookCreateRequest } from "@/types/api";
import type { ApiKey, Webhook } from "@/types/domain";
import { toApiKey, toWebhook } from "./adapters";

/**
 * Credentials are NEVER simulated. In mock mode lists are empty and creation
 * is refused, so nobody mistakes a demo string for a working key or secret.
 */
export interface DevelopersService {
  apiKeys(): Promise<ApiKey[]>;
  /** Returns the full secret exactly once — the UI must not persist it. */
  createApiKey(name: string): Promise<{ key: ApiKey; secret: string }>;
  revokeApiKey(id: string): Promise<void>;
  webhooks(): Promise<Webhook[]>;
  createWebhook(input: { url: string; description: string; events: string[] }): Promise<Webhook>;
  deleteWebhook(id: string): Promise<void>;
  testWebhook(id: string): Promise<string>;
}

const demoRefusal = () =>
  new ApiError("unsupported", "Demo mode never issues credentials. Run against the backend (NEXT_PUBLIC_DATA_MODE=api) to create real API keys and webhooks.");

const mockImpl: DevelopersService = {
  apiKeys: () => simulate(() => []),
  createApiKey: async () => {
    throw demoRefusal();
  },
  revokeApiKey: async () => {
    throw demoRefusal();
  },
  webhooks: () => simulate(() => []),
  createWebhook: async () => {
    throw demoRefusal();
  },
  deleteWebhook: async () => {
    throw demoRefusal();
  },
  testWebhook: async () => {
    throw demoRefusal();
  },
};

const apiImpl: DevelopersService = {
  apiKeys: async () => (await api.get<ApiKeyItem[]>("/api-keys")).map(toApiKey),
  async createApiKey(name) {
    const r = await api.post<ApiKeyCreated>("/api-keys", { name });
    return {
      key: { id: String(r.id), name: r.name, prefix: r.key_prefix, active: true, createdAt: r.created_at, lastUsedAt: null },
      secret: r.api_key,
    };
  },
  revokeApiKey: async (id) => {
    await api.delete(`/api-keys/${encodeURIComponent(id)}`);
  },
  webhooks: async () => (await api.get<ApiWebhook[]>("/integrations/webhooks")).map(toWebhook),
  async createWebhook(input) {
    const body: ApiWebhookCreateRequest = { target_url: input.url, description: input.description || undefined, subscribed_events: input.events };
    return toWebhook(await api.post<ApiWebhook>("/integrations/webhooks", body));
  },
  deleteWebhook: async (id) => {
    await api.delete(`/integrations/webhooks/${encodeURIComponent(id)}`);
  },
  async testWebhook(id) {
    const r = await api.post<{ status?: string; message?: string; response_status?: number }>(`/integrations/webhooks/${encodeURIComponent(id)}/test-ping`);
    // Today the backend signs a sample event but does not deliver it (status "ping_simulated").
    if (r?.status === "ping_simulated") return "The backend signed a sample lead.qualified event but did not deliver it (simulated ping).";
    return r?.message ?? (r?.response_status ? `Endpoint responded with HTTP ${r.response_status}.` : "Test event requested.");
  },
};

export const developersService: DevelopersService = isMockMode ? mockImpl : apiImpl;
