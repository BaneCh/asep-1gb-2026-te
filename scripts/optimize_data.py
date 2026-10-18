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

import re
import sys
import json
import shutil
from pathlib import Path
from collections import Counter, defaultdict

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
WEB_DATA = ROOT / "web" / "public" / "data"
CHUNK_SIZE = 1000

# Generated αρχεία που ξαναγράφονται σε κάθε εκτέλεση (τα geo/positions όχι)
GENERATED_FILES = ["search_index.json", "chunk_index.json", "eidikotites_stats.json",
                   "global_stats.json", "eidikotites_index.json", "theseis_stats.json",
                   "proson_impact.json"]
GENERATED_DIRS = ["chunks", "eidikotites"]


def specialty_label(eidikotita: str) -> str:
    """Ενιαίο όνομα ειδικότητας ΦΕΚ — ίδιο με το specialtyLabel() του χάρτη
    (web/app/xartis/page.tsx): ενώνει τις παραλλαγές «(ΙΔΑΧ)*», «Ή»/«ή»,
    «ΔΙΟΙΚΗΤΙΚΟΥ- ΛΟΓΙΣΤΙΚΟΥ» και κάνει το «ΤΕ Χ ΕΙΔ. ΤΕ Χ» απλώς «ΤΕ Χ»."""
    s = re.sub(r"\(ΙΔΑΧ\)\*?", "", eidikotita or "")
    s = s.replace("Ή", "ή")
    s = re.sub(r"-\s+", "-", s)
    s = re.sub(r"\s+", " ", s).strip()
    m = re.fullmatch(r"(.+?) ΕΙΔ\. (.+)", s)
    return m.group(1) if m and m.group(1) == m.group(2) else s


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
        # «Βάση»: η χαμηλότερη βαθμολογία με την οποία έγινε διορισμός μέσω του πίνακα
        dior_vaths = [r["vathmologia"] for r in records
                      if r.get("dioristike") and r.get("vathmologia") is not None]
        eid_stats[slug] = {
            "count": len(records),
            "unique_candidates": len(unique),
            "dioristoi": dioristoi,
            "vasi": min(dior_vaths) if dior_vaths else None,
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

    # ============ 4β. ΚΑΛΥΜΜΕΝΕΣ / ΑΔΙΑΘΕΤΕΣ ΘΕΣΕΙΣ ============
    # Καλυμμένες θέσεις κωδικού = διοριστέοι με αυτή τη θέση διορισμού.
    print("\nΔημιουργία στατιστικών θέσεων (αδιάθετες)...")
    filled_by_kod = defaultdict(int)
    for r in all_data:
        if r.get("dioristike"):
            filled_by_kod[r["thesi_diorismou"]] += 1

    def bucket(key_fn):
        acc = defaultdict(lambda: {"theseis": 0, "filled": 0, "kodikoi": 0, "kodikoi_adiathetoi": 0})
        for p in positions:
            b = acc[key_fn(p)]
            filled = min(filled_by_kod.get(p["kod_thesis"], 0), p["theseis"])
            b["theseis"] += p["theseis"]
            b["filled"] += filled
            b["kodikoi"] += 1
            b["kodikoi_adiathetoi"] += 1 if filled < p["theseis"] else 0
        rows = [{"name": k, **v, "adiathetes": v["theseis"] - v["filled"]} for k, v in acc.items()]
        return sorted(rows, key=lambda x: (-x["adiathetes"], x["name"]))

    total_filled = sum(min(filled_by_kod.get(p["kod_thesis"], 0), p["theseis"]) for p in positions)
    theseis_stats = {
        "total_theseis": global_stats["total_theseis"],
        "filled": total_filled,
        "adiathetes": global_stats["total_theseis"] - total_filled,
        "kodikoi_adiathetoi": sum(1 for p in positions
                                  if filled_by_kod.get(p["kod_thesis"], 0) < p["theseis"]),
        "by_eidikotita": bucket(lambda p: specialty_label(p["eidikotita"])),
        "by_perifereia": bucket(lambda p: p["perifereia"]),
    }
    (WEB_DATA / "theseis_stats.json").write_text(
        json.dumps(theseis_stats, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  ✓ theseis_stats.json: {theseis_stats['adiathetes']} αδιάθετες από "
          f"{theseis_stats['total_theseis']} θέσεις")

    # ============ 4γ. ΠΡΟΣΟΝΤΑ ΔΙΟΡΙΣΤΕΩΝ ============
    # Ίδια δομή με το proson_impact.json του 2ΓΒ/2026. Μία εγγραφή ανά διοριστέο.
    print("\nΔημιουργία proson_impact.json (προσόντα διοριστέων)...")
    appointed = [r for r in all_data if r.get("dioristike")]
    n_app = len(appointed)

    def pct(n):
        return round(n / n_app * 100, 1) if n_app else 0

    with_metapt = sum(1 for r in appointed
                      if r.get("metaptyxiako") or r.get("enigaios_metaptyxiakos"))
    with_didakt = sum(1 for r in appointed if r.get("didaktoriko"))
    with_empeiria = sum(1 for r in appointed if (r.get("monades_empeirias") or 0) > 0)
    with_xeni = sum(1 for r in appointed if r.get("xeni_glossa"))
    with_entop = [r for r in appointed if has_entopiotita(r)]
    proson_impact = {
        "total_appointed": n_app,
        "appointed_with_metapt": with_metapt,
        "metapt_pct": pct(with_metapt),
        "appointed_with_didakt": with_didakt,
        "didakt_pct": pct(with_didakt),
        "appointed_with_empeiria": with_empeiria,
        "empeiria_pct": pct(with_empeiria),
        "appointed_with_xeni": with_xeni,
        "xeni_pct": pct(with_xeni),
        "appointed_with_entop": len(with_entop),
        "entop_pct": pct(len(with_entop)),
        "entop_by_category": dict(sorted(
            Counter(r["kod_entopiotitas"] for r in with_entop).items())),
    }
    (WEB_DATA / "proson_impact.json").write_text(
        json.dumps(proson_impact, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  ✓ proson_impact.json {proson_impact}")

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
