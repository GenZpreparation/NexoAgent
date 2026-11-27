import { config } from "@/lib/config";
import { ApiError, errorFromResponse } from "./errors";
import { emitUnauthorized, getToken } from "./token";

/**
 * The ONLY place the frontend performs HTTP requests to the backend.
 * - Base URL from NEXT_PUBLIC_API_BASE_URL (defaults to the /api/v1 proxy)
 * - Attaches `Authorization: Bearer <token>` when signed in
 * - Normalises every failure into an ApiError
 * - Emits a global "unauthorized" event on 401 so the session is cleared once
 */

export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  query?: Record<string, QueryValue>;
  body?: unknown;
  /** Send as multipart (e.g. CSV upload). */
  formData?: FormData;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Return the raw Response (file downloads). */
  raw?: boolean;
  /** Skip the auth header (login/register). */
  anonymous?: boolean;
}

export function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = `${config.apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "" || value === false) continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204) return null;
  const type = res.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  return await res.text();
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json", ...opts.headers };
  let body: BodyInit | undefined;

  if (opts.formData) {
    body = opts.formData; // the browser sets the multipart boundary
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  if (!opts.anonymous) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method: opts.method ?? "GET",
      headers,
      body,
      signal: opts.signal,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    throw new ApiError("network", "Can't reach the NexoAgent backend. Check that it is running and try again.");
  }

  if (!res.ok) {
    const parsed = await parseBody(res);
    const error = errorFromResponse(res.status, parsed);
    if (error.kind === "unauthorized" && !opts.anonymous) emitUnauthorized();
    throw error;
  }

  if (opts.raw) return res as unknown as T;
  return (await parseBody(res)) as T;
}

export const api = {
  get: <T>(path: string, query?: Record<string, QueryValue>) => request<T>(path, { query }),
  post: <T>(path: string, body?: unknown, extra: Omit<RequestOptions, "method" | "body"> = {}) =>
    request<T>(path, { ...extra, method: "POST", body }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T = void>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, formData: FormData) => request<T>(path, { method: "POST", formData }),
  download: (path: string, query?: Record<string, QueryValue>) => request<Response>(path, { query, raw: true }),
};
