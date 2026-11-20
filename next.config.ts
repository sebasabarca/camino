import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A self-contained server in .next/standalone (server.js plus only the node_modules it needs) for the Docker image.
  output: "standalone",
  poweredByHeader: false,
};

export default nextConfig;
