"""
ASEP 1ΓΒ/2026 (ΤΕ) - Data Pipeline
Διαβάζει τα 34 Excel κατάταξης ανά ειδικότητα + το συγκεντρωτικό ΔΙΟΡΙΣΤΕΟΙ,
καθαρίζει, ενοποιεί και εξάγει JSON στο data/.

Διαφορές από τα αρχεία ΠΕ (2ΓΒ/2026):
- Οι στήλες προσόντων/βαθμολογιών έχουν κεφαλίδες 1..14· η σημασία τους
  δίνεται σε υπόμνημα στο τέλος κάθε φύλλου ("1:ΔΙΔΑΚΤΟΡΙΚΟΣ ΤΙΤΛΟΣ", ...).
- Όλα τα κελιά είναι κείμενο (π.χ. Α/Α = "1", βαθμός = "42,84").
- Η ΘΕΣΗ ΔΙΟΡΙΣΜΟΥ επαναλαμβάνεται σε ΟΛΕΣ τις εγγραφές ενός διοριστέου
  (σε κάθε πίνακα/ομάδα προσόντων). Γι' αυτό σημειώνουμε με `dioristike`
  τη μία εγγραφή μέσω της οποίας έγινε ο διορισμός, με έλεγχο από το
  αρχείο ΔΙΟΡΙΣΤΕΟΙ.

Ιδιωτικότητα: εξάγονται μόνο επώνυμο, όνομα, Α.Μ. και masked Α.Δ.Τ.
Δεν εξάγονται πατρώνυμο, ειδικές κατηγορίες (ΕΙΔΙΚΕΣ ΙΔΙΟΤΗΤΕΣ) ούτε
απορριπτέοι.
"""

import re
import sys
import json
import glob
import shutil
from collections import defaultdict
from pathlib import Path

import openpyxl

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# ============ CONFIG ============
ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "raw_excel"
OUT_DIR = ROOT / "data"

DIORISTEOI_PATTERN = "*ΔΙΟΡΙΣΤΕΟΙ*.xlsx"
MAX_SLUG_LEN = 60  # τα Windows έχουν όριο μήκους διαδρομής

# Σταθερές κεφαλίδες στην αρχή κάθε πίνακα κατάταξης
FIXED_COLUMNS = {
    "Α/Α": "aa",
    "Α.Μ. ΑΙΤΗΣΗΣ": "am",
    "ΕΠΩΝΥΜΟ": "eponymo",
    "ΟΝΟΜΑ": "onoma",
    "Α.Δ.Τ.": "adt_masked",
    "ΟΜΑΔΑ ΠΡΟΣΟΝΤΩΝ": "omada_prosonton",
    "ΘΕΣΕΙΣ ΠΟΥ ΑΦΟΡΟΥΝ ΤΗΝ ΙΔΙΑ ΟΜΑΔΑ ΠΡΟΣΟΝΤΩΝ": "theseis_idias_omadas",
    "ΠΡΟΤΙΜΗΣΕΙΣ ΥΠΟΨΗΦΙΟΥ": "protimiseis",
    "ΘΕΣΗ ΔΙΟΡΙΣΜΟΥ": "thesi_diorismou",
    "ΠΙΝΑΚΑΣ": "pinakas",
    "ΒΑΘΜΟΛΟΓΙΑ": "vathmologia",
}

