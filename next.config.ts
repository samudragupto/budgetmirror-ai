import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lint runs separately in CI (`npm run lint`); keep builds focused on typecheck + compile.
  eslint: { ignoreDuringBuilds: true },
  // Leaflet ships plain CSS + images; no special handling needed beyond client-only import.
  transpilePackages: ["react-leaflet"],
};

export default nextConfig;
