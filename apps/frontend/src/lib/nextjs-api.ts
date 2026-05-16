// src/lib/nextjs-api.ts
// Browser BFF client. Auto-aborts stale in-flight requests to the same URL.

import { ApiError, ApiErrorBody, ERROR_CODES } from "./api-errors";

const BFF_BASE = "/api/v0";
const DEFAULT_TIMEOUT_MS = 15_000;

interface ClientRequestOptions {
  timeoutMs?: number;
  params?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

const inFlight = new Map<string, AbortController>();

async function request<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body: unknown,
  opts: ClientRequestOptions = {},
): Promise<T> {
  if (typeof window === "undefined") {
    throw new ApiError(ERROR_CODES.UNKNOWN, "nextjsApiClient called from server context", 500);
  }

  const url = buildUrl(path, opts.params);
  const dedupeKey = `${method} ${url}`;
  const prior = inFlight.get(dedupeKey);
  if (prior && method === "GET") prior.abort();

  const controller = new AbortController();
  if (method === "GET") inFlight.set(dedupeKey, controller);
  const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  if (opts.signal) opts.signal.addEventListener("abort", () => controller.abort(), { once: true });

  const headers: Record<string, string> = { Accept: "application/json", ...opts.headers };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  try {
    const res = await fetch(url, {
      method,
      headers,
      credentials: "same-origin",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (inFlight.get(dedupeKey) === controller) inFlight.delete(dedupeKey);
    return await handleResponse<T>(res);
  } catch (err) {
    clearTimeout(timeoutId);
    if (inFlight.get(dedupeKey) === controller) inFlight.delete(dedupeKey);
    if (err instanceof ApiError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(ERROR_CODES.TIMEOUT, "Request aborted", 0);
    }
    throw new ApiError(
      ERROR_CODES.BACKEND_UNREACHABLE,
      err instanceof Error ? err.message : "Network error",
      0,
    );
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const parsed = text ? safeJson(text) : undefined;
  if (!res.ok) {
    const errBody = (parsed as { error?: ApiErrorBody } | undefined)?.error;
    if (errBody) throw ApiError.fromResponse(errBody, res.status);
    throw new ApiError(ERROR_CODES.UNKNOWN, `HTTP ${res.status}`, res.status);
  }
  return parsed as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(ERROR_CODES.PARSE_ERROR, "Invalid JSON response", 0);
  }
}

function buildUrl(path: string, params?: ClientRequestOptions["params"]): string {
  const fullPath = path.startsWith("/api/") ? path : `${BFF_BASE}${path}`;
  if (!params) return fullPath;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    qs.set(key, String(value));
  }
  const query = qs.toString();
  return query ? `${fullPath}?${query}` : fullPath;
}

export const nextjsApiClient = {
  get: <T>(path: string, opts?: ClientRequestOptions) => request<T>("GET", path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: ClientRequestOptions) =>
    request<T>("POST", path, body, opts),
  patch: <T>(path: string, body?: unknown, opts?: ClientRequestOptions) =>
    request<T>("PATCH", path, body, opts),
  delete: <T>(path: string, opts?: ClientRequestOptions) =>
    request<T>("DELETE", path, undefined, opts),
};