# Υπόμνημα αριθμημένων στηλών -> πεδίο JSON
LEGEND_FIELDS = {
    "ΔΙΔΑΚΤΟΡΙΚΟΣ ΤΙΤΛΟΣ": "didaktoriko",
    "ΜΕΤΑΠΤΥΧΙΑΚΟΣ ΤΙΤΛΟΣ": "metaptyxiako",
    "ΕΝΙΑΙΟΣ ΚΑΙ ΑΔΙΑΣΠΑΣΤΟΣ ΤΙΤΛΟΣ ΜΕΤ. ΕΠΙΠΕΔΟΥ": "enigaios_metaptyxiakos",
    "ΑΡΙΣΤΗ ΓΝΩΣΗ ΞΕΝΗΣ ΓΛΩΣΣΑΣ": "xeni_glossa",
    "ΔΕΥΤΕΡΗ ΑΡΙΣΤΗ ΓΝΩΣΗ ΞΕΝΗΣ ΓΛΩΣΣΑΣ": "deuteri_xeni",
    "ΑΡΙΘΜΟΣ ΜΗΝΩΝ ΕΜΠΕΙΡΙΑΣ": "minas_empeirias",
    "ΜΟΝΑΔΕΣ ΓΙΑ ΤΗΝ ΕΜΠΕΙΡΙΑ": "monades_empeirias",
    "ΚΩΔΙΚΟΣ ΕΝΤΟΠΙΟΤΗΤΑΣ": "kod_entopiotitas",
    "ΚΩΔ. ΘΕΣΗΣ ΓΙΑ ΤΗΝ ΕΝΤΟΠΙΟΤΗΤΑ": "kod_thesi_entop",
    "ΜΟΝΑΔΕΣ ΕΝΤΟΠΙΟΤΗΤΑΣ": "monades_entop",
    "Μαθ 1 : ΕΞΕΤΑΣΗ ΓΝΩΣΕΩΝ": "math1",
    "Μαθ 2 : ΔΟΚΙΜΑΣΙΑ ΔΕΞΙΟΤΗΤΩΝ ΚΑΙ ΕΡΓΑΣΙΑΚΗΣ ΑΠΟΤΕΛΕΣΜΑΤΙΚΟΤΗΤΑΣ": "math2",
    "ΣΥΝΟΛΙΚΗ ΒΑΘΜΟΛΟΓΙΑ ΓΡΑΠΤΟΥ ΔΙΑΓΩΝΙΣΜΟΥ 1Γ/2025": "synolo_graptou",
    "ΣΕΙΡΑ ΗΛΕΚΤΡΟΝΙΚΗΣ ΚΛΗΡΩΣΗΣ (παρ.4. άρθρ.15, ν.4765/2021)": "seira_klirosis",
}

NUMERIC_FIELDS = {
    "vathmologia", "minas_empeirias", "monades_empeirias", "monades_entop",
    "math1", "math2", "synolo_graptou", "seira_klirosis",
}

# Σειρά πεδίων στο εξαγόμενο record
RECORD_FIELDS = [
    "aa", "am", "eponymo", "onoma", "adt_masked", "omada_prosonton",
    "theseis_idias_omadas", "protimiseis", "thesi_diorismou", "dioristike",
    "pinakas", "didaktoriko", "metaptyxiako", "enigaios_metaptyxiakos",
    "xeni_glossa", "deuteri_xeni", "minas_empeirias", "monades_empeirias",
    "kod_entopiotitas", "kod_thesi_entop", "monades_entop", "math1", "math2",
    "synolo_graptou", "seira_klirosis", "vathmologia",
]


# ============ HELPERS ============

def slugify(text: str) -> str:
    """Μετατρέπει ελληνικό κείμενο σε URL-friendly slug."""
    text = text.strip().lower()
    greek_map = {
        'α':'a','β':'v','γ':'g','δ':'d','ε':'e','ζ':'z','η':'i','θ':'th',
        'ι':'i','κ':'k','λ':'l','μ':'m','ν':'n','ξ':'x','ο':'o','π':'p',
        'ρ':'r','σ':'s','ς':'s','τ':'t','υ':'y','φ':'f','χ':'ch','ψ':'ps',
        'ω':'o','ά':'a','έ':'e','ή':'i','ί':'i','ό':'o','ύ':'y','ώ':'o',
        'ϊ':'i','ϋ':'y','ΐ':'i','ΰ':'y'
    }
    result = ''.join(greek_map.get(c, c) for c in text)
    result = re.sub(r'[^a-z0-9]+', '-', result).strip('-')
    if len(result) > MAX_SLUG_LEN:
        result = result[:MAX_SLUG_LEN].rsplit('-', 1)[0]
    return result


def clean_str(val) -> str | None:
    if val is None:
        return None
    s = str(val).strip()
    if isinstance(val, float) and s.endswith(".0"):
        s = s[:-2]
    return s or None


