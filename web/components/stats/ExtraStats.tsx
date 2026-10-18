"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import Link from "next/link";
import { formatNumber, formatVathmologia } from "@/lib/utils";

// Στατιστικά της σελίδας /stats που υπολογίζονται στο scripts/optimize_data.py
// (eidikotites_stats.json → vasi, theseis_stats.json) και ελέγχονται από το
// scripts/validate.py.

export interface VasiRow {
  slug: string;
  name: string;
  vasi: number;
  dioristoi: number;
}

interface TheseisRow {
  name: string;
  theseis: number;
  filled: number;
  adiathetes: number;
  kodikoi: number;
  kodikoi_adiathetoi: number;
}

export interface TheseisStats {
  total_theseis: number;
  filled: number;
  adiathetes: number;
  kodikoi_adiathetoi: number;
  by_eidikotita: TheseisRow[];
  by_perifereia: TheseisRow[];
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
        active ? "bg-primary text-black" : "text-muted hover:text-heading"
      }`}
    >
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------------- */
/* Βάσεις ανά ειδικότητα                                                  */
/* ---------------------------------------------------------------------- */
export function VaseisCard({ rows }: { rows: VasiRow[] }) {
  const [sort, setSort] = useState<"desc" | "asc" | "alpha">("desc");

  const sorted = useMemo(() => {
    const r = [...rows];
    if (sort === "desc") r.sort((a, b) => b.vasi - a.vasi);
    else if (sort === "asc") r.sort((a, b) => a.vasi - b.vasi);
    else r.sort((a, b) => a.name.localeCompare(b.name, "el"));
    return r;
  }, [rows, sort]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="glass p-5 sm:p-8 rounded-2xl mb-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-heading">Βάσεις ανά ειδικότητα</h3>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-2xl">
            Βάση = η χαμηλότερη βαθμολογία με την οποία έγινε διορισμός μέσω του πίνακα
            κατάταξης. Λόγω προτιμήσεων θέσεων και εντοπιότητας, υποψήφιοι με
            υψηλότερη βαθμολογία δεν διορίστηκαν απαραίτητα.
          </p>
        </div>
        <div className="flex flex-shrink-0 rounded-lg border border-line bg-surface p-1 self-start">
          <SortButton active={sort === "desc"} onClick={() => setSort("desc")}>
            Υψηλότερη
          </SortButton>
          <SortButton active={sort === "asc"} onClick={() => setSort("asc")}>
            Χαμηλότερη
          </SortButton>
          <SortButton active={sort === "alpha"} onClick={() => setSort("alpha")}>
            Α–Ω
          </SortButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-2.5">
        {sorted.map((e, i) => (
          <Link
            key={e.slug}
            href={`/eidikotita/${e.slug}`}
            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface border border-line hover:border-primary hover:bg-primary/10 transition-all duration-200 group no-underline"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-6 text-xs font-mono font-bold text-dim flex-shrink-0">
                {String(i + 1).padStart(2, "0")}.
              </span>
              <span
                className="text-xs sm:text-sm font-medium text-body group-hover:text-heading truncate"
                title={e.name}
              >
                {e.name}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="hidden sm:inline text-[11px] text-dim whitespace-nowrap">
                {formatNumber(e.dioristoi)} {e.dioristoi === 1 ? "διοριστέος" : "διοριστέοι"}
              </span>
              <span className="font-mono font-bold text-xs sm:text-sm text-heading bg-surface px-2.5 py-1 rounded-md border border-line">
                {formatVathmologia(e.vasi)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

/* ---------------------------------------------------------------------- */
/* Αδιάθετες θέσεις                                                       */
/* ---------------------------------------------------------------------- */
function UnfilledList({
  title,
  rows,
  limit,
}: {
  title: string;
  rows: TheseisRow[];
  limit?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const withUnfilled = rows.filter((r) => r.adiathetes > 0);
  const visible = limit && !showAll ? withUnfilled.slice(0, limit) : withUnfilled;

  return (
    <div className="flex flex-col">
      <h4 className="text-sm font-semibold text-heading mb-3">
        {title} <span className="text-muted font-normal">({withUnfilled.length})</span>
      </h4>
      <div className="space-y-2.5">
        {visible.map((r) => {
          const pct = r.theseis ? (r.filled / r.theseis) * 100 : 0;
          return (
            <div key={r.name} className="p-3 rounded-xl bg-surface border border-line">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs sm:text-sm font-medium text-body truncate" title={r.name}>
                  {r.name}
                </span>
                <span className="font-mono font-bold text-xs sm:text-sm text-heading flex-shrink-0">
                  {formatNumber(r.adiathetes)}
                  <span className="text-dim font-normal"> / {formatNumber(r.theseis)}</span>
                </span>
              </div>
              {/* μπάρα: καλυμμένο ποσοστό */}
              <div className="mt-2 h-1.5 w-full rounded-full bg-surface-strong overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      {limit && withUnfilled.length > limit && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="btn-outline mt-3 self-start !px-4 !py-2 !text-xs"
        >
          {showAll ? "Λιγότερες" : `Όλες (${withUnfilled.length})`}
        </button>
      )}
    </div>
  );
}

export function AdiathetesCard({ data }: { data: TheseisStats }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass p-5 sm:p-8 rounded-2xl mb-8"
    >
      <h3 className="text-lg sm:text-xl font-bold text-heading">Αδιάθετες θέσεις</h3>
      <p className="text-xs sm:text-sm text-muted mt-1 mb-5 max-w-2xl">
        Θέσεις της προκήρυξης για τις οποίες δεν προέκυψε διοριστέος. Ο αριθμός δείχνει
        αδιάθετες / συνολικές θέσεις· η μπάρα το ποσοστό που καλύφθηκε.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Θέσεις προκήρυξης", value: data.total_theseis },
          { label: "Καλύφθηκαν", value: data.filled },
          { label: "Αδιάθετες", value: data.adiathetes },
          { label: "Κωδικοί με αδιάθετες", value: data.kodikoi_adiathetoi },
        ].map((k) => (
          <div key={k.label} className="p-3 rounded-xl bg-surface border border-line">
            <div className="text-[11px] uppercase tracking-wider text-muted">{k.label}</div>
            <div className="text-xl sm:text-2xl font-bold text-heading mt-1">{formatNumber(k.value)}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <UnfilledList title="Ανά ειδικότητα" rows={data.by_eidikotita} />
        <UnfilledList title="Ανά περιφερειακή ενότητα" rows={data.by_perifereia} limit={10} />
      </div>
    </motion.div>
  );
}

/* ---------------------------------------------------------------------- */
/* Προσόντα διοριστέων (proson_impact.json)                               */
/* ---------------------------------------------------------------------- */
export interface ProsonImpact {
  total_appointed: number;
  appointed_with_metapt: number;
  metapt_pct: number;
  appointed_with_didakt: number;
  didakt_pct: number;
  appointed_with_empeiria: number;
  empeiria_pct: number;
  appointed_with_xeni: number;
  xeni_pct: number;
  appointed_with_entop: number;
  entop_pct: number;
  entop_by_category: Record<string, number>;
}

export function ProsontaCard({ data }: { data: ProsonImpact }) {
  const pct = (v: number) => v.toFixed(1).replace(".", ",");
  const entop = data.entop_by_category;
  const items = [
    {
      label: "Μεταπτυχιακό",
      pct: data.metapt_pct,
      text: `${formatNumber(data.appointed_with_metapt)} διοριστέοι είχαν μεταπτυχιακό τίτλο.`,
    },
    {
      label: "Εντοπιότητα (Κωδ. 6 / 7)",
      pct: data.entop_pct,
      text: `${formatNumber(data.appointed_with_entop)} διοριστέοι είχαν μόρια εντοπιότητας (κωδ. 6: ${formatNumber(entop["6"] ?? 0)} · κωδ. 7: ${formatNumber(entop["7"] ?? 0)}).`,
    },
    {
      label: "Επαγγελματική εμπειρία",
      pct: data.empeiria_pct,
      text: `${formatNumber(data.appointed_with_empeiria)} διοριστέοι αξιοποίησαν μόρια προϋπηρεσίας.`,
    },
    {
      label: "Άριστη ξένη γλώσσα (C2)",
      pct: data.xeni_pct,
      text: `${formatNumber(data.appointed_with_xeni)} διοριστέοι είχαν άριστη γνώση ξένης γλώσσας.`,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      className="glass p-5 sm:p-8 rounded-2xl mb-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-heading">
            Η Δύναμη των Προσόντων: Πώς κρίθηκαν οι διορισμοί
          </h3>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-2xl">
            Ανάλυση των πρόσθετων μορίων και προνομίων στους{" "}
            {formatNumber(data.total_appointed)} διοριστέους του διαγωνισμού.
          </p>
        </div>
        <span className="text-xs font-mono text-primary-text px-2.5 py-1 rounded-full bg-primary/15 border border-primary/50 self-start whitespace-nowrap">
          Ανάλυση Προσόντων
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((k) => (
          <div key={k.label} className="p-4 rounded-xl bg-surface border border-line flex flex-col gap-2">
            <div className="text-[11px] uppercase tracking-wider text-muted font-semibold">{k.label}</div>
            <div className="text-2xl font-bold font-mono text-heading">{pct(k.pct)}%</div>
            <div className="h-1.5 w-full rounded-full bg-surface-strong overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${k.pct}%` }} />
            </div>
            <div className="text-xs text-muted">{k.text}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
