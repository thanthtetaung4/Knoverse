import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server in .next/standalone so the Docker image
  // doesn't need the full node_modules.
  output: "standalone",
  // This app is its own root; don't let the repo-level package-lock.json
  // make Next treat the whole monorepo as the workspace.
  outputFileTracingRoot: path.join(__dirname),
  turbopack: { root: path.join(__dirname) },
};

export default nextConfig;
