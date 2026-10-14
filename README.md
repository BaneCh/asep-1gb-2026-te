# ΑΣΕΠ 1ΓΒ/2026 (ΤΕ) — Results Explorer

An interactive site for the **final results of ASEP announcement 1ΓΒ/2026**: 2,628 permanent
positions for **Technological Education (ΤΕ)** graduates, filled from the 1Γ/2025 written exam.

- 34 ranking tables (one per specialty) · 22,542 ranking rows · 9,360 unique candidates
- 2,407 appointed (διοριστέοι) · 1,815 position codes · 2,628 positions (221 left unfilled)
- Search by ΑΜ or name, specialty pages, position pages, statistics and a map of positions

Official sources: [ASEP results page](https://info.asep.gr/node/79995) ·
[ΦΕΚ of the announcement (Α.Σ.Ε.Π. 11/25.02.2026)](https://ia37rg02wpsa01.blob.core.windows.net/fek/10/2026/20261000011.pdf)

## Credits

1ΓΒ/2026 (ΤΕ) version by [Alexandros Veskos](https://www.linkedin.com/in/alex-veskos/).

Inspired by, and source code taken from, the open-source [ASEP 2ΓΒ/2026 Analytics Hub](https://github.com/trooperas/asep-2gb-2026-analytics)
by [Fokion](https://www.linkedin.com/in/fokionas/), used with permission. For the **ΠΕ results
of 2ΓΒ/2026**, see his site: [asep-2gb-2026.vercel.app](https://asep-2gb-2026.vercel.app/). The design,
map and original data structure are his work; this repository adapts them to the ΤΕ files.
His original handover document is kept in [docs/HANDOVER-2GB-original.md](docs/HANDOVER-2GB-original.md).

## Repository layout

```text
raw_excel/        36 Excel files from ASEP — NOT in the repo (see note below)
source_docs/      ΦΕΚ of the announcement (PDF) — source of the positions list
scripts/          Python data pipeline
data/             Generated intermediate JSON — not in the repo, created by the pipeline
web/              Next.js app; web/public/data/ holds the generated JSON it serves
```

## Rebuilding the data

Requirements: Python 3.10+ (Windows: use `py`), Node.js 20+.

```powershell
# 1. One-time setup (from the repository root)
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt

# 2. Download the 36 Excel files from the ASEP results page into raw_excel/
#    (the ΦΕΚ PDF is already in source_docs/fek_1GB_2026.pdf)

# 3. Run the pipeline, in this order
python scripts\build_data.py      # Excel → data/ (34 specialties, marks the 2,407 appointments)
python scripts\parse_fek.py       # ΦΕΚ PDF → data/positions.json, copied to web/public/data/
python scripts\optimize_data.py   # data/ → web/public/data/ (search index, chunks, stats)
python scripts\validate.py        # consistency + privacy checks; exits 1 on any failure
```

**Why the Excel files are not in the repo:** ASEP's original files also contain fields this site
deliberately does not publish (father's names, the special-category flag, the rejected candidates),
so `raw_excel/` and the intermediate `data/` folder are git-ignored. Download them from the
[ASEP results page](https://info.asep.gr/node/79995) to rebuild. The generated public data in
`web/public/data/` *is* committed, so the website works straight from the repo.

`python scripts\check_stats.py` prints a quick summary. Every script stops with an error if the
input format changes (unknown columns, missing legend, totals that don't add up), so a new or
corrected ASEP file can't silently produce wrong numbers.

### What the pipeline handles

- **Numbered columns.** In the ΤΕ ranking tables the qualification and score columns are headed
  `1`–`14`; their meaning comes from the legend at the bottom of each sheet, which is checked.
- **Text cells.** Every cell is text (`"42,84"`); numbers are converted, Greek decimal comma included.
- **One appointment per person.** ASEP repeats a candidate's appointed position on *every* row of
  that candidate (one row per ranking table and qualification group). `build_data.py` marks the
  single row the appointment was made through (`dioristike: true`), matched against the
  ΔΙΟΡΙΣΤΕΟΙ file; all appointee counts use that flag.
- **Positions.** `parse_fek.py` extracts table Α.1.1 of the ΦΕΚ (pages 25–146) and checks the
  total is 2,628. The map groups positions by regional unit using `web/lib/regions.ts`.

`validate.py` checks: row counts per specialty against each Excel file; appointees = ΔΙΟΡΙΣΤΕΟΙ
(same ΑΜ/position pairs, one per person, never more than a code's positions); the 2,628 total;
that every ΦΕΚ specialty and position code maps to a ranking table; the privacy rules below;
and that every regional unit has a map region and marker.

## Privacy

The site shows no more than ASEP published, and less where possible:

- Public JSON contains **surname, first name, application ΑΜ** and the **masked ID number**
  (`***123`), plus the ranking data ASEP published (rank, qualification group, preferences,
  appointed position, degrees, experience, εντοπιότητα, exam scores, lottery number).
- **Not published:** father's name, the ΕΙΔΙΚΕΣ ΙΔΙΟΤΗΤΕΣ (special-category) flag from the
  ΔΙΟΡΙΣΤΕΟΙ file, and the **rejected candidates** (ΑΠΟΡΡΙΠΤΕΟΙ) file, which is not read at all.
- `validate.py` enforces a whitelist of fields and the ID mask on every public record.

## Running the website

```powershell
cd web
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint
```

Environment variables (optional, e.g. in `web/.env.local` or on Vercel):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Public URL used in metadata, Open Graph and the sitemap. On Vercel the production domain is used if unset. |
| `NEXT_PUBLIC_CONTACT_URL` | Contact link (`mailto:` or URL) on the privacy page for name-removal requests. Defaults to the author's LinkedIn (`web/lib/site.ts`). |

On Vercel, set the project's Root Directory to `web/`.

## Known limitations

- **AI chat is disabled.** `/chat` shows a notice and `/api/chat` returns 503. The original
  implementation is kept, adapted to ΤΕ, in `web/app/chat/_disabled/` and
  `web/app/api/chat/_disabled/` (folders starting with `_` are not routed). To re-enable, move
  both files back and set `GROQ_API_KEY`.
- **`npm run lint` reports ~70 findings** (mostly `no-explicit-any`) inherited from the original
  code base; `npm run build` passes.
- The `freeflow-service/` Flask app and `web/requirements.txt` belong to the original chat setup
  and are not used.
