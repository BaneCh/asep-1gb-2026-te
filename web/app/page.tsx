import { readFileSync } from "fs";
import { join } from "path";
import Hero from "@/components/hero/Hero";

function getStats() {
  const path = join(process.cwd(), "public", "data", "global_stats.json");
  return JSON.parse(readFileSync(path, "utf-8"));
}

export default function Home() {
  const stats = getStats();
  return (
    <main>
      <Hero stats={stats} />
    </main>
  );
}