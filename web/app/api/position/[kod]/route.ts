import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

let positionsCache: any[] | null = null;

function getPositions(): any[] {
  if (!positionsCache) {
    const path = join(process.cwd(), "public", "data", "positions.json");
    positionsCache = JSON.parse(readFileSync(path, "utf-8"));
  }
  return positionsCache!;
}

function findCandidatesForPosition(kod: string): any[] {
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

  const targetKod = String(kod).replace(/\.0$/, "");
  const found: any[] = [];

  for (const [slug, chunks] of Object.entries(chunkIndex)) {
    for (const chunkName of chunks) {
      const chunkPath = join(chunksDir, chunkName);
      const chunk = JSON.parse(readFileSync(chunkPath, "utf-8"));
      for (const c of chunk) {
        const kodCandidate = String(c.thesi_diorismou || "").replace(/\.0$/, "");
        // Μόνο η εγγραφή μέσω της οποίας έγινε ο διορισμός (dioristike),
        // αλλιώς ο ίδιος διοριστέος θα εμφανιζόταν μία φορά ανά πίνακα/ομάδα.
        if (c.dioristike && kodCandidate === targetKod) {
          found.push({
            am: String(c.am).replace(/\.0$/, ""),
            eponymo: c.eponymo,
            onoma: c.onoma,
            vathmologia: c.vathmologia,
            aa: c.aa,
            eidikotita: c.eidikotita,
            slug,
            kod_thesis: kodCandidate,
          });
        }
      }
    }
  }

  // Sort by vathmologia (descending)
  found.sort((a, b) => (b.vathmologia || 0) - (a.vathmologia || 0));

  return found;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ kod: string }> }
) {
  const { kod } = await params;

  const positions = getPositions();
  const position = positions.find((p: any) => p.kod_thesis === kod);

  if (!position) {
    return NextResponse.json({ error: "Position not found" }, { status: 404 });
  }

  const candidates = findCandidatesForPosition(kod);

  // Στατιστικά
  const vaths = candidates
    .map((c) => c.vathmologia)
    .filter((v) => typeof v === "number");

  const stats = {
    total: candidates.length,
    avg_vath:
      vaths.length > 0
        ? Math.round((vaths.reduce((a, b) => a + b, 0) / vaths.length) * 100) /
          100
        : null,
    max_vath: vaths.length > 0 ? Math.max(...vaths) : null,
    min_vath: vaths.length > 0 ? Math.min(...vaths) : null,
  };

  return NextResponse.json({
    position,
    candidates,
    stats,
  });
}