"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, ChevronDown, MapPin, Search } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { foreasMatches, mainForeas, subForeas } from "@/lib/foreis";

interface Position {
  kod_thesis: string;
  eidikotita: string;
  foreas: string;
  edra: string;
  perifereia: string;
  dimos: string;
  theseis: number;
}

interface Row extends Position {
  kenes: number;
  sub: string;
}

interface Group {
  name: string;
  rows: Row[];
  theseis: number;
  kenes: number;
}

type SortKey = "theseis" | "alpha";

const PAGE_SIZE = 30;

export default function ForeisPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [kenesByKod, setKenesByKod] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("theseis");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [open, setOpen] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Προ-συμπλήρωση από ?q= ώστε η αναζήτηση να μπορεί να μοιραστεί ως σύνδεσμος
    const initial = new URLSearchParams(window.location.search).get("q");

    Promise.all([
      fetch("/data/positions.json").then((r) => r.json()),
      fetch("/data/theseis_stats.json").then((r) => r.json()),
    ])
      .then(([pos, stats]) => {
        if (initial) setQ(initial);
        setPositions(pos);
        const m: Record<string, number> = {};
        for (const k of stats.kodikoi || []) m[k.kod] = k.adiathetes;
        setKenesByKod(m);
      })
      .catch((e) => console.error("Load error:", e))
      .finally(() => setLoading(false));
  }, []);

  // Νέα αναζήτηση: επαναφορά σελιδοποίησης και ενημέρωση του ?q= (χωρίς νέα εγγραφή στο ιστορικό)
  function updateQuery(value: string) {
    setQ(value);
    setLimit(PAGE_SIZE);
    const url = new URL(window.location.href);
    if (value.trim()) url.searchParams.set("q", value.trim());
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url.toString());
  }

  // Όλοι οι κύριοι φορείς με τις θέσεις τους
  const allGroups = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const p of positions) {
      const name = mainForeas(p.foreas);
      const row: Row = { ...p, kenes: kenesByKod[p.kod_thesis] || 0, sub: subForeas(p.foreas) };
      const list = map.get(name);
      if (list) list.push(row);
      else map.set(name, [row]);
    }
    return Array.from(map, ([name, rows]) => ({ name, rows }));
  }, [positions, kenesByKod]);

  // Φιλτράρισμα: αν ταιριάζει ο κύριος φορέας εμφανίζονται όλες οι θέσεις του,
  // αλλιώς μόνο όσες ταιριάζουν στην υπηρεσία (π.χ. «εφετειο θεσσαλονικης»).
  const groups: Group[] = useMemo(() => {
    const out: Group[] = [];
    for (const g of allGroups) {
      const rows = g.rows
        .filter((r) => foreasMatches(r.foreas, q))
        .sort(
          (a, b) =>
            a.sub.localeCompare(b.sub, "el") ||
            a.eidikotita.localeCompare(b.eidikotita, "el") ||
            Number(a.kod_thesis) - Number(b.kod_thesis)
        );
      if (!rows.length) continue;
      out.push({
        name: g.name,
        rows,
        theseis: rows.reduce((s, r) => s + (r.theseis || 0), 0),
        kenes: rows.reduce((s, r) => s + r.kenes, 0),
      });
    }
    out.sort((a, b) =>
      sort === "alpha"
        ? a.name.localeCompare(b.name, "el")
        : b.theseis - a.theseis || a.name.localeCompare(b.name, "el")
    );
    return out;
  }, [allGroups, q, sort]);

  const totals = useMemo(
    () => ({
      kodikoi: groups.reduce((s, g) => s + g.rows.length, 0),
      theseis: groups.reduce((s, g) => s + g.theseis, 0),
      kenes: groups.reduce((s, g) => s + g.kenes, 0),
    }),
    [groups]
  );

  // Με λίγα αποτελέσματα, άνοιξε αυτόματα τους φορείς
  const autoOpen = q.trim() !== "" && groups.length <= 3;
  const isOpen = (name: string) => autoOpen || open.has(name);

  function toggle(name: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  const field =
    "px-3.5 py-3 rounded-xl bg-bg-elevated border border-line text-sm text-body focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

  return (
    <main style={{ minHeight: "100vh", padding: "90px 16px 60px", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            color: "var(--text-muted)",
            textDecoration: "none",
            fontSize: "0.9rem",
            display: "inline-block",
            marginBottom: "2rem",
          }}
        >
          ← Πίσω
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1
            className="font-display"
            style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 700, marginBottom: "1rem" }}
          >
            <span className="text-gradient">Φορείς</span> &amp; θέσεις
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", marginBottom: "2rem", maxWidth: "720px" }}>
            Ψάξε έναν φορέα — δήμο, υπουργείο, νοσοκομείο, πανεπιστήμιο — για να δεις όλες τις θέσεις
            που προκήρυξε, ανά ειδικότητα, και πόσες έμειναν κενές.
          </p>
        </motion.div>

        {/* Αναζήτηση */}
        <div className="glass p-4 sm:p-5 rounded-2xl mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                autoFocus
                type="text"
                value={q}
                onChange={(e) => updateQuery(e.target.value)}
                placeholder="π.χ. Δήμος Θεσσαλονίκης ή Υπουργείο Υποδομών"
                aria-label="Αναζήτηση φορέα"
                className={`${field} w-full pl-10 placeholder:text-dim`}
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Ταξινόμηση"
              className={`${field} sm:w-56`}
            >
              <option value="theseis">Περισσότερες θέσεις πρώτα</option>
              <option value="alpha">Αλφαβητικά</option>
            </select>
          </div>
          {!loading && (
            <div className="flex items-center justify-between gap-3 text-xs text-muted mt-3 flex-wrap">
              <span>
                <strong className="text-heading">{formatNumber(groups.length)}</strong>{" "}
                {groups.length === 1 ? "φορέας" : "φορείς"} ·{" "}
                <strong className="text-heading">{formatNumber(totals.kodikoi)}</strong> κωδικοί ·{" "}
                <strong className="text-heading">{formatNumber(totals.theseis)}</strong> θέσεις ·{" "}
                <strong className="text-heading">{formatNumber(totals.kenes)}</strong> κενές
              </span>
              {q && (
                <button
                  type="button"
                  onClick={() => updateQuery("")}
                  className="text-primary-text underline-offset-2 hover:underline"
                >
                  Καθαρισμός
                </button>
              )}
            </div>
          )}
        </div>

        {loading && <div className="text-center text-primary-text py-12">Φόρτωση φορέων...</div>}

        {!loading && groups.length === 0 && (
          <div className="glass p-8 rounded-2xl text-center text-muted">
            Δεν βρέθηκε φορέας για «{q}».
          </div>
        )}

        <div className="grid gap-3">
          {groups.slice(0, limit).map((g) => {
            const expanded = isOpen(g.name);
            return (
              <div key={g.name} className="glass rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggle(g.name)}
                  aria-expanded={expanded}
                  className="w-full text-left p-4 sm:p-5 flex items-start gap-3 hover:bg-primary/5 transition-colors"
                >
                  <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/15 text-primary-text flex-shrink-0">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold text-heading text-sm sm:text-base break-words">
                      {g.name}
                    </span>
                    <span className="flex items-center gap-2 flex-wrap mt-1.5 text-xs text-muted">
                      <span>
                        {formatNumber(g.theseis)} {g.theseis === 1 ? "θέση" : "θέσεις"} ·{" "}
                        {formatNumber(g.rows.length)} {g.rows.length === 1 ? "κωδικός" : "κωδικοί"}
                      </span>
                      {g.kenes > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/15 border border-primary/50 text-primary-text font-semibold">
                          {g.kenes} {g.kenes === 1 ? "κενή" : "κενές"}
                        </span>
                      )}
                    </span>
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-muted flex-shrink-0 mt-2 transition-transform ${expanded ? "rotate-180" : ""}`}
                  />
                </button>

                {expanded && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                    <div className="flex justify-end mb-2">
                      <Link
                        href={`/xartis?foreas=${encodeURIComponent(g.name)}`}
                        className="inline-flex items-center gap-1.5 text-xs text-primary-text hover:underline underline-offset-2"
                      >
                        <MapPin className="w-3.5 h-3.5" /> Δες τις θέσεις στον χάρτη
                      </Link>
                    </div>
                    <div className="grid gap-2">
                      {g.rows.map((r) => (
                        <Link
                          key={r.kod_thesis}
                          href={`/thesi/${r.kod_thesis}`}
                          className="block p-3.5 rounded-xl bg-surface border border-line hover:border-primary hover:bg-primary/10 transition-all duration-200 group no-underline"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              {r.sub && (
                                <div className="text-xs font-semibold text-primary-text mb-0.5 break-words">{r.sub}</div>
                              )}
                              <div className="text-sm font-medium text-body group-hover:text-heading break-words">
                                {r.eidikotita}
                              </div>
                              <div className="text-xs text-muted mt-0.5">{r.edra || r.perifereia}</div>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <span className="font-mono font-semibold text-sm text-primary-text">#{r.kod_thesis}</span>
                              <span className="text-[11px] text-muted whitespace-nowrap">
                                {r.theseis} {r.theseis === 1 ? "θέση" : "θέσεις"}
                              </span>
                              {r.kenes > 0 && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/15 border border-primary/50 text-primary-text font-semibold whitespace-nowrap">
                                  {r.kenes} {r.kenes === 1 ? "κενή" : "κενές"}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {groups.length > limit && (
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => setLimit((l) => l + PAGE_SIZE)}
              className="px-5 py-2.5 rounded-xl border border-line text-sm text-body hover:border-primary hover:text-heading transition-colors"
            >
              Περισσότεροι φορείς ({formatNumber(groups.length - limit)} ακόμη)
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
