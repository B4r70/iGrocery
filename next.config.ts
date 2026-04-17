import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Set workspace root explicitly to silence pnpm-workspace.yaml detection warning
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
