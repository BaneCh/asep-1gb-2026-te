"""
Βελτιστοποίηση δεδομένων για web (1ΓΒ/2026 ΤΕ):
1. Σπάει το all_candidates.json σε chunks των 1000 εγγραφών.
2. Δημιουργεί ένα ελαφρύ search index (Α.Μ. + Επώνυμο + Όνομα -> slug + aa).
3. Δημιουργεί pre-aggregated stats για κάθε ειδικότητα και global.

Καθαρίζει πρώτα τα παλιά generated αρχεία του web/public/data/ ώστε να μη
μένουν stale (π.χ. παλιά chunks) δημοσιευμένα.

Σημείωση: ένας υποψήφιος εμφανίζεται σε πολλούς πίνακες / ομάδες προσόντων.
«Διοριστέος» μετράται μόνο η εγγραφή με dioristike = true (μία ανά άτομο).
"""

import sys
import json
import shutil
from pathlib import Path
from collections import defaultdict

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
WEB_DATA = ROOT / "web" / "public" / "data"
CHUNK_SIZE = 1000

# Generated αρχεία που ξαναγράφονται σε κάθε εκτέλεση (τα geo/positions όχι)
GENERATED_FILES = ["search_index.json", "chunk_index.json", "eidikotites_stats.json",
                   "global_stats.json", "eidikotites_index.json"]
GENERATED_DIRS = ["chunks", "eidikotites"]


def has_entopiotita(r: dict) -> bool:
    return bool(r.get("kod_entopiotitas")) and r["kod_entopiotitas"] != "0"


def round2(v):
    return round(v, 2) if v is not None else None


def main():
    WEB_DATA.mkdir(parents=True, exist_ok=True)
    for name in GENERATED_FILES:
        (WEB_DATA / name).unlink(missing_ok=True)
    for name in GENERATED_DIRS:
        if (WEB_DATA / name).exists():
            shutil.rmtree(WEB_DATA / name)

    print("Φόρτωση all_candidates.json...")
    all_data = json.loads((DATA_DIR / "all_candidates.json").read_text(encoding="utf-8"))
    print(f"  ✓ {len(all_data):,} εγγραφές")

    # ============ 1. SEARCH INDEX ============
    print("\nΔημιουργία search index...")
    search_index = [
        {"am": r["am"], "slug": r["slug"], "aa": r["aa"],
         "eponymo": r["eponymo"], "onoma": r["onoma"]}
        for r in all_data if r.get("am")
    ]
    (WEB_DATA / "search_index.json").write_text(
        json.dumps(search_index, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"  ✓ {len(search_index):,} entries | "
          f"{(WEB_DATA / 'search_index.json').stat().st_size / 1024 / 1024:.2f} MB")

    # ============ 2. CHUNKS ============
    print("\nΔημιουργία chunks...")
    chunks_dir = WEB_DATA / "chunks"
    chunks_dir.mkdir()

    by_slug = defaultdict(list)
    slug_to_name = {}
    for r in all_data:
        by_slug[r["slug"]].append(r)
        slug_to_name[r["slug"]] = r["eidikotita"]

    chunk_index = {}
    for slug, records in by_slug.items():
        for i in range(0, len(records), CHUNK_SIZE):
            chunk_name = f"{slug}__{i // CHUNK_SIZE}.json"
            (chunks_dir / chunk_name).write_text(
                json.dumps(records[i:i + CHUNK_SIZE], ensure_ascii=False, separators=(",", ":")),
                encoding="utf-8")
            chunk_index.setdefault(slug, []).append(chunk_name)
    (WEB_DATA / "chunk_index.json").write_text(
        json.dumps(chunk_index, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  ✓ {sum(len(v) for v in chunk_index.values())} chunks")

    # ============ 3. STATS ΑΝΑ ΕΙΔΙΚΟΤΗΤΑ ============
    print("\nΔημιουργία stats ανά ειδικότητα...")
    eid_stats = {}
    for slug, records in by_slug.items():
        vaths = [r["vathmologia"] for r in records if r.get("vathmologia") is not None]
        unique = {r["am"] for r in records}
        dioristoi = sum(1 for r in records if r.get("dioristike"))
        eid_stats[slug] = {
            "count": len(records),
            "unique_candidates": len(unique),
            "dioristoi": dioristoi,
            "pososto": round(dioristoi / len(unique) * 100, 1) if unique else 0,
            "min_vath": min(vaths) if vaths else None,
            "max_vath": max(vaths) if vaths else None,
            "avg_vath": round2(sum(vaths) / len(vaths)) if vaths else None,
            "me_metaptyxiako": len({r["am"] for r in records if r.get("metaptyxiako")}),
            "me_entopiotita": len({r["am"] for r in records if has_entopiotita(r)}),
        }
    (WEB_DATA / "eidikotites_stats.json").write_text(
        json.dumps(eid_stats, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  ✓ {len(eid_stats)} ειδικότητες")

    # ============ 4. GLOBAL STATS ============
    print("\nΔημιουργία global stats...")
    positions_path = DATA_DIR / "positions.json"
    positions = json.loads(positions_path.read_text(encoding="utf-8")) if positions_path.exists() else []
    all_vaths = [r["vathmologia"] for r in all_data if r.get("vathmologia") is not None]
    unique_am = {r["am"] for r in all_data}
    total_dioristoi = sum(1 for r in all_data if r.get("dioristike"))
    global_stats = {
        "total_candidates": len(unique_am),
        "total_records": len(all_data),
        "total_dioristoi": total_dioristoi,
        "total_eidikotites": len(by_slug),
        "total_theseis": sum(p["theseis"] for p in positions),
        "total_kodikoi_theseon": len(positions),
        "pososto_epityxias": round(total_dioristoi / len(unique_am) * 100, 1),
        "min_vath": min(all_vaths),
        "max_vath": max(all_vaths),
        "avg_vath": round2(sum(all_vaths) / len(all_vaths)),
        "me_metaptyxiako": len({r["am"] for r in all_data if r.get("metaptyxiako")}),
        "me_entopiotita": len({r["am"] for r in all_data if has_entopiotita(r)}),
    }
    (WEB_DATA / "global_stats.json").write_text(
        json.dumps(global_stats, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  ✓ global_stats.json {global_stats}")

    # ============ 5. EIDIKOTITES INDEX ============
    # count = μοναδικοί υποψήφιοι του πίνακα (όχι εγγραφές ανά ομάδα προσόντων)
    eid_index = [{"eidikotita": slug_to_name[slug], "slug": slug,
                  "count": eid_stats[slug]["unique_candidates"]}
                 for slug in by_slug]
    (WEB_DATA / "eidikotites_index.json").write_text(
        json.dumps(eid_index, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  ✓ eidikotites_index.json ({len(eid_index)} ειδικότητες)")

    print("\n" + "=" * 60)
    print("ΟΛΟΚΛΗΡΩΘΗΚΕ!")
    print("=" * 60)


if __name__ == "__main__":
    main()