def clean_numeric(val):
    """Καθαρίζει αριθμητικές τιμές (π.χ. '80,78' -> 80.78)."""
    s = clean_str(val)
    if s is None:
        return None
    try:
        return float(s.replace(',', '.'))
    except ValueError:
        return None


def mask_adt(val) -> str | None:
    """Το Α.Δ.Τ. έρχεται ήδη masked (***972). Εγγυόμαστε ότι δεν φαίνονται
    ποτέ πάνω από 3 χαρακτήρες, ακόμα κι αν μια πηγή δεν είναι masked."""
    s = clean_str(val)
    if s is None:
        return None
    visible = s.lstrip("*").strip()
    return "***" + visible[-3:]


def split_codes(val: str | None) -> list[str]:
    if not val:
        return []
    return [c for c in re.split(r"\s*-\s*", val.strip()) if c]


def read_sheet(filepath: Path) -> list[tuple]:
    wb = openpyxl.load_workbook(filepath, read_only=True, data_only=True)
    try:
        return [r for r in wb.worksheets[0].iter_rows(values_only=True)]
    finally:
        wb.close()


def find_header(rows: list[tuple], filename: str) -> int:
    for i, r in enumerate(rows[:30]):
        if r and clean_str(r[0]) == "Α/Α":
            return i
    raise ValueError(f"Δεν βρέθηκε γραμμή 'Α/Α' στο {filename}")


def is_data_row(r: tuple) -> bool:
    s = clean_str(r[0])
    return bool(s and s.isdigit())


# ============ LOADERS ============

def load_eidikotita(filepath: Path) -> dict:
    """Φορτώνει ένα Excel ειδικότητας και επιστρέφει dict με metadata + records."""
    rows = read_sheet(filepath)
    hdr = find_header(rows, filepath.name)

    # Όνομα ειδικότητας: η γραμμή πάνω από το header που αρχίζει με "ΤΕ "
    eidikotita_name = None
    for r in rows[:hdr]:
        s = clean_str(r[0])
        if s and s.startswith("ΤΕ "):
            eidikotita_name = re.sub(r"\s+", " ", s)
    if not eidikotita_name:
        raise ValueError(f"Δεν βρέθηκε όνομα ειδικότητας στο {filepath.name}")

    # Υπόμνημα αριθμημένων στηλών στο τέλος του φύλλου
    legend = {}
    for r in rows[hdr + 1:]:
        s = clean_str(r[0])
        m = re.fullmatch(r"(\d+):(.+)", s or "")
        if m:
            legend[m.group(1)] = m.group(2).strip()

    header = [clean_str(h) for h in rows[hdr]]
    col_to_field = {}
    for j, h in enumerate(header):
        if h in FIXED_COLUMNS:
            col_to_field[j] = FIXED_COLUMNS[h]
        elif h in legend:
            label = legend[h]
            if label not in LEGEND_FIELDS:
                raise ValueError(f"Άγνωστη στήλη υπομνήματος '{label}' στο {filepath.name}")
            col_to_field[j] = LEGEND_FIELDS[label]
        elif h in ("ΠΑΤΡΩΝΥΜΟ", "ΙΔΙΟΤΗΤΑ"):
            continue  # δεν εξάγονται (ιδιωτικότητα / πάντα κενό)
        elif h:
            raise ValueError(f"Άγνωστη στήλη '{h}' στο {filepath.name}")

    missing = (set(FIXED_COLUMNS.values()) | set(LEGEND_FIELDS.values())) - set(col_to_field.values())
    if missing:
        raise ValueError(f"Λείπουν στήλες {sorted(missing)} στο {filepath.name}")

    records = []
    for r in rows[hdr + 1:]:
        if not is_data_row(r):
            continue
        raw = {field: r[j] for j, field in col_to_field.items()}
        rec = {}
        for field in RECORD_FIELDS:
            if field == "dioristike":
                rec[field] = False
            elif field == "aa":
                rec[field] = int(clean_str(raw["aa"]))
            elif field == "adt_masked":
                rec[field] = mask_adt(raw[field])
            elif field in NUMERIC_FIELDS:
                rec[field] = clean_numeric(raw[field])
            else:
                rec[field] = clean_str(raw[field])
        records.append(rec)

    return {
        "eidikotita": eidikotita_name,
        "slug": slugify(eidikotita_name),
        "source_file": filepath.name,
        "count": len(records),
        "records": records,
    }


