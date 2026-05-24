// apps/frontend/src/lib/server-api.ts
// Server-side API client. Adds explicit keepalive=true and reduces default timeout 10s→5s so backend hangs fail fast instead of stalling SSR for 10 full seconds (M-1).

import { ApiResponse, ERROR_CODES } from "./api-errors";

function getBackendApiUrl(): string {
  const rawBase =
    process.env.BACKEND_API_URL ??
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000";

  return rawBase.endsWith("/api/v0") ? rawBase : `${rawBase.replace(/\/$/, "")}/api/v0`;
}

const BACKEND_API_URL = getBackendApiUrl();
const DEFAULT_TIMEOUT_MS = 5_000;

interface RequestOptions {
revalidate?: number | false;
tags?: string[];
timeoutMs?: number;
params?: Record<string, string | number | boolean | null | undefined>;
headers?: Record<string, string>;
}

async function request<T>(
method: "GET" | "POST" | "PATCH" | "DELETE",
path: string,
body: unknown,
opts: RequestOptions = {},
authToken?: string,
): Promise<ApiResponse<T>> {
const url = buildUrl(path, opts.params);
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);

const headers: Record<string, string> = {
Accept: "application/json",
...opts.headers,
};
if (body !== undefined) headers["Content-Type"] = "application/json";
if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

const init: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {
method,
headers,
signal: controller.signal,
body: body !== undefined ? JSON.stringify(body) : undefined,
keepalive: true,
};

if (opts.revalidate !== undefined || opts.tags) {
init.next = {};
if (opts.revalidate !== undefined) init.next.revalidate = opts.revalidate;
if (opts.tags) init.next.tags = opts.tags;
} else if (method !== "GET") {
init.cache = "no-store";
}

try {
const res = await fetch(url, init);
clearTimeout(timeout);
return await parseResponse<T>(res);
} catch (err) {
clearTimeout(timeout);
if (err instanceof Error && err.name === "AbortError") {
return {
status: 504,
error: { code: ERROR_CODES.TIMEOUT, message: "Backend request timed out" },
};
}
return {
status: 502,
error: {
code: ERROR_CODES.BACKEND_UNREACHABLE,
message: err instanceof Error ? err.message : "Backend unreachable",
},
};
}
}

async function parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
if (res.status === 204) return { status: 204 };
const text = await res.text();
if (!text) return { status: res.status };

let parsed: unknown;
try {
parsed = JSON.parse(text);
} catch {
return {
status: res.status,
error: { code: ERROR_CODES.PARSE_ERROR, message: "Invalid JSON in backend response" },
};
}

if (!res.ok) {
const errBody = (parsed as { error?: unknown })?.error;
if (errBody && typeof errBody === "object") {
return { status: res.status, error: errBody as ApiResponse<T>["error"] };
}
return {
status: res.status,
error: {
code: ERROR_CODES.UNKNOWN,
message: typeof parsed === "string" ? parsed : `HTTP ${res.status}`,
},
};
}

return { status: res.status, data: parsed as T };
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
const base = path.startsWith("http") ? path : `${BACKEND_API_URL}${path}`;
if (!params) return base;
const url = new URL(base);
for (const [key, value] of Object.entries(params)) {
if (value === null || value === undefined || value === "") continue;
url.searchParams.set(key, String(value));
}
return url.toString();
}

export const serverApiClient = {
get: <T>(path: string, opts?: RequestOptions, authToken?: string) =>
request<T>("GET", path, undefined, opts, authToken),
post: <T>(path: string, body?: unknown, opts?: RequestOptions, authToken?: string) =>
request<T>("POST", path, body, opts, authToken),
patch: <T>(path: string, body?: unknown, opts?: RequestOptions, authToken?: string) =>
request<T>("PATCH", path, body, opts, authToken),
delete: <T>(path: string, opts?: RequestOptions, authToken?: string) =>
request<T>("DELETE", path, undefined, opts, authToken),
};
