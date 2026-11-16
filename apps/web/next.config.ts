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
};

export default nextConfig;
