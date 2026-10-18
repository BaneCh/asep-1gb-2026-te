import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

function getJson(name: string) {
  const path = join(process.cwd(), "public", "data", name);
  return JSON.parse(readFileSync(path, "utf-8"));
}

export async function GET() {
  const globalStats = getJson("global_stats.json");
  const eidStats = getJson("eidikotites_stats.json");
  const index = getJson("eidikotites_index.json");

  // Top ειδικότητες ανά υποψηφίους
  const topByCount = [...index]
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 15)
    .map((e: any) => ({
      name: e.eidikotita.length > 50
        ? e.eidikotita.substring(0, 50) + "..."
        : e.eidikotita,
      full: e.eidikotita,
      slug: e.slug,
      value: e.count,
    }));

  // Ανά ειδικότητα: σύνολα για τα παρακάτω top
  const eidArray = Object.entries(eidStats).map(([slug, s]: [string, any]) => ({
    slug,
    count: s.count,
    dioristoi: s.dioristoi,
    pososto: s.pososto,
    avg_vath: s.avg_vath,
    max_vath: s.max_vath,
  }));

  // Top ειδικότητες ανά μέση βαθμολογία
  const topByAvg = [...eidArray]
    .filter((e) => e.count >= 20)
    .sort((a, b) => (b.avg_vath || 0) - (a.avg_vath || 0))
    .slice(0, 15);

  // Sunburst: Φορέας → Ειδικότητα (μπορούμε με βάση το slug)
  // Απλοποίηση: Ειδικότητα με το count της
  const sunburstData = {
    name: "1ΓΒ/2026",
    children: [...index]
      .sort((a: any, b: any) => b.count - a.count)
      .map((e: any) => ({
        name: e.eidikotita.length > 30
          ? e.eidikotita.substring(0, 30) + "..."
          : e.eidikotita,
        full: e.eidikotita,
        slug: e.slug,
        value: e.count,
      })),
  };

  // Καλυμμένες / κενές θέσεις (ανά ειδικότητα ΦΕΚ και περιφερειακή ενότητα)
  const theseis = getJson("theseis_stats.json");

  // Προσόντα των διοριστέων (μεταπτυχιακό, εντοπιότητα, εμπειρία, ξένη γλώσσα)
  const proson = getJson("proson_impact.json");

  return NextResponse.json({
    theseis,
    proson,
    global: globalStats,
    topByCount,
    topByAvg,
    sunburst: sunburstData,
  });
}