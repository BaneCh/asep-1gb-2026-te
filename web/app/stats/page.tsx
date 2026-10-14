"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { formatNumber, formatVathmologia } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

interface StatsData {
  global: {
    total_candidates: number;
    total_dioristoi: number;
    total_eidikotites: number;
    pososto_epityxias: number;
    avg_vath: number;
    max_vath: number;
    min_vath: number;
    me_metaptyxiako: number;
  };
  topByCount: any[];
  topByDioristoi: any[];
  topByPososto: any[];
  topByAvg: any[];
  sunburst: any;
}

function StatBox({
  label,
  value,
  suffix = "",
  highlight = false,
  delay = 0,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  highlight?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000 }}
      className="glass p-5 sm:p-6 rounded-2xl flex flex-col justify-between"
    >
      <div
        style={{
          fontSize: "0.7rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--text-muted)",
          marginBottom: "0.5rem",
        }}
      >
        {label}
      </div>
      <div
        className={highlight ? "text-gradient" : ""}
        style={{
          fontSize: "clamp(1.5rem, 3vw, 2rem)",
          fontWeight: 700,
          color: highlight ? undefined : "var(--text-heading)",
          lineHeight: 1,
        }}
      >
        {value}
        {suffix}
      </div>
    </motion.div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "12px 16px",
        fontSize: "0.85rem",
        maxWidth: "280px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      }}
    >
      <div style={{ color: "var(--text)", marginBottom: "6px", fontWeight: 600 }}>
        {data.full || data.name}
      </div>
      <div style={{ color: "var(--primary-text)", fontWeight: 700 }}>
        {formatNumber(payload[0].value)} υποψήφιοι
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [eidikotitesIndex, setEidikotitesIndex] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [useLogScale, setUseLogScale] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/stats").then((r) => r.json()),
      fetch("/data/eidikotites_index.json")
        .then((r) => r.json())
        .catch(() => []),
    ])
      .then(([statsRes, indexRes]) => {
        setData(statsRes);
        setEidikotitesIndex(indexRes);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Helper map: slug -> Ελληνικό Όνομα
  const slugToGreekMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const item of eidikotitesIndex) {
      if (item.slug && item.eidikotita) {
        map[item.slug] = item.eidikotita;
      }
    }
    return map;
  }, [eidikotitesIndex]);

  function getDisplayName(slug: string): string {
    if (slugToGreekMap[slug]) return slugToGreekMap[slug];
    return slug
      .replace(/^te-/, "ΤΕ ")
      .replace(/-eid-te-/, " ΕΙΔ. ")
      .replace(/-/g, " ")
      .toUpperCase();
  }

  // Σωστός υπολογισμός τίτλων σπουδών
  const titloiData = useMemo(() => {
    if (!data) return [];
    // Μοναδικοί υποψήφιοι με/χωρίς μεταπτυχιακό (από global_stats.json)
    const total = data.global.total_candidates;
    const metaptyxiako = data.global.me_metaptyxiako;

    return [
      { name: "Με Μεταπτυχιακό", value: metaptyxiako, color: "var(--primary-text)" },
      { name: "Χωρίς Μεταπτυχιακό", value: Math.max(0, total - metaptyxiako), color: "#c4c1b8" },
    ];
  }, [data]);

  // Ελληνικά ονόματα για το Bar Chart
  const formattedTopByCount = useMemo(() => {
    if (!data?.topByCount) return [];
    return data.topByCount.map((item) => ({
      ...item,
      name: slugToGreekMap[item.slug] || item.name,
      full: slugToGreekMap[item.slug] || item.full || item.name,
    }));
  }, [data, slugToGreekMap]);

  if (loading || !data) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--primary-text)",
        }}
      >
        Φόρτωση στατιστικών...
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "6px 16px",
              borderRadius: "100px",
              border: "1px solid var(--border)",
              background: "rgb(var(--primary-rgb) / 0.05)",
              fontSize: "0.75rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--primary-text)",
              marginBottom: "1.5rem",
            }}
          >
            ● 1ΓΒ/2026 ΤΕ
          </div>

          <h1
            className="font-display"
            style={{
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              fontWeight: 700,
              marginBottom: "1rem",
            }}
          >
            <span className="text-gradient">Στατιστικά</span> 1ΓΒ/2026
          </h1>

          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "1.05rem",
              marginBottom: "2.5rem",
              maxWidth: "700px",
            }}
          >
            Ανάλυση των οριστικών αποτελεσμάτων της προκήρυξης 1ΓΒ/2026
            (Τεχνολογικής Εκπαίδευσης – ΤΕ).
          </p>
        </motion.div>

        {/* Global KPIs Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8 sm:mb-12">
          <StatBox
            label="Σύνολο Υποψηφίων"
            value={formatNumber(data.global.total_candidates)}
            highlight
            delay={100}
          />
          <StatBox
            label="Διοριστέοι"
            value={formatNumber(data.global.total_dioristoi)}
            delay={200}
          />
          <StatBox
            label="Ποσοστό Επιτυχίας"
            value={data.global.pososto_epityxias.toFixed(1).replace(".", ",")}
            suffix="%"
            delay={300}
          />
          <StatBox
            label="Μέση Βαθμολογία"
            value={formatVathmologia(data.global.avg_vath)}
            delay={400}
          />
          <StatBox
            label="Max Βαθμολογία"
            value={formatVathmologia(data.global.max_vath)}
            delay={500}
          />
          <StatBox
            label="Ειδικότητες"
            value={data.global.total_eidikotites}
            delay={600}
          />
        </div>

        {/* Top 15 Ειδικότητες ανά Υποψηφίους (με Log Scale Toggle & Explanation) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass p-4 sm:p-8 rounded-2xl mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display text-lg sm:text-2xl font-bold text-heading">
                Top 15 Ειδικότητες <span className="text-muted font-normal">ανά υποψηφίους</span>
              </h2>
              <p className="text-xs text-muted mt-1">
                {useLogScale
                  ? "📊 Προβολή σε Λογαριθμική Κλίμακα (Log Scale) για να είναι ευδιάκριτες όλες οι ειδικότητες παρά την τεράστια απόκλιση (24.000 vs 200)."
                  : "📏 Προβολή σε Γραμμική Κλίμακα (απόλυτες διαφορές)."}
              </p>
            </div>

            {/* Toggle Switch: Γραμμική vs Λογαριθμική */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-line self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setUseLogScale(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  useLogScale
                    ? "bg-primary text-heading font-bold shadow-sm"
                    : "text-muted hover:text-heading"
                }`}
              >
                Log Κλίμακα
              </button>
              <button
                type="button"
                onClick={() => setUseLogScale(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  !useLogScale
                    ? "bg-primary text-heading font-bold shadow-sm"
                    : "text-muted hover:text-heading"
                }`}
              >
                Κανονική
              </button>
            </div>
          </div>

          {/* Αυξάνουμε το ύψος σε 640px για να πάρουν "αέρα" οι 15 μπάρες */}
          <div className="h-[640px] sm:h-[680px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={formattedTopByCount}
                layout="vertical"
                margin={{ left: 10, right: 25, top: 15, bottom: 15 }}
                barCategoryGap="22%" // 👈 Δίνει ευρύχωρο κενό ανάμεσα στις μπάρες!
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  scale={useLogScale ? "log" : "linear"}
                  domain={useLogScale ? [50, 30000] : [0, "auto"]}
                  stroke="#8a8a8a"
                  fontSize={11}
                  tickFormatter={(v) => formatNumber(v)}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="var(--text-muted)"
                  fontSize={10}
                  width={165} // 👈 Περισσότερος χώρος αριστερά
                  tickLine={false}
                  tickFormatter={(v) => {
                    if (typeof v !== "string") return v;
                    // Καθαρίζουμε το μακρινάρι για να φαίνεται η ουσία
                    const clean = v
                      .replace(/^ΠΕ\s+/i, "")
                      .replace(/ΕΙΔ\.\s*ΠΕ\s+/i, "• ")
                      .replace(/\(SOFTWARE-HARDWARE\)/i, "(IT)");
                    return clean.length > 24 ? clean.substring(0, 22) + "..." : clean;
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="value"
                  fill="#61cae4"
                  radius={[0, 5, 5, 0]}
                  barSize={18} // 👈 Σταθερό κομψό πάχος μπάρας
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Grid: Top Διοριστέοι + Top Ποσοστό */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 sm:mb-12">
          {/* Top 15 ανά διοριστέους */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass p-5 sm:p-8 rounded-2xl flex flex-col"
          >
            <h3 className="text-lg sm:text-xl font-bold text-heading mb-6 flex items-center justify-between">
              <span>Top 15 ανά διοριστέους</span>
              <span className="text-xs font-mono text-primary-text px-2.5 py-1 rounded-full bg-primary/15 border border-primary/50">
                Θέσεις
              </span>
            </h3>

            <div className="space-y-2.5">
              {data.topByDioristoi.map((e, i) => {
                const greekName = getDisplayName(e.slug);
                return (
                  <Link
                    key={e.slug}
                    href={`/eidikotita/${e.slug}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface border border-line hover:border-primary hover:bg-primary/10 transition-all duration-200 group no-underline"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-3">
                      <span
                        className={`w-5 sm:w-6 text-xs font-mono font-bold flex-shrink-0 ${
                          i < 3 ? "text-primary-text" : "text-dim"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}.
                      </span>
                      <span
                        className="text-xs sm:text-sm font-medium text-body group-hover:text-heading truncate"
                        title={greekName}
                      >
                        {greekName}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-xs sm:text-sm text-primary-text flex-shrink-0 bg-surface px-2.5 py-1 rounded-md border border-line">
                      {formatNumber(e.dioristoi)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </motion.div>

          {/* Top 15 ανά ποσοστό επιτυχίας */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass p-5 sm:p-8 rounded-2xl flex flex-col"
          >
            <h3 className="text-lg sm:text-xl font-bold text-heading mb-6 flex items-center justify-between">
              <span>Top 15 ανά ποσοστό επιτυχίας</span>
              <span className="text-xs font-mono text-success px-2.5 py-1 rounded-full bg-success/10 border border-success/40">
                Ποσοστό %
              </span>
            </h3>

            <div className="space-y-2.5">
              {data.topByPososto.map((e, i) => {
                const greekName = getDisplayName(e.slug);
                return (
                  <Link
                    key={e.slug}
                    href={`/eidikotita/${e.slug}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface border border-line hover:border-success hover:bg-success/10 transition-all duration-200 group no-underline"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-3">
                      <span
                        className={`w-5 sm:w-6 text-xs font-mono font-bold flex-shrink-0 ${
                          i < 3 ? "text-success" : "text-dim"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}.
                      </span>
                      <span
                        className="text-xs sm:text-sm font-medium text-body group-hover:text-heading truncate"
                        title={greekName}
                      >
                        {greekName}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-xs sm:text-sm text-success flex-shrink-0 bg-surface px-2 py-1 rounded-md border border-line">
                      {e.pososto.toFixed(1).replace(".", ",")}%
                    </span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Κατανομή Τίτλων Σπουδών (Mobile-Friendly Donut) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass p-5 sm:p-8 rounded-2xl mb-8 flex flex-col items-center"
        >
          <h3 className="text-lg sm:text-xl font-bold text-heading mb-4 w-full text-left">
            Κατανομή Τίτλων Σπουδών
          </h3>

          <div className="h-[280px] sm:h-[320px] w-full max-w-sm">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={titloiData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={4}
                >
                  {titloiData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [formatNumber(Number(val)), "Υποψήφιοι"]}
                  contentStyle={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--text-heading)",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Καθαρό Legend από κάτω με νούμερα */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg mt-2 pt-4 border-t border-line">
            {titloiData.map((t) => (
              <div
                key={t.name}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-line"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: t.color }}
                  />
                  <span className="text-xs text-body font-medium">{t.name}</span>
                </div>
                <span className="text-xs font-mono font-bold text-heading">
                  {formatNumber(t.value)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}