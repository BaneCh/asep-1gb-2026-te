"""
Έλεγχοι συνέπειας μετά το build (1ΓΒ/2026 ΤΕ). Τρέχει μετά τα
build_data.py, parse_fek.py, optimize_data.py. Επιστρέφει exit code 1 αν
αποτύχει κάποιος έλεγχος.

- Σύνολα ανά ειδικότητα = γραμμές δεδομένων του αντίστοιχου Excel
- Διοριστέοι = γραμμές του ΔΙΟΡΙΣΤΕΟΙ, ένας ανά Α.Μ., σε υπαρκτούς κωδικούς
  θέσεων, όχι περισσότεροι από τις θέσεις κάθε κωδικού, σύνολο ≤ 2.628
- Καμία ειδικότητα/κωδικός θέσης χωρίς αντιστοίχιση
- Ιδιωτικότητα: μόνο επιτρεπτά πεδία στα public JSON, masked Α.Δ.Τ.,
  κανένας απορριπτέος
- Χάρτης: κάθε περιφερειακή ενότητα έχει marker και ανήκει σε περιφέρεια
"""

import re
import sys
import json
import glob
import filecmp
from pathlib import Path
from collections import Counter, defaultdict

import openpyxl

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "raw_excel"
DATA = ROOT / "data"
WEB = ROOT / "web" / "public" / "data"
EXPECTED_THESEIS = 2628

ALLOWED_CANDIDATE_FIELDS = {
    "aa", "am", "eponymo", "onoma", "adt_masked", "omada_prosonton",
    "theseis_idias_omadas", "protimiseis", "thesi_diorismou", "dioristike",
    "pinakas", "didaktoriko", "metaptyxiako", "enigaios_metaptyxiakos",
    "xeni_glossa", "deuteri_xeni", "minas_empeirias", "monades_empeirias",
    "kod_entopiotitas", "kod_thesi_entop", "monades_entop", "math1", "math2",
    "synolo_graptou", "seira_klirosis", "vathmologia", "eidikotita", "slug",
}
ALLOWED_SEARCH_FIELDS = {"am", "slug", "aa", "eponymo", "onoma"}

failures = []


def check(cond: bool, msg: str):
    print(("  ✓ " if cond else "  ✗ ") + msg)
    if not cond:
        failures.append(msg)


def sheet_rows(path: Path):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    rows = list(wb.worksheets[0].iter_rows(values_only=True))
    wb.close()
    hdr = next(i for i, r in enumerate(rows) if r and str(r[0]).strip() == "Α/Α")
    header = [str(h).strip() if h is not None else "" for h in rows[hdr]]
    data = [r for r in rows[hdr + 1:] if r[0] is not None and str(r[0]).strip().isdigit()]
    return header, data


