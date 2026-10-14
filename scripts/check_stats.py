"""Γρήγορη αναφορά στατιστικών από το data/all_candidates.json (1ΓΒ/2026 ΤΕ)."""

import sys
import json
from pathlib import Path
from collections import Counter

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
data = json.loads((ROOT / "data" / "all_candidates.json").read_text(encoding="utf-8"))

unique = {r["am"] for r in data}
dioristoi = [r for r in data if r.get("dioristike")]
print(f"Εγγραφές (υποψήφιος × πίνακας × ομάδα): {len(data):,}")
print(f"Μοναδικοί υποψήφιοι: {len(unique):,}")
print(f"Διοριστέοι: {len(dioristoi):,} ({len(dioristoi) / len(unique) * 100:.1f}%)")

print("\n=== Top 10 ειδικότητες (εγγραφές) ===")
for eid, cnt in Counter(r["eidikotita"] for r in data).most_common(10):
    print(f"  {cnt:>5}  {eid}")

vaths = [r["vathmologia"] for r in dioristoi if r.get("vathmologia") is not None]
if vaths:
    print("\n=== Βαθμολογίες διοριστέων ===")
    print(f"  Min: {min(vaths):.2f}  Max: {max(vaths):.2f}  Μέση: {sum(vaths) / len(vaths):.2f}")

print("\n=== Τίτλοι / εντοπιότητα (μοναδικοί υποψήφιοι) ===")
print(f"  Με μεταπτυχιακό: {len({r['am'] for r in data if r.get('metaptyxiako')}):,}")
print(f"  Με διδακτορικό: {len({r['am'] for r in data if r.get('didaktoriko')}):,}")
print(f"  Με εντοπιότητα: {len({r['am'] for r in data if r.get('kod_entopiotitas') not in (None, '0')}):,}")
