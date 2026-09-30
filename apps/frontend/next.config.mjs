// apps/frontend/next.config.mjs
// Next.js config. Allows next/image to optimize step-now.de and images.unsplash.com (DSGVO note: production should self-host).
// Loopback image sources exist only in development: in production the image optimizer must never be
// pointed at localhost/127.0.0.1 (any port, any path) — that is a server-side request forgery primitive.

const isDev = process.env.NODE_ENV !== "production";
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** @type {import('next').NextConfig} */
const allowedRemoteHosts = [
  { protocol: "https", hostname: "step-now.de" },
  { protocol: "https", hostname: "images.unsplash.com" },
  { protocol: "https", hostname: "media.oneweb.mercedes-benz.com" },
  ...(isDev
    ? [
        { protocol: "http", hostname: "localhost" },
        { protocol: "http", hostname: "127.0.0.1" },
      ]
    : []),
];

const backendBase =
  process.env.NEXT_PUBLIC_API_URL || process.env.INTERNAL_API_URL || process.env.BACKEND_API_URL;
if (backendBase) {
  try {
    const parsed = new URL(backendBase);
    const protocol = parsed.protocol.replace(":", "");
    if (
      (isDev || !LOOPBACK_HOSTS.has(parsed.hostname)) &&
      !allowedRemoteHosts.some(
        (entry) => entry.protocol === protocol && entry.hostname === parsed.hostname,
      )
    ) {
      // Backend-hosted media only lives under the uploads mount.
      allowedRemoteHosts.push({ protocol, hostname: parsed.hostname, pathname: "/uploads/**" });
    }
  } catch {}
}

// Baseline response headers. A script-restricting CSP is deliberately not set: Next 14 App Router
// emits inline bootstrap scripts that would need per-request nonces (forcing every page dynamic).
// Framing is limited to same-origin rather than denied because the admin PreviewModal iframes the
// site's own public pages.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: { typedRoutes: false },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: allowedRemoteHosts,
  },
  env: { NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "https://step-now.de" },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    const apiBase = (backendBase || "http://localhost:8000/api/v0").replace(/\/$/, "");
    return [
      {
        source: "/p/s/:code",
        destination: `${apiBase}/public/slips/:code`,
      },
    ];
  },
};

export default nextConfig;
