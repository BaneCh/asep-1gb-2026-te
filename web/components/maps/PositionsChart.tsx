"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { formatNumber } from "@/lib/utils";
import { PERIFEREIES_MAPPING, REGION_TITLE_MAP, unitInRegion } from "@/lib/regions";

// Θέσεις ανά περιφέρεια / περιφερειακή ενότητα για τις θέσεις που περνούν το
// φίλτρο ειδικότητας του χάρτη. Κλικ σε μπάρα = ίδιο με κλικ στον χάρτη.

type Level = "perifereia" | "enotita";

interface Row {
  key: string; // τιμή για onSelect (geoName περιφέρειας ή όνομα ενότητας)
  name: string;
  theseis: number;
  kodikoi: number;
}

const UNITS_PREVIEW = 15;
const ROW_HEIGHT = 30;

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const r: Row = payload[0].payload;
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "10px 14px",
        fontSize: "0.85rem",
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      }}
    >
      <div style={{ color: "var(--text-heading)", fontWeight: 600, marginBottom: 4 }}>{r.name}</div>
      <div style={{ color: "var(--text)" }}>
        {formatNumber(r.theseis)} {r.theseis === 1 ? "θέση" : "θέσεις"} · {formatNumber(r.kodikoi)}{" "}
        {r.kodikoi === 1 ? "κωδικός" : "κωδικοί"}
      </div>
      <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: 4 }}>
        Κλικ για τη λίστα θέσεων
      </div>
    </div>
  );
}

export default function PositionsChart({
  positions,
  eidikotita,
  onSelect,
}: {
  positions: any[];
  eidikotita: string;
  onSelect: (key: string) => void;
}) {
  const [level, setLevel] = useState<Level>("perifereia");
  const [showAllUnits, setShowAllUnits] = useState(false);

  const allRows = useMemo<Row[]>(() => {
    const acc: Record<string, Row> = {};
    for (const p of positions) {
      const unit = p.perifereia || "";
      let key = unit;
      let name = unit;
      if (level === "perifereia") {
        const geo = Object.keys(PERIFEREIES_MAPPING).find((g) => unitInRegion(unit, g));
        if (!geo) continue;
        key = geo;
        name = REGION_TITLE_MAP[geo] || geo;
      }
      const r = (acc[key] ||= { key, name, theseis: 0, kodikoi: 0 });
      r.theseis += p.theseis || 0;
      r.kodikoi += 1;
    }
    return Object.values(acc).sort(
      (a, b) => b.theseis - a.theseis || a.name.localeCompare(b.name, "el")
    );
  }, [positions, level]);

  const rows =
    level === "enotita" && !showAllUnits ? allRows.slice(0, UNITS_PREVIEW) : allRows;
  const total = allRows.reduce((s, r) => s + r.theseis, 0);

  const toggle = (value: Level, label: string) => (
    <button
      type="button"
      onClick={() => setLevel(value)}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        level === value ? "bg-primary text-black font-bold shadow-sm" : "text-muted hover:text-heading"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="glass p-4 sm:p-8 rounded-2xl" style={{ marginTop: "2rem" }}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="font-display text-lg sm:text-2xl font-bold text-heading">
            Θέσεις ανά {level === "perifereia" ? "περιφέρεια" : "περιφερειακή ενότητα"}
          </h2>
          <p className="text-xs sm:text-sm text-muted mt-1">
            {eidikotita || "Όλες οι ειδικότητες"} · {formatNumber(total)}{" "}
            {total === 1 ? "θέση" : "θέσεις"} σε {formatNumber(allRows.length)}{" "}
            {level === "perifereia" ? "περιφέρειες" : "περιφερειακές ενότητες"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-line self-start flex-shrink-0">
          {toggle("perifereia", "Περιφέρειες")}
          {toggle("enotita", "Περιφ. ενότητες")}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted py-6 text-center">Δεν υπάρχουν θέσεις για αυτή την επιλογή.</p>
      ) : (
        <div style={{ height: rows.length * ROW_HEIGHT + 40 }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ left: 0, right: 40, top: 5, bottom: 5 }}
              barCategoryGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                stroke="var(--text-dim)"
                fontSize={11}
                tickFormatter={(v) => formatNumber(v)}
              />
              <YAxis
                dataKey="name"
                type="category"
                stroke="var(--text-muted)"
                fontSize={11}
                width={150}
                tickLine={false}
                interval={0}
                tickFormatter={(v: string) => (v.length > 22 ? v.slice(0, 21) + "…" : v)}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgb(var(--primary-rgb) / 0.08)" }} />
              <Bar
                dataKey="theseis"
                fill="var(--primary)"
                radius={[0, 4, 4, 0]}
                maxBarSize={20}
                cursor="pointer"
                isAnimationActive={false}
                onClick={(d: any) => onSelect(d.key ?? d.payload?.key)}
              >
                <LabelList
                  dataKey="theseis"
                  position="right"
                  fontSize={11}
                  fill="var(--text)"
                  formatter={(v: any) => formatNumber(Number(v))}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {level === "enotita" && allRows.length > UNITS_PREVIEW && (
        <button
          type="button"
          onClick={() => setShowAllUnits((s) => !s)}
          className="btn-outline mt-3 !px-4 !py-2 !text-xs"
        >
          {showAllUnits ? "Λιγότερες" : `Όλες οι ${allRows.length} περιφερειακές ενότητες`}
        </button>
      )}
    </div>
  );
}
