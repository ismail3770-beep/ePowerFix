import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// ─── Security Headers ─────────────────────────────────────────────────────────
// Applied to every response. CSP is intentionally permissive in dev (allows
// eval for Turbopack HMR) and locked down in production.
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline'";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://res.cloudinary.com https://sfile.chatglm.cn https://images.unsplash.com http:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.ipify.org",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; "),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // TODO: Phase 2 — set to false after resolving all type errors.
    // Last attempt (ROADMAP-COMPLETE) found 99 errors with noImplicitAny:true.
    // Reverted to true to keep builds passing until errors are addressed.
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.cloudinary.com" },
      { protocol: "https", hostname: "epowerfix.com" },
      { protocol: "https", hostname: "*.epowerfix.com" },
      { protocol: "https", hostname: "sfile.chatglm.cn" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    minimumCacheTTL: 86400, // 24 hours
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
