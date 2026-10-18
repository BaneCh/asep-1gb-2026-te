import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

function findAllByAm(am: string): any[] {
  const chunksDir = join(process.cwd(), "public", "data", "chunks");
  const chunkIndexPath = join(
    process.cwd(),
    "public",
    "data",
    "chunk_index.json"
  );

  if (!existsSync(chunkIndexPath)) return [];

  const chunkIndex: Record<string, string[]> = JSON.parse(
    readFileSync(chunkIndexPath, "utf-8")
  );

  const targetAm = String(am).replace(/\.0$/, "");
  const matches: any[] = [];

  for (const [slug, chunks] of Object.entries(chunkIndex)) {
    for (const chunkName of chunks) {
      const chunkPath = join(chunksDir, chunkName);
      const chunk = JSON.parse(readFileSync(chunkPath, "utf-8"));
      for (const c of chunk) {
        if (String(c.am).replace(/\.0$/, "") === targetAm) {
          matches.push({ ...c, eidikotitaSlug: slug });
        }
      }
    }
  }
  return matches;
}

// Σειρά αναπλήρωσης (scripts/optimize_data.py → epilaxontes.json). Φορτώνεται μία
// φορά ανά instance: { vasi: {kod: βάση}, candidates: {am: [[kod, προτίμηση, βαθμός, προηγούνται]]} }
let epilaxontesCache: {
  vasi: Record<string, number>;
  candidates: Record<string, [string, number, number, number][]>;
} | null = null;
let positionsCache: Record<string, any> | null = null;

function getEpilaxontes(am: string) {
  const dataDir = join(process.cwd(), "public", "data");
  if (!epilaxontesCache) {
    const p = join(dataDir, "epilaxontes.json");
    if (!existsSync(p)) return [];
    epilaxontesCache = JSON.parse(readFileSync(p, "utf-8"));
  }
  if (!positionsCache) {
    const list = JSON.parse(readFileSync(join(dataDir, "positions.json"), "utf-8"));
    positionsCache = Object.fromEntries(list.map((p: any) => [p.kod_thesis, p]));
  }
  const rows = epilaxontesCache!.candidates[am] || [];
  return rows.map(([kod, pref, score, ahead]) => {
    const p = positionsCache![kod] || {};
    return {
      kod,
      pref,
      score,
      ahead,
      vasi: epilaxontesCache!.vasi[kod],
      theseis: p.theseis ?? null,
      foreas: p.foreas ?? "",
      perifereia: p.perifereia ?? "",
      eidikotita: p.eidikotita ?? "",
    };
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const am = searchParams.get("am");

  if (!am) {
    return NextResponse.json({ error: "Missing am" }, { status: 400 });
  }

  const candidates = findAllByAm(am);

  if (candidates.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    primary: candidates[0],
    all: candidates,
    count: candidates.length,
    epilaxontes: getEpilaxontes(String(candidates[0].am).replace(/\.0$/, "")),
  });
}