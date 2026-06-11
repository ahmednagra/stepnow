// apps/frontend/next.config.mjs
// Next.js config. Allows next/image to optimize step-now.de and images.unsplash.com (DSGVO note: production should self-host).

/** @type {import('next').NextConfig} */
const allowedRemoteHosts = [
  { protocol: "https", hostname: "step-now.de" },
  { protocol: "https", hostname: "images.unsplash.com" },
  { protocol: "https", hostname: "media.oneweb.mercedes-benz.com" },
  { protocol: "http", hostname: "localhost" },
  { protocol: "http", hostname: "127.0.0.1" },
];

const backendBase =
  process.env.NEXT_PUBLIC_API_URL || process.env.INTERNAL_API_URL || process.env.BACKEND_API_URL;
if (backendBase) {
  try {
    const parsed = new URL(backendBase);
    const protocol = parsed.protocol.replace(":", "");
    if (
      !allowedRemoteHosts.some(
        (entry) => entry.protocol === protocol && entry.hostname === parsed.hostname,
      )
    ) {
      allowedRemoteHosts.push({ protocol, hostname: parsed.hostname });
    }
  } catch {}
}

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: { typedRoutes: false },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: allowedRemoteHosts,
  },
  env: { NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "https://step-now.de" },
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
