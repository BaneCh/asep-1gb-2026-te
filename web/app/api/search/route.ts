import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

let searchIndex: any[] | null = null;

function getSearchIndex(): any[] {
  if (!searchIndex) {
    const path = join(process.cwd(), "public", "data", "search_index.json");
    searchIndex = JSON.parse(readFileSync(path, "utf-8"));
  }
  return searchIndex!;
}

// Αφαιρεί τόνους + lowercase + trim
function normalize(s: string): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQ = (searchParams.get("q") || "").trim();

  if (!rawQ || rawQ.length < 2) {
    return NextResponse.json({ results: [], count: 0 });
  }

  const q = normalize(rawQ);
  const index = getSearchIndex();
  const results: any[] = [];
  const seen = new Set<string>();

  for (const entry of index) {
    const am = normalize(entry.am);
    const ep = normalize(entry.eponymo);
    const on = normalize(entry.onoma);

    if (am.includes(q) || ep.includes(q) || on.includes(q)) {
      const key = `${entry.am}__${entry.slug}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(entry);
      if (results.length >= 30) break;
    }
  }

  return NextResponse.json({ results, count: results.length });
}