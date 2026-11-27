import { api } from "@/lib/api/client";
import { setToken } from "@/lib/api/token";
import { isMockMode } from "@/lib/config";
import { simulate } from "@/mocks/scenario";
import type { ApiLoginRequest, ApiMeResponse, ApiRegisterRequest, ApiTokenResponse } from "@/types/api";
import type { Session } from "@/types/domain";

function toSession(r: ApiMeResponse | ApiTokenResponse): Session {
  return {
    user: { id: String(r.user.id), name: r.user.full_name, email: r.user.email, role: r.user.role },
    workspace: { id: String(r.workspace.id), name: r.workspace.name, slug: r.workspace.slug, balanceInr: r.workspace.balance_inr },
  };
}

const DEMO_SESSION: Session = {
  user: { id: "u_1", name: "Demo Admin", email: "admin@demo.nexoagent.local", role: "admin" },
  workspace: { id: "ws_demo", name: "Demo workspace", slug: "demo", balanceInr: 0 },
};

export const authService = {
  /** Current session, or throws ApiError("unauthorized"). */
  async me(): Promise<Session> {
    if (isMockMode) return simulate(() => DEMO_SESSION, { latency: 120, failable: false });
    return toSession(await api.get<ApiMeResponse>("/auth/me"));
  },

  async login(body: ApiLoginRequest): Promise<Session> {
    if (isMockMode) return simulate(() => DEMO_SESSION, { failable: false });
    const res = await api.post<ApiTokenResponse>("/auth/login", body, { anonymous: true });
    setToken(res.access_token);
    return toSession(res);
  },

  async register(body: ApiRegisterRequest): Promise<Session> {
    if (isMockMode) return simulate(() => DEMO_SESSION, { failable: false });
    const res = await api.post<ApiTokenResponse>("/auth/register", body, { anonymous: true });
    setToken(res.access_token);
    return toSession(res);
  },

  /** Backend has no logout/revoke endpoint yet; dropping the token ends the session client-side. */
  logout(): void {
    setToken(null);
  },
};
