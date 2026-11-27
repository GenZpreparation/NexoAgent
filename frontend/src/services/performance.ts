import { api } from "@/lib/api/client";
import { isMockMode } from "@/lib/config";
import { mockDb } from "@/mocks/db";
import { computePerformance } from "@/mocks/query";
import { simulate } from "@/mocks/scenario";
import type { ApiPerformance } from "@/types/api";
import type { Performance, PerformanceQuery } from "@/types/domain";
import { toPerformance } from "./adapters";

export interface PerformanceService {
  get(q: PerformanceQuery): Promise<Performance>;
}

const mockImpl: PerformanceService = {
  get: (q) => simulate(() => computePerformance(mockDb().conversations, mockDb().employees, q), { latency: 500 }),
};

const apiImpl: PerformanceService = {
  async get(q) {
    // Backend supports: days (1–90), agent_id, min_duration, issues_only.
    const res = await api.get<ApiPerformance>("/analytics/performance", {
      days: Math.min(90, Math.max(1, q.days)),
      agent_id: q.employeeId,
      min_duration: q.minDurationSec || undefined,
      issues_only: q.issuesOnly,
    });
    return toPerformance(res);
  },
};

export const performanceService: PerformanceService = isMockMode ? mockImpl : apiImpl;
