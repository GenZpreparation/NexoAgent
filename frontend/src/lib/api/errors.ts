import type { ApiErrorBody } from "@/types/api";

export type ApiErrorKind =
  | "network" // backend unreachable
  | "unauthorized" // 401
  | "forbidden" // 403
  | "not_found" // 404
  | "payment_required" // 402 (insufficient wallet balance)
  | "validation" // 400 / 409 / 422
  | "server" // 5xx
  | "unsupported" // the backend has no endpoint for this yet
  | "unknown";

/**
 * Normalised error thrown by every service call. UI code only needs `kind`
 * and `message`; `message` is safe to show users (no stack traces, no raw bodies).
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly fieldErrors: Record<string, string>;

  constructor(kind: ApiErrorKind, message: string, status: number | null = null, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/** Thrown by services for actions that need a backend endpoint that does not exist yet. */
export function unsupported(what: string): ApiError {
  return new ApiError(
    "unsupported",
    `${what} isn't available yet. It needs backend support (see docs/FRONTEND_BACKEND_CONTRACT.md).`,
  );
}

const MAX_MESSAGE_LENGTH = 240;

function kindForStatus(status: number): ApiErrorKind {
  if (status === 401) return "unauthorized";
  if (status === 402) return "payment_required";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 400 || status === 409 || status === 422) return "validation";
  if (status >= 500) return "server";
  return "unknown";
}

const FALLBACK: Record<ApiErrorKind, string> = {
  network: "Can't reach the NexoAgent backend. Check that it is running and try again.",
  unauthorized: "Your session has expired. Please sign in again.",
  forbidden: "You don't have permission to do that.",
  not_found: "We couldn't find what you were looking for.",
  payment_required: "Insufficient balance. Add credits to continue.",
  validation: "Some of the information provided is invalid.",
  server: "The server ran into a problem. Please try again shortly.",
  unsupported: "This needs backend support that isn't available yet.",
  unknown: "Something went wrong. Please try again.",
};

/** Convert a FastAPI error response into an ApiError. Server (5xx) details are never shown. */
export function errorFromResponse(status: number, body: unknown): ApiError {
  const kind = kindForStatus(status);
  const detail = (body as ApiErrorBody | null)?.detail;
  const fieldErrors: Record<string, string> = {};
  let message = FALLBACK[kind];

  if (kind !== "server") {
    if (typeof detail === "string" && detail.trim()) {
      message = detail.trim();
    } else if (Array.isArray(detail) && detail.length) {
      for (const item of detail) {
        const field = item.loc?.filter((p) => p !== "body" && p !== "query").join(".");
        if (field && item.msg) fieldErrors[field] = item.msg;
      }
      const first = detail[0];
      if (first?.msg) {
        const last = first.loc?.length ? String(first.loc[first.loc.length - 1]) : "";
        message = last && last !== "body" ? `${last}: ${first.msg}` : first.msg;
      }
    }
  }

  if (message.length > MAX_MESSAGE_LENGTH) message = `${message.slice(0, MAX_MESSAGE_LENGTH)}…`;
  return new ApiError(kind, message, status, fieldErrors);
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  return new ApiError("unknown", FALLBACK.unknown);
}

export function errorMessage(err: unknown): string {
  return toApiError(err).message;
}
