function getBackendOrigin(): string {
  const rawBase =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.INTERNAL_API_URL ??
    process.env.BACKEND_API_URL ??
    "http://localhost:8000";

  return rawBase.replace(/\/api\/v0\/?$/, "").replace(/\/$/, "");
}

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^(?:https?:)?\/\//i.test(trimmed) || trimmed.startsWith("data:")) return trimmed;
  if (trimmed.startsWith("/")) return `${getBackendOrigin()}${trimmed}`;
  return trimmed;
}
