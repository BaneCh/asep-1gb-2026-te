"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";
import { PERIFEREIES_MAPPING, REGION_TITLE_MAP, unitInRegion } from "@/lib/regions";

// Στατιστικά της σελίδας /stats που υπολογίζονται στο scripts/optimize_data.py
// (theseis_stats.json, proson_impact.json) και ελέγχονται από το scripts/validate.py.

interface KenosKodikos {
  kod: string;
  theseis: number;
  filled: number;
  adiathetes: number;
  eidikotita: string;
  foreas: string;
  perifereia: string;
  dimos: string;
  titloi: string;
  prosonta: string;
}

// Στα δεδομένα το πεδίο λέγεται «adiathetes»· στη σελίδα εμφανίζεται ως «κενές».
export interface TheseisStats {
  total_theseis: number;
  filled: number;
  adiathetes: number;
  kodikoi_adiathetoi: number;
  kodikoi: KenosKodikos[];
}

/* ---------------------------------------------------------------------- */
/* Κενές θέσεις                                                           */
/* ---------------------------------------------------------------------- */
export function AdiathetesCard({ data }: { data: TheseisStats }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass p-5 sm:p-8 rounded-2xl mb-8"
    >
      <h3 className="text-lg sm:text-xl font-bold text-heading">Κενές θέσεις</h3>
      <p className="text-xs sm:text-sm text-muted mt-1 mb-5 max-w-2xl">
        Θέσεις της προκήρυξης για τις οποίες δεν προέκυψε διοριστέος.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Θέσεις προκήρυξης", value: data.total_theseis },
          { label: "Καλύφθηκαν", value: data.filled },
          { label: "Κενές", value: data.adiathetes },
          { label: "Κωδικοί με κενές", value: data.kodikoi_adiathetoi },
        ].map((k) => (
          <div key={k.label} className="p-3 rounded-xl bg-surface border border-line">
            <div className="text-[11px] uppercase tracking-wider text-muted">{k.label}</div>
            <div className="text-xl sm:text-2xl font-bold text-heading mt-1">{formatNumber(k.value)}</div>
          </div>
        ))}
      </div>

      <KenesFilter kodikoi={data.kodikoi || []} />
    </motion.div>
  );
}

/* Φίλτρα κενών θέσεων (όπως στο 2ΓΒ/2026 /kenes-theseis). Αποτελέσματα εμφανίζονται
   μόνο όταν ο χρήστης επιλέξει/γράψει κάτι. */
