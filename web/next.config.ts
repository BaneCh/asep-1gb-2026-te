import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Βελτιστοποίηση για μεγάλα datasets
  experimental: {
    largePageDataBytes: 128 * 1000 * 1000, // 128 MB
  },
  // Επιτάχυνση Turbopack σε αργούς δίσκους
  turbopack: {
    resolveAlias: {
      // Τίποτα προς το παρόν
    },
  },
};

export default nextConfig;