import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output: copy only the minimal runtime + node_modules into the Docker image.
  output: "standalone",
  // Set workspace root explicitly to silence pnpm-workspace.yaml detection warning
  turbopack: {
    root: __dirname,
  },
  // Allow LAN + Tailscale hosts to load dev resources (HMR, chunks) during development.
  allowedDevOrigins: [
    "192.168.178.51",
    "bartoai",
    "bartoai.local",
    "100.106.161.24",
  ],
};

export default nextConfig;
