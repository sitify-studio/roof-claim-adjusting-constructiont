import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

function getApiOriginForRewrites(): string {
  const raw =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    "http://localhost:5000/api";
  try {
    const normalized = raw.startsWith("http")
      ? raw
      : `http://localhost:5000${raw.startsWith("/") ? raw : `/${raw}`}`;
    const withApi = /\/api$/i.test(normalized)
      ? normalized
      : `${normalized.replace(/\/$/, "")}/api`;
    return new URL(withApi).origin;
  } catch {
    return "http://localhost:5000";
  }
}

function buildImageRemotePatterns(): RemotePattern[] {
  const patterns: RemotePattern[] = [
    { protocol: "http", hostname: "localhost", port: "5000", pathname: "/api/uploads/**" },
    { protocol: "http", hostname: "127.0.0.1", port: "5000", pathname: "/api/uploads/**" },
  ];

  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!raw || raw.startsWith("/")) return patterns;

  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    const protocol = u.protocol.replace(":", "") as "http" | "https";
    const hostPattern = { protocol, hostname: u.hostname, ...(u.port ? { port: u.port } : {}) };

    patterns.push({ ...hostPattern, pathname: "/**" });
  } catch {
    /* ignore invalid env */
  }

  return patterns;
}

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp"],
    remotePatterns: buildImageRemotePatterns(),
  },
  async rewrites() {
    const apiOrigin = getApiOriginForRewrites();
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${apiOrigin}/api/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;