function normalizeGr(s: string): string {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const RESULTS_LIMIT = 80;

function KenesFilter({ kodikoi }: { kodikoi: KenosKodikos[] }) {
  const [q, setQ] = useState("");
  const [area, setArea] = useState(""); // "R:<geoName>" για περιφέρεια ή όνομα ενότητας
  const [eid, setEid] = useState("");

  // Περιφέρειες → περιφερειακές ενότητες με κενές θέσεις (για optgroups)
  const areaGroups = useMemo(() => {
    const units = new Set(kodikoi.map((k) => k.perifereia));
    return Object.entries(PERIFEREIES_MAPPING)
      .map(([geo, list]) => ({
        geo,
        title: REGION_TITLE_MAP[geo] || geo,
        units: list.filter((u) => units.has(u)).sort((a, b) => a.localeCompare(b, "el")),
      }))
      .filter((g) => g.units.length)
      .sort((a, b) => a.title.localeCompare(b.title, "el"));
  }, [kodikoi]);

  const eidikotites = useMemo(
    () => Array.from(new Set(kodikoi.map((k) => k.eidikotita))).sort((a, b) => a.localeCompare(b, "el")),
    [kodikoi]
  );

  const active = !!(q.trim() || area || eid);

  const results = useMemo(() => {
    if (!active) return [];
    const t = normalizeGr(q.trim());
    return kodikoi.filter((k) => {
      const matchQ =
        !t ||
        k.kod.includes(t) ||
        [k.foreas, k.eidikotita, k.dimos, k.perifereia].some((f) => normalizeGr(f).includes(t));
      const matchArea = !area
        ? true
        : area.startsWith("R:")
          ? unitInRegion(k.perifereia, area.slice(2))
          : k.perifereia === area;
      const matchEid = !eid || k.eidikotita === eid;
      return matchQ && matchArea && matchEid;
    });
  }, [kodikoi, q, area, eid, active]);

  const kenes = results.reduce((s, k) => s + k.adiathetes, 0);
  const field =
    "w-full px-3.5 py-2.5 rounded-xl bg-surface border border-line text-sm text-body focus:outline-none focus:border-primary";

  return (
    <div className="pt-6 border-t border-line">
      <h4 className="text-sm font-semibold text-heading mb-1">Αναζήτηση κενών θέσεων</h4>
      <p className="text-xs text-muted mb-3">
        Διάλεξε περιοχή ή ειδικότητα, ή γράψε κωδικό, φορέα ή δήμο, για να δεις τις θέσεις.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Κωδικός, φορέας, δήμος…"
          aria-label="Αναζήτηση με κωδικό, φορέα ή δήμο"
          className={`${field} placeholder:text-dim`}
        />
        <select value={area} onChange={(e) => setArea(e.target.value)} aria-label="Περιοχή" className={field}>
          <option value="">Όλες οι περιοχές</option>
          {areaGroups.map((g) => (
            <optgroup key={g.geo} label={g.title}>
              <option value={`R:${g.geo}`}>Όλη η {g.title}</option>
              {g.units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <select value={eid} onChange={(e) => setEid(e.target.value)} aria-label="Ειδικότητα" className={field}>
          <option value="">Όλες οι ειδικότητες</option>
          {eidikotites.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>

      {active && (
        <>
          <div className="flex items-center justify-between gap-3 text-xs text-muted mt-3">
            <span>
              Βρέθηκαν <strong className="text-heading">{formatNumber(results.length)}</strong>{" "}
              {results.length === 1 ? "κωδικός" : "κωδικοί"} με{" "}
              <strong className="text-heading">{formatNumber(kenes)}</strong>{" "}
              {kenes === 1 ? "κενή θέση" : "κενές θέσεις"}.
            </span>
            <button
              type="button"
              onClick={() => {
                setQ("");
                setArea("");
                setEid("");
              }}
              className="text-primary-text underline-offset-2 hover:underline flex-shrink-0"
            >
              Καθαρισμός
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
            {results.slice(0, RESULTS_LIMIT).map((k) => (
              <Link
                key={k.kod}
                href={`/thesi/${k.kod}`}
                className="block p-4 rounded-xl bg-surface border border-line hover:border-primary hover:bg-primary/10 transition-all duration-200 group no-underline"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-base text-heading">#{k.kod}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/15 border border-primary/50 text-primary-text font-semibold">
                      {k.adiathetes} {k.adiathetes === 1 ? "κενή θέση" : "κενές θέσεις"}
                    </span>
                  </div>
                  <span className="text-[11px] text-dim">
                    Προκηρύχθηκαν {k.theseis} · Διορίστηκαν {k.filled}
                  </span>
                </div>
                <div className="text-sm font-medium text-body group-hover:text-heading mt-2">{k.foreas}</div>
                <div className="text-xs text-muted mt-0.5">{k.eidikotita}</div>
                <div className="text-xs text-muted mt-0.5">
                  {k.perifereia}
                  {k.dimos ? ` · Δήμος ${k.dimos}` : ""}
                </div>
                {(k.titloi || k.prosonta) && (
                  <div className="text-[11px] text-dim mt-2">
                    Κωδ. τίτλων: {k.titloi || "—"}
                    {k.prosonta ? ` · Κωδ. πρόσθετων προσόντων: ${k.prosonta}` : ""}
                  </div>
                )}
              </Link>
            ))}
          </div>

          {results.length === 0 && (
            <p className="text-sm text-muted text-center py-6">
              Δεν βρέθηκαν κενές θέσεις με αυτά τα κριτήρια.
            </p>
          )}
          {results.length > RESULTS_LIMIT && (
            <p className="text-xs text-muted text-center py-3">
              Εμφανίζονται οι πρώτοι {RESULTS_LIMIT} από {formatNumber(results.length)} κωδικούς. Περιόρισε
              την αναζήτηση με τα φίλτρα.
            </p>
          )}
        </>
      )}
    </div>
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