def load(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def main():
    candidates = load(DATA / "all_candidates.json")
    positions = load(DATA / "positions.json")
    eid_stats = load(WEB / "eidikotites_stats.json")
    global_stats = load(WEB / "global_stats.json")
    by_slug = defaultdict(list)
    for r in candidates:
        by_slug[r["slug"]].append(r)

    print("\n[1] Σύνολα ανά ειδικότητα (JSON vs Excel)")
    files = sorted(Path(f) for f in glob.glob(str(RAW / "*.xlsx"))
                   if "ΔΙΟΡΙΣΤΕΟΙ" not in f and "ΑΠΟΡΡΙΠΤΕΟΙ" not in f
                   and not Path(f).name.startswith("~$"))
    per_file = {}
    for f in files:
        js = load(DATA / "eidikotites" / f"{_slug_for(f)}.json")
        _, data = sheet_rows(f)
        per_file[js["slug"]] = len(data)
        if js["count"] != len(data):
            check(False, f"{js['eidikotita']}: JSON {js['count']} ≠ Excel {len(data)}")
    check(len(per_file) == len(files) == len(by_slug) == len(eid_stats),
          f"{len(files)} αρχεία ειδικοτήτων → {len(by_slug)} ειδικότητες στα δεδομένα / {len(eid_stats)} στα stats")
    check(all(per_file[s] == len(by_slug[s]) == eid_stats[s]["count"] for s in per_file),
          f"πλήθος εγγραφών ταιριάζει παντού (σύνολο {sum(per_file.values()):,})")

    print("\n[2] Διοριστέοι")
    dior_file = next(RAW.glob("*ΔΙΟΡΙΣΤΕΟΙ*.xlsx"))
    header, dior = sheet_rows(dior_file)
    i_am, i_kod = header.index("Α.Μ. ΑΙΤΗΣΗΣ"), header.index("ΚΩΔΙΚΟΣ ΘΕΣΗΣ")
    dior_pairs = {(str(r[i_am]).strip(), str(r[i_kod]).strip()) for r in dior}
    flagged = [r for r in candidates if r["dioristike"]]
    flagged_pairs = {(r["am"], r["thesi_diorismou"]) for r in flagged}
    check(len(flagged) == len(dior) == len(dior_pairs),
          f"διοριστέοι στα δεδομένα {len(flagged):,} = γραμμές ΔΙΟΡΙΣΤΕΟΙ {len(dior):,}")
    check(flagged_pairs == dior_pairs, "ίδια ζεύγη (Α.Μ., κωδικός θέσης) με το ΔΙΟΡΙΣΤΕΟΙ")
    check(len({r["am"] for r in flagged}) == len(flagged), "κάθε διοριστέος μετράται μία φορά")
    check(global_stats["total_dioristoi"] == len(flagged)
          and sum(s["dioristoi"] for s in eid_stats.values()) == len(flagged),
          "global_stats / eidikotites_stats συμφωνούν")

    print("\n[3] Θέσεις προκήρυξης (ΦΕΚ)")
    pos_by_kod = {p["kod_thesis"]: p for p in positions}
    total_theseis = sum(p["theseis"] for p in positions)
    check(total_theseis == EXPECTED_THESEIS, f"σύνολο θέσεων {total_theseis:,} (αναμένεται {EXPECTED_THESEIS:,})")
    check(len(pos_by_kod) == len(positions), f"{len(positions):,} μοναδικοί κωδικοί θέσεων")
    filled = Counter(r["thesi_diorismou"] for r in flagged)
    unknown = [k for k in filled if k not in pos_by_kod]
    check(not unknown, f"όλοι οι κωδικοί διορισμού υπάρχουν στο ΦΕΚ {unknown[:5] if unknown else ''}")
    over = [k for k, n in filled.items() if k in pos_by_kod and n > pos_by_kod[k]["theseis"]]
    check(not over, f"κανένας κωδικός με περισσότερους διοριστέους από θέσεις {over[:5] if over else ''}")
    check(len(flagged) <= total_theseis,
          f"διοριστέοι {len(flagged):,} / θέσεις {total_theseis:,} → αδιάθετες {total_theseis - len(flagged):,}")
    unfilled_codes = sum(1 for p in positions if filled.get(p["kod_thesis"], 0) < p["theseis"])
    print(f"    (κωδικοί με τουλάχιστον μία αδιάθετη θέση: {unfilled_codes})")
    check(filecmp.cmp(DATA / "positions.json", WEB / "positions.json", shallow=False),
          "web/public/data/positions.json συγχρονισμένο με data/positions.json")

    print("\n[3β] Αδιάθετες θέσεις & βάσεις (σελίδα Στατιστικά)")
    ts = load(WEB / "theseis_stats.json")
    expected_unfilled = total_theseis - len(flagged)
    check(ts["adiathetes"] == expected_unfilled and ts["filled"] == len(flagged),
          f"theseis_stats: {ts['filled']:,} καλυμμένες + {ts['adiathetes']:,} αδιάθετες = {total_theseis:,}")
    for key in ("by_eidikotita", "by_perifereia"):
        rows = ts[key]
        check(sum(r["adiathetes"] for r in rows) == expected_unfilled
              and sum(r["theseis"] for r in rows) == total_theseis,
              f"{key}: τα επιμέρους αθροίζουν στα σύνολα ({len(rows)} γραμμές)")
    bad_vasi = []
    for s, recs in by_slug.items():
        appointed = [r["vathmologia"] for r in recs if r["dioristike"]]
        expected = min(appointed) if appointed else None
        if eid_stats[s].get("vasi") != expected:
            bad_vasi.append(s)
    check(not bad_vasi, f"βάση κάθε ειδικότητας = χαμηλότερη βαθμολογία διοριστέου {bad_vasi[:3] if bad_vasi else ''}")
    pi = load(WEB / "proson_impact.json")
    n_entop = sum(1 for r in flagged if r["kod_entopiotitas"] not in (None, "", "0"))
    check(pi["total_appointed"] == len(flagged)
          and pi["appointed_with_entop"] == n_entop == sum(pi["entop_by_category"].values())
          and all(0 <= pi[k] <= len(flagged) for k in pi if k.startswith("appointed_with_")),
          f"proson_impact: {pi['total_appointed']:,} διοριστέοι, {n_entop:,} με εντοπιότητα")

    print("\n[4] Καμία ειδικότητα/θέση χωρίς αντιστοίχιση")
    table_codes = defaultdict(set)
    for r in candidates:
        for k in re.split(r"\s*-\s*", r["theseis_idias_omadas"] or ""):
            if k:
                table_codes[k].add(r["slug"])
    no_table = sorted((k for k in pos_by_kod if k not in table_codes), key=int)
    not_in_fek = sorted(k for k in table_codes if k not in pos_by_kod)
    check(not not_in_fek, f"όλοι οι κωδικοί των πινάκων κατάταξης υπάρχουν στο ΦΕΚ {not_in_fek[:5] if not_in_fek else ''}")
    print(f"    (κωδικοί ΦΕΚ χωρίς κανέναν υποψήφιο: {len(no_table)} → {', '.join(no_table)})")
    fek_specs = defaultdict(set)
    for k, p in pos_by_kod.items():
        fek_specs[_norm_spec(p["eidikotita"])] |= table_codes.get(k, set())
    orphan_specs = sorted(s for s, slugs in fek_specs.items() if not slugs)
    check(not orphan_specs, f"κάθε κλάδος/ειδικότητα του ΦΕΚ ({len(fek_specs)}) αντιστοιχεί σε πίνακα κατάταξης"
          + (f" — χωρίς πίνακα: {orphan_specs}" if orphan_specs else ""))
    empty = [s for s, st in eid_stats.items() if st["count"] == 0]
    check(not empty, "καμία κενή ειδικότητα")

    print("\n[5] Ιδιωτικότητα (public JSON)")
    bad_fields, bad_adt, rows = set(), [], 0
    for f in (WEB / "chunks").glob("*.json"):
        for r in load(f):
            rows += 1
            bad_fields |= set(r) - ALLOWED_CANDIDATE_FIELDS
            if r.get("adt_masked") and not re.fullmatch(r"\*\*\*\S{0,3}", r["adt_masked"]):
                bad_adt.append(r["adt_masked"])
    check(rows == len(candidates), f"chunks περιέχουν {rows:,} εγγραφές")
    check(not bad_fields, f"μόνο επιτρεπτά πεδία στα chunks {sorted(bad_fields) if bad_fields else ''}")
    check(not bad_adt, f"όλα τα Α.Δ.Τ. masked (***ΧΧΧ) {bad_adt[:3] if bad_adt else ''}")
    search = load(WEB / "search_index.json")
    check(all(set(e) <= ALLOWED_SEARCH_FIELDS for e in search), "search_index: μόνο Α.Μ./επώνυμο/όνομα/slug/σειρά")
    rej_file = next(RAW.glob("*ΑΠΟΡΡΙΠΤΕΟΙ*.xlsx"), None)
    if rej_file:
        h, rej = sheet_rows(rej_file)
        rej_am = {str(r[1]).strip() for r in rej}
        public_am = {e["am"] for e in search}
        check(not (rej_am & public_am), f"κανένας από τους {len(rej_am)} απορριπτέους στα public δεδομένα")
    public_text = "".join(p.read_text(encoding="utf-8") for p in WEB.glob("*.json"))
    check("patronymo" not in public_text and "eidikes_idiotites" not in public_text and "idiotita" not in public_text,
          "χωρίς πατρώνυμο / ειδικές κατηγορίες")

    print("\n[6] Χάρτης")
    regions_ts = (ROOT / "web" / "lib" / "regions.ts").read_text(encoding="utf-8")
    mapped = set(re.findall(r'"([Α-ΩΪΫ][Α-ΩΪΫ \-]+)"', regions_ts))
    cities = load(WEB / "cities-geo.json")
    units = {p["perifereia"] for p in positions}
    check(not (units - mapped), f"κάθε περιφερειακή ενότητα ({len(units)}) ανήκει σε περιφέρεια {sorted(units - mapped)}")
    check(not (units - set(cities)), f"κάθε περιφερειακή ενότητα έχει marker {sorted(units - set(cities))}")

    print()
    if failures:
        print(f"✗ {len(failures)} έλεγχοι απέτυχαν")
        sys.exit(1)
    print("✓ Όλοι οι έλεγχοι πέρασαν")


def _slug_for(path: Path) -> str:
    for p in (DATA / "eidikotites").glob("*.json"):
        if load(p)["source_file"] == path.name:
            return p.stem
    raise SystemExit(f"✗ Δεν βρέθηκε JSON για {path.name}")


def _norm_spec(s: str) -> str:
    s = s.replace("(ΙΔΑΧ)*", "").replace("Ή", "ή")
    return re.sub(r"\s+", " ", s).strip()


if __name__ == "__main__":
    main()
