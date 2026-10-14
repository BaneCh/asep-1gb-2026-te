"""
Parser για τον ΠΙΝΑΚΑ ΚΑΤΑΝΟΜΗΣ ΘΕΣΕΩΝ (Α.1.1) της προκήρυξης 1ΓΒ/2026
(ΦΕΚ Τεύχος Α.Σ.Ε.Π. 11/25.02.2026). Αντικαθιστά το parse_prokiriksi.py
(που διάβαζε markdown για την 2ΓΒ/2026).

Είσοδος:  source_docs/fek_1GB_2026.pdf
Έξοδος:   data/positions.json  και  web/public/data/positions.json
"""

import re
import sys
import json
import shutil
from pathlib import Path
from collections import Counter

import pdfplumber

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
PDF_FILE = ROOT / "source_docs" / "fek_1GB_2026.pdf"
OUT_FILE = ROOT / "data" / "positions.json"
WEB_FILE = ROOT / "web" / "public" / "data" / "positions.json"

EXPECTED_TOTAL_THESEIS = 2628  # «δύο χιλιάδων εξακοσίων είκοσι οκτώ (2.628) θέσεων»


def clean(text) -> str:
    """Ενώνει τις γραμμές ενός κελιού. Λέξεις κομμένες με '-' στο τέλος
    γραμμής (π.χ. 'ΑΜΠΕΛΟΚΗΠΩΝ-\\nΜΕΝΕΜΕΝΗΣ') ενώνονται χωρίς κενό."""
    if text is None:
        return ""
    s = str(text).replace(" ", " ")
    s = re.sub(r"-\s*\n\s*", "-", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def parse_edra(edra: str) -> dict:
    """
    'ΑΧΑΪΑΣ (Δ. Πατρέων)'      → perifereia 'ΑΧΑΪΑΣ', dimos 'Πατρέων'
    'ΣΥΡΟΥ (ν. Σύρος)'          → perifereia 'ΣΥΡΟΥ', nomos 'Σύρος'
    'ΒΟΡΕΙΟΥ ΤΟΜΕΑ ΑΘΗΝΩΝ'      → perifereia 'ΒΟΡΕΙΟΥ ΤΟΜΕΑ ΑΘΗΝΩΝ'
    (Το πεδίο 'perifereia' είναι στην πράξη η περιφερειακή ενότητα, όπως
    και στο αρχικό project — έτσι το διαβάζει ο χάρτης.)
    """
    result = {"perifereia": "", "dimos": "", "nomos": ""}
    if not edra:
        return result
    # Τυπογραφικό λάθος στο ΦΕΚ: 'ΚΕΝΤΡΙΚΟΥ ΤΟΜΕΑ ΑΘΗΝΩΝ Δ. Αθηναίων)' (λείπει η '(')
    m = re.fullmatch(r"(.+?)\s+((?:Δ|ν)\.\s*[^()]+)\)", edra)
    if m:
        edra = f"{m.group(1)} ({m.group(2)})"
    if "(" in edra and ")" in edra:
        main = edra.split("(")[0].strip()
        inside = edra.split("(", 1)[1].rsplit(")", 1)[0].strip()
        result["perifereia"] = main
        if inside.startswith("Δ.") or inside.startswith("ΔΗΜΟΣ"):
            result["dimos"] = inside.replace("Δ.", "", 1).replace("ΔΗΜΟΣ", "", 1).strip()
        elif inside.startswith("ν.") or inside.startswith("Ν."):
            result["nomos"] = inside[2:].strip()
        else:
            result["dimos"] = inside
    else:
        result["perifereia"] = edra
    return result


def parse_positions() -> list[dict]:
    positions = []
    seen = set()
    with pdfplumber.open(PDF_FILE) as pdf:
        for page in pdf.pages:
            for table in page.extract_tables():
                if not table or not table[0] or "ΘΕΣΗΣ" not in str(table[0][0] or ""):
                    continue
                for row in table[1:]:
                    cells = [clean(c) for c in row]
                    if len(cells) != 9 or not re.fullmatch(r"\d{3,4}", cells[0]):
                        continue  # π.χ. γραμμή «ΣΥΝΟΛΟ ΘΕΣΕΩΝ»
                    kod, eid, organogramma, foreas, edra, titloi, prosonta, entop, theseis = cells
                    if kod in seen:
                        raise SystemExit(f"✗ Διπλός κωδικός θέσης {kod}")
                    if not theseis.isdigit():
                        raise SystemExit(f"✗ Μη αριθμητικό πλήθος θέσεων στον κωδικό {kod}: {theseis!r}")
                    seen.add(kod)
                    e = parse_edra(edra)
                    positions.append({
                        "kod_thesis": kod,
                        "eidikotita": eid,
                        "kod_organogrammatos": organogramma,
                        "foreas": foreas,
                        "foreas_main": foreas,
                        "edra": edra,
                        "perifereia": e["perifereia"],
                        "dimos": e["dimos"],
                        "nomos": e["nomos"],
                        "titloi": titloi,
                        "prosonta": prosonta,
                        "entopiotita": entop,
                        "theseis": int(theseis),
                    })
    return positions


def main():
    print("=" * 60)
    print("Parser ΦΕΚ προκήρυξης 1ΓΒ/2026 (ΤΕ)")
    print("=" * 60)
    if not PDF_FILE.exists():
        raise SystemExit(f"✗ Δεν βρέθηκε {PDF_FILE}. Κατέβασέ το από "
                         "https://ia37rg02wpsa01.blob.core.windows.net/fek/10/2026/20261000011.pdf")

    positions = parse_positions()
    total = sum(p["theseis"] for p in positions)
    print(f"\nΚωδικοί θέσεων: {len(positions):,}")
    print(f"Συνολικές θέσεις: {total:,}")
    if total != EXPECTED_TOTAL_THESEIS:
        raise SystemExit(f"✗ Αναμένονταν {EXPECTED_TOTAL_THESEIS} θέσεις")

    print("\nTop 10 περιφερειακές ενότητες (θέσεις):")
    per = Counter()
    for p in positions:
        per[p["perifereia"]] += p["theseis"]
    for name, c in per.most_common(10):
        print(f"  {c:>5}  {name}")

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(positions, ensure_ascii=False, indent=2), encoding="utf-8")
    WEB_FILE.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(OUT_FILE, WEB_FILE)
    print(f"\n✓ {OUT_FILE.relative_to(ROOT)}")
    print(f"✓ συγχρονίστηκε στο {WEB_FILE.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
