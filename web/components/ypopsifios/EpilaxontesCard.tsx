"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatNumber, formatVathmologia } from "@/lib/utils";

// Σειρά αναπλήρωσης για μη διοριστέους. Τα νούμερα υπολογίζονται στο
// scripts/optimize_data.py (build_epilaxontes) — είναι μετρήσεις από τους
// πίνακες κατάταξης, όχι εκτιμήσεις.

export interface EpilaxonRow {
  kod: string;
  pref: number;
  score: number;
  ahead: number;
  vasi: number;
  theseis: number | null;
  foreas: string;
  perifereia: string;
  eidikotita: string;
}

const PREVIEW = 8;

export default function EpilaxontesCard({ rows }: { rows: EpilaxonRow[] }) {
  const [sort, setSort] = useState<"seira" | "protimisi">("seira");
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(() => {
    const r = [...rows];
    if (sort === "seira") r.sort((a, b) => a.ahead - b.ahead || a.pref - b.pref);
    else r.sort((a, b) => a.pref - b.pref);
    return r;
  }, [rows, sort]);

  if (!rows.length) return null;
  const visible = showAll ? sorted : sorted.slice(0, PREVIEW);
  const anyAboveBase = rows.some((r) => r.score >= r.vasi);

  const sortBtn = (value: typeof sort, label: string) => (
    <button
      type="button"
      onClick={() => setSort(value)}
      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
        sort === value ? "bg-primary text-black" : "text-muted hover:text-heading"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="glass p-5 sm:p-8 rounded-2xl" style={{ marginBottom: "3rem" }}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-heading">Σειρά αναπλήρωσης</h2>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-2xl">
            Αν κάποιος διοριστέος δεν διοριστεί (π.χ. δεν προσκομίσει τα δικαιολογητικά του),
            καλούνται για αναπλήρωση οι αμέσως επόμενοι στη σειρά (ΦΕΚ προκήρυξης, Κεφ. Ε΄).
            Για κάθε θέση που δηλώσατε και καλύφθηκε από άλλον: πόσοι μη διοριστέοι που τη
            δήλωσαν και έχουν τα προσόντα της βρίσκονται πριν από εσάς στην κατάταξη.
          </p>
        </div>
        <div className="flex flex-shrink-0 rounded-lg border border-line bg-surface p-1 self-start">
          {sortBtn("seira", "Κατά σειρά")}
          {sortBtn("protimisi", "Κατά προτίμηση")}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {visible.map((r) => {
          const diff = r.score - r.vasi;
          const above = diff >= 0;
          return (
            <Link
              key={r.kod}
              href={`/thesi/${r.kod}`}
              className="flex items-stretch justify-between gap-3 p-3.5 rounded-xl bg-surface border border-line hover:border-primary hover:bg-primary/10 transition-all duration-200 group no-underline"
            >
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-mono font-bold text-sm text-heading">#{r.kod}</span>
                  <span className="text-[11px] text-dim">{r.pref}η προτίμηση</span>
                </div>
                <div className="text-xs sm:text-sm text-body group-hover:text-heading truncate mt-1" title={r.foreas}>
                  {r.foreas || "—"}
                </div>
                <div className="text-[11px] text-muted truncate">
                  {r.perifereia}
                  {r.theseis ? ` · ${r.theseis} ${r.theseis === 1 ? "θέση" : "θέσεις"}` : ""}
                </div>
                <div className="text-[11px] text-muted mt-1.5">
                  Βάση {formatVathmologia(r.vasi)} ·{" "}
                  <span className="text-body">
                    {above ? "+" : "−"}
                    {formatVathmologia(Math.abs(diff))} μόρια
                  </span>
                  {above && <span className="text-dim"> *</span>}
                </div>
              </div>
              <div className="flex flex-col items-end justify-center flex-shrink-0 text-right">
                <div className="font-display text-xl sm:text-2xl font-bold text-heading leading-none">
                  {formatNumber(r.ahead + 1)}
                  <span className="text-sm font-semibold">ος</span>
                </div>
                <div className="text-[11px] text-muted mt-1 whitespace-nowrap">στη σειρά</div>
                <div className="text-[10px] text-dim whitespace-nowrap">
                  {r.ahead === 0 ? "κανείς πριν από εσάς" : `${formatNumber(r.ahead)} πριν από εσάς`}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {rows.length > PREVIEW && (
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="btn-outline mt-4 !px-4 !py-2 !text-xs"
        >
          {showAll ? "Λιγότερες" : `Όλες οι ${formatNumber(rows.length)} θέσεις`}
        </button>
      )}

      <div className="mt-5 pt-4 border-t border-line text-[11px] text-muted space-y-1.5 max-w-3xl">
        <p>
          Η σειρά είναι μέτρηση από τους οριστικούς πίνακες κατάταξης, όχι πρόβλεψη. Η πραγματική
          σειρά κλήσης μπορεί να διαφέρει: οι ειδικές κατηγορίες (πολύτεκνοι κ.ά.) καλύπτουν
          ποσοστό θέσεων κατά προτεραιότητα και η ιδιότητα αυτή δεν δημοσιεύεται για τους μη
          διοριστέους· και αν κενωθούν περισσότερες θέσεις, όσοι είναι πριν από εσάς μπορεί να
          καλυφθούν σε άλλες.
        </p>
        {anyAboveBase && (
          <p>
            * Η βάση της θέσης είναι χαμηλότερη από τη βαθμολογία σας. Συνήθως αυτό σημαίνει ότι
            η θέση δόθηκε σε διοριστέο ειδικής κατηγορίας, που προηγείται ανεξαρτήτως μορίων.
          </p>
        )}
      </div>
    </div>
  );
}
