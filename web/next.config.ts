import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Κρύβει το εργαλείο developer του Next.js («N», κάτω αριστερά) και στο
  // `npm run dev`. Στην παραγωγή (Vercel) δεν εμφανίζεται ποτέ.
  devIndicators: false,

  // Τα API routes και τα metadata των ειδικοτήτων διαβάζουν τα JSON από
  // public/data με readFileSync. Στο Vercel οι server functions δεν παίρνουν
  // αυτόματα τα αρχεία του public/, οπότε τα δηλώνουμε ρητά.
  outputFileTracingIncludes: {
    "/api/**/*": ["./public/data/**/*.json"],
    "/eidikotita/*": ["./public/data/eidikotites_index.json"],
  },

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
