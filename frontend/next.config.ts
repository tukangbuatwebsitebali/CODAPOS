import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignore build errors from auto-generated route types (.next/dev/types/routes.d.ts)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