def load_dioristeoi(filepath: Path) -> list[dict]:
    """Διαβάζει το συγκεντρωτικό ΔΙΟΡΙΣΤΕΟΙ (μόνο τα πεδία που χρειάζονται)."""
    rows = read_sheet(filepath)
    hdr = find_header(rows, filepath.name)
    header = [clean_str(h) for h in rows[hdr]]
    idx = {h: j for j, h in enumerate(header)}
    for need in ("Α.Μ. ΑΙΤΗΣΗΣ", "ΚΩΔΙΚΟΣ ΘΕΣΗΣ", "ΒΑΘΜΟΛΟΓΙΑ", "ΦΟΡΕΑΣ", "ΚΛΑΔΟΣ/ΕΙΔΙΚΟΤΗΤΑ"):
        if need not in idx:
            raise ValueError(f"Λείπει η στήλη '{need}' στο {filepath.name}")
    out = []
    for r in rows[hdr + 1:]:
        if not is_data_row(r):
            continue
        out.append({
            "am": clean_str(r[idx["Α.Μ. ΑΙΤΗΣΗΣ"]]),
            "kod_thesis": clean_str(r[idx["ΚΩΔΙΚΟΣ ΘΕΣΗΣ"]]),
            "vathmologia": clean_numeric(r[idx["ΒΑΘΜΟΛΟΓΙΑ"]]),
            "foreas": clean_str(r[idx["ΦΟΡΕΑΣ"]]),
            "klados": clean_str(r[idx["ΚΛΑΔΟΣ/ΕΙΔΙΚΟΤΗΤΑ"]]),
        })
    return out


def mark_appointments(eidikotites: list[dict], dioristeoi: list[dict]) -> dict:
    """Για κάθε διοριστέο βρίσκει ΤΗ μία εγγραφή μέσω της οποίας διορίστηκε:
    ίδιο Α.Μ., η θέση ανήκει στις θέσεις της ομάδας προσόντων της εγγραφής
    και η βαθμολογία ταιριάζει. Σε ισοπαλία μεταξύ πινάκων (π.χ. ΤΕ ΜΗΧΑΝΟΛΟΓΩΝ
    και ο συνδυαστικός «ΗΛΕΚΤΡΟΛΟΓΩΝ ή ΜΗΧΑΝΟΛΟΓΩΝ ή ...»), προτιμάται ο πίνακας
    που ταιριάζει με τον ΚΛΑΔΟ του ΔΙΟΡΙΣΤΕΟΙ (με/χωρίς «ή»)· μετά η καλύτερη σειρά."""
    by_am = defaultdict(list)
    table_of = {}
    for e in eidikotites:
        for rec in e["records"]:
            by_am[rec["am"]].append(rec)
            table_of[id(rec)] = e["eidikotita"]

    report = {"matched": 0, "ties": 0, "unmatched": []}
    for d in dioristeoi:
        cands = [r for r in by_am.get(d["am"], [])
                 if d["kod_thesis"] in split_codes(r["theseis_idias_omadas"])]
        exact = [r for r in cands if r["vathmologia"] == d["vathmologia"]]
        pool = exact or cands
        if not pool:
            report["unmatched"].append(d)
            continue
        if len(pool) > 1:
            report["ties"] += 1
        combined = " ή " in (d["klados"] or "")
        best = min(pool, key=lambda r: ((" ή " in table_of[id(r)]) != combined, r["aa"]))
        best["dioristike"] = True
        report["matched"] += 1
    return report


# ============ MAIN ============

