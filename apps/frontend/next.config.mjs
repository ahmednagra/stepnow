// apps/frontend/next.config.mjs
// Next.js config. Allows next/image to optimize step-now.de and images.unsplash.com (DSGVO note: production should self-host).

/** @type {import('next').NextConfig} */
const nextConfig = {
reactStrictMode: true,
poweredByHeader: false,
experimental: { typedRoutes: false },
images: {
formats: ["image/avif", "image/webp"],
remotePatterns: [
{ protocol: "https", hostname: "step-now.de" },
{ protocol: "https", hostname: "images.unsplash.com" },
],
},
env: { NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "https://step-now.de" },
};

export default nextConfig;
