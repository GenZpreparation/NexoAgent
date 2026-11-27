/**
 * Runtime configuration. All values come from NEXT_PUBLIC_* env vars, which are
 * inlined at build time. Never place secrets in these variables.
 */
export type DataMode = "mock" | "api";

const rawMode = process.env.NEXT_PUBLIC_DATA_MODE;

export const config = {
  dataMode: (rawMode === "api" ? "api" : "mock") as DataMode,
  apiBaseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1").replace(/\/$/, ""),
  allowMockInProduction: process.env.NEXT_PUBLIC_ALLOW_MOCK_IN_PRODUCTION === "true",
  isProduction: process.env.NODE_ENV === "production",
} as const;

export const isMockMode = config.dataMode === "mock";

/** True when a production build is running on demo data without explicit opt-in. */
export const mockModeMisconfigured = isMockMode && config.isProduction && !config.allowMockInProduction;