def main():
    print("=" * 60)
    print("ASEP 1ΓΒ/2026 (ΤΕ) - Data Pipeline")
    print("=" * 60)

    excel_files = sorted(Path(f) for f in glob.glob(str(RAW_DIR / "*.xlsx"))
                         if not Path(f).name.startswith("~$"))
    print(f"\nΒρέθηκαν {len(excel_files)} Excel αρχεία.\n")

    eidikotites = []
    dior_file = None
    for i, filepath in enumerate(excel_files, 1):
        name = filepath.name
        print(f"[{i:02d}/{len(excel_files)}] {name}")
        if "ΔΙΟΡΙΣΤΕΟΙ" in name.upper():
            dior_file = filepath
            print("     → συγκεντρωτικό διοριστέων (χρήση για έλεγχο διορισμών)")
            continue
        if "ΑΠΟΡΡΙΠΤΕΟΙ" in name.upper():
            print("     → παραλείπεται (απορριπτέοι δεν δημοσιεύονται)")
            continue
        data = load_eidikotita(filepath)
        eidikotites.append(data)
        print(f"     ✓ {data['count']} εγγραφές | {data['eidikotita']}")

    slugs = [e["slug"] for e in eidikotites]
    dup_slugs = {s for s in slugs if slugs.count(s) > 1}
    if dup_slugs:
        raise SystemExit(f"✗ Διπλά slugs: {dup_slugs}")

    if not dior_file:
        raise SystemExit("✗ Δεν βρέθηκε αρχείο ΔΙΟΡΙΣΤΕΟΙ στο raw_excel/")
    dioristeoi = load_dioristeoi(dior_file)
    report = mark_appointments(eidikotites, dioristeoi)
    print(f"\nΔιοριστέοι στο συγκεντρωτικό: {len(dioristeoi)}")
    print(f"  ✓ αντιστοιχίστηκαν: {report['matched']} (ισοπαλίες που λύθηκαν με σειρά: {report['ties']})")
    if report["unmatched"]:
        raise SystemExit(f"✗ Χωρίς αντιστοίχιση: {len(report['unmatched'])} π.χ. {report['unmatched'][:3]}")

    # Αποθήκευση (καθαρός φάκελος κάθε φορά)
    print("\n" + "=" * 60)
    print("Αποθήκευση JSON...")
    print("=" * 60)
    OUT_DIR.mkdir(exist_ok=True)
    all_eid = OUT_DIR / "eidikotites"
    if all_eid.exists():
        shutil.rmtree(all_eid)
    all_eid.mkdir()

    for e in eidikotites:
        e["dioristoi"] = sum(1 for r in e["records"] if r["dioristike"])
        with open(all_eid / f"{e['slug']}.json", "w", encoding="utf-8") as fp:
            json.dump(e, fp, ensure_ascii=False, indent=2)

    index = [{"eidikotita": e["eidikotita"], "slug": e["slug"], "count": e["count"]}
             for e in eidikotites]
    with open(OUT_DIR / "eidikotites_index.json", "w", encoding="utf-8") as fp:
        json.dump(index, fp, ensure_ascii=False, indent=2)

    all_records = [{**rec, "eidikotita": e["eidikotita"], "slug": e["slug"]}
                   for e in eidikotites for rec in e["records"]]
    with open(OUT_DIR / "all_candidates.json", "w", encoding="utf-8") as fp:
        json.dump(all_records, fp, ensure_ascii=False, indent=2)

    total = sum(e["count"] for e in eidikotites)
    stats = {
        "total_eidikotites": len(eidikotites),
        "total_records": total,
        "unique_candidates": len({r["am"] for r in all_records}),
        "total_dioristoi": sum(e["dioristoi"] for e in eidikotites),
        "top_eidikotites": sorted(index, key=lambda x: -x["count"])[:10],
    }
    with open(OUT_DIR / "stats_overview.json", "w", encoding="utf-8") as fp:
        json.dump(stats, fp, ensure_ascii=False, indent=2)

    print(f"\n✓ {len(eidikotites)} ειδικότητες, {total} εγγραφές, "
          f"{stats['unique_candidates']} μοναδικοί υποψήφιοι, {stats['total_dioristoi']} διοριστέοι")
    print(f"✓ Αποθηκεύτηκαν στο {OUT_DIR}/")


if __name__ == "__main__":
    main()
