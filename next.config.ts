import type { NextConfig } from "next";

/**
 * Build the allowed-origins list for Server Actions.
 *
 * Sources (evaluated at build-time / startup):
 *  - NEXT_PUBLIC_SITE_URL        – single canonical URL, e.g. https://app.example.com
 *  - NEXT_PUBLIC_ALLOWED_ORIGINS – comma-separated extra origins, e.g. https://preview.example.com,https://staging.example.com
 *
 * localhost:3000 is always included so local dev works without any .env config.
 */
function buildAllowedOrigins(): string[] {
  const origins = new Set<string>(["localhost:3000"]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      // Store only host[:port] — Next.js compares against req.headers.host
      origins.add(new URL(siteUrl).host);
    } catch {
      // ignore malformed URL
    }
  }

  const extra = process.env.NEXT_PUBLIC_ALLOWED_ORIGINS;
  if (extra) {
    extra.split(",").forEach((raw) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      try {
        origins.add(new URL(trimmed).host);
      } catch {
        // accept bare host:port values that don't have a scheme
        origins.add(trimmed);
      }
    });
  }

  return Array.from(origins);
}

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: buildAllowedOrigins(),
    },
  },
};

export default nextConfig;
