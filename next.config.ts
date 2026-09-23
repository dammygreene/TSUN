import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Local fonts only. next/font/google is unusable in this sandbox (blocked egress)
  // and the production build must not depend on a Google Fonts fetch at runtime.
  // We bundle Geist from the `geist` npm package instead.
  transpilePackages: ["geist"],
  experimental: {
    // Keep client payload controlled per build-prompt §23.
    optimizePackageImports: ["motion", "@solana/web3.js", "lightweight-charts"],
  },
};

export default nextConfig;
