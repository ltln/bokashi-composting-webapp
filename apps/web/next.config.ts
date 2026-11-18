import path from "node:path";
import type { NextConfig } from "next";

// Monorepo root, so standalone output traces workspace packages (contracts).
const repoRoot = path.join(__dirname, "../..");

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: repoRoot,
  turbopack: { root: repoRoot },
  transpilePackages: ["@bokashi/contracts"],
  poweredByHeader: false,
  reactStrictMode: true,
  // Dev only: `next dev` rejects the HMR websocket from 127.0.0.1 (it treats the
  // host as cross-origin), and a page that never gets HMR never hydrates, so the
  // animations and the player stay frozen. Localhost works without this.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
