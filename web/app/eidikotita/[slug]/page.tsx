"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatNumber, formatVathmologia } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Data {
  slug: string;
  stats: {
    count: number;
    unique_candidates: number;
    dioristoi: number;
    pososto: number;
    min_vath: number;
    max_vath: number;
    avg_vath: number;
    me_metaptyxiako: number;
    me_entopiotita: number;
  };
  distribution: Record<string, number>;
  entopiotita: Record<string, number>;
  theseis: { kod: string; count: number }[];
  topDioristoi: any[];
  titloi: {
    metaptyxiako: number;
    xeni_glossa: number;
    empeiria: number;
  };
  totalRecords: number;
}

const ENTOPIOTITA_COLORS: Record<string, string> = {
  "0": "#61cae4", // Χωρίς Εντοπιότητα
  "6": "#9a9a9a", // Νησιά / Παραμεθόριος
  "7": "#2f7f95", // Ορεινές Περιοχές
};

const ENTOPIOTITA_LABELS: Record<string, string> = {
  "0": "Χωρίς Εντοπιότητα",
  "6": "Νησιά / Παραμεθόριος",
  "7": "Ορεινές Περιοχές",
};

function StatBox({
  label,
  value,
  highlight = false,
  suffix = "",
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
  suffix?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass"
      style={{ padding: "1.25rem" }}
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
          fontSize: "1.75rem",
          fontWeight: 700,
          color: highlight ? undefined : "var(--text)",
          lineHeight: 1.2,
        }}
      >
        {value}
        {suffix}
      </div>
    </motion.div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
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
      <div style={{ color: "var(--text-muted)", marginBottom: "4px" }}>
        Εύρος: {label}
      </div>
      <div style={{ color: "var(--primary-text)", fontWeight: 700 }}>
        {formatNumber(payload[0].value)} υποψήφιοι
      </div>
    </div>
  );
}

export default function EidikotitaPage() {
  const [eidikotitaTitle, setEidikotitaTitle] = useState<string>("");
  const params = useParams();
  const slug = params?.slug as string;
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      fetch(`/api/eidikotita?slug=${encodeURIComponent(slug)}`).then((r) => r.json()),
      fetch("/data/eidikotites_index.json").then((r) => r.json()).catch(() => []),
    ])
      .then(([d, indexList]) => {
        setData(d);
        const match = indexList.find((item: any) => item.slug === slug);
        if (match && match.eidikotita) {
          setEidikotitaTitle(match.eidikotita);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
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
        Φόρτωση ειδικότητας...
      </main>
    );
  }

  if (!data || !data.stats) {
    return (
      <main style={{ minHeight: "100vh", padding: "120px 24px" }}>
        <h1>Δεν βρέθηκε η ειδικότητα</h1>
        <Link href="/" style={{ color: "var(--primary-text)" }}>
          ← Επιστροφή στην Αρχική
        </Link>
      </main>
    );
  }

  const distData = Object.entries(data.distribution)
    .map(([label, count]) => ({ label, count }))
    .filter((d) => d.count > 0);

  const entopData = Object.entries(data.entopiotita)
    .map(([label, value]) => ({
      key: label,
      name: ENTOPIOTITA_LABELS[label] || `Κωδικός ${label}`,
      value,
      color: ENTOPIOTITA_COLORS[label] || "#8a8a8a",
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "120px 24px 80px",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
              fontWeight: 700,
              marginBottom: "0.5rem",
            }}
          >
            <span className="text-gradient">
              {data.stats.unique_candidates.toLocaleString("el-GR")} υποψήφιοι
            </span>
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              marginBottom: "3rem",
              fontSize: "1.1rem",
              fontWeight: 600,
              maxWidth: "850px",
              letterSpacing: "0.02em",
            }}
          >
            {eidikotitaTitle || slug.replace(/-/g, " ").toUpperCase()}
          </p>
        </motion.div>

        {/* KPI Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            marginBottom: "3rem",
          }}
        >
          <StatBox
            label="Διοριστέοι"
            value={formatNumber(data.stats.dioristoi)}
            highlight
          />
          <StatBox
            label="Ποσοστό Επιτυχίας"
            value={data.stats.pososto.toFixed(1).replace(".", ",")}
            suffix="%"
          />
          <StatBox
            label="Μέση Βαθμολογία"
            value={formatVathmologia(data.stats.avg_vath)}
          />
          <StatBox
            label="Max Βαθμολογία"
            value={formatVathmologia(data.stats.max_vath)}
          />
          <StatBox
            label="Min Βαθμολογία"
            value={formatVathmologia(data.stats.min_vath)}
          />
        </div>

        {/* Charts Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
            gap: "1.5rem",
            marginBottom: "3rem",
          }}
        >
          {/* Κατανομή Βαθμολογίας (Neon Cyan) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass"
            style={{ padding: "1.5rem", height: "420px" }}
          >
            <h3
              style={{
                marginBottom: "1rem",
                fontSize: "1.1rem",
                fontWeight: 600,
              }}
            >
              Κατανομή Βαθμολογίας
            </h3>
            <ResponsiveContainer width="100%" height="88%">
              <BarChart data={distData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="label"
                  stroke="#8a8a8a"
                  fontSize={11}
                />
                <YAxis stroke="#8a8a8a" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  fill="#61cae4"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Κατανομή Εντοπιότητας (Καθαρό Donut με πλήρες υπόμνημα) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass"
            style={{
              padding: "1.5rem",
              height: "420px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <h3
              style={{
                marginBottom: "0.5rem",
                fontSize: "1.1rem",
                fontWeight: 600,
              }}
            >
              Κατανομή Εντοπιότητας
            </h3>

            <div style={{ height: "240px", width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={entopData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                  >
                    {entopData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      `${formatNumber(Number(val))} υποψήφιοι`,
                      name,
                    ]}
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

            {/* Πλήρες & Καθαρό Υπόμνημα με Αριθμούς */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                paddingTop: "12px",
                borderTop: "1px solid var(--border)",
                fontSize: "0.8rem",
              }}
            >
              {entopData.map((item) => (
                <div
                  key={item.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    color: "var(--text-muted)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: item.color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ color: "var(--text)" }}>{item.name}</span>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontWeight: 700,
                      color: item.color,
                    }}
                  >
                    {formatNumber(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Τίτλοι & Προσόντα */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass"
          style={{ padding: "1.5rem", marginBottom: "3rem" }}
        >
          <h3
            style={{
              marginBottom: "1.5rem",
              fontSize: "1.1rem",
              fontWeight: 600,
            }}
          >
            Τίτλοι & Προσόντα Υποψηφίων
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "1rem",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: "4px",
                }}
              >
                Με Μεταπτυχιακό
              </div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--primary-text)",
                }}
              >
                {formatNumber(data.titloi.metaptyxiako)}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: "4px",
                }}
              >
                Με Ξένη Γλώσσα
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                {formatNumber(data.titloi.xeni_glossa)}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: "4px",
                }}
              >
                Με Εμπειρία
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                {formatNumber(data.titloi.empeiria)}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Top 20 Διοριστέοι */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass"
          style={{ padding: "1.5rem", marginBottom: "3rem" }}
        >
          <h3
            style={{
              marginBottom: "1.5rem",
              fontSize: "1.1rem",
              fontWeight: 600,
            }}
          >
            Top 20 Βαθμολογίες
          </h3>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {data.topDioristoi.map((c, i) => (
              <Link
                key={`${c.am}-${i}`}
                href={`/ypopsifios/${c.am}?slug=${data.slug}&aa=${c.aa}`}
                style={{
                  padding: "10px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  textDecoration: "none",
                  color: "var(--text)",
                  border: "1px solid transparent",
                  borderRadius: "8px",
                  background: "var(--surface-subtle)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.background = "rgb(var(--primary-rgb) / 0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "transparent";
                  e.currentTarget.style.background = "var(--surface-subtle)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <span
                    style={{
                      width: "28px",
                      color: i < 3 ? "var(--primary-text)" : "var(--text-muted)",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                    }}
                  >
                    #{i + 1}
                  </span>
                  <span>
                    {c.eponymo} {c.onoma}
                  </span>
                </div>
                <span
                  style={{
                    color: "var(--primary-text)",
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontWeight: 600,
                  }}
                >
                  {formatVathmologia(c.vathmologia)}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Top Κωδικοί Θέσεων (με πλήρη επεξήγηση & links) */}
        {data.theseis && data.theseis.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass"
            style={{ padding: "1.75rem" }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                marginBottom: "1.5rem",
                borderBottom: "1px solid var(--border)",
                paddingBottom: "12px",
              }}
            >
              <h3
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  color: "var(--text-heading)",
                }}
              >
                Κωδικοί Θέσεων με τους περισσότερους διορισμούς
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  margin: 0,
                }}
              >
                Οι συγκεκριμένες θέσεις της προκήρυξης όπου απορροφήθηκαν οι
                περισσότεροι υποψήφιοι της ειδικότητας. Πάτησε σε έναν κωδικό για
                να δεις αναλυτικά τον φορέα και την έδρα.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {data.theseis.map((t) => (
                <Link
                  key={t.kod}
                  href={`/thesi/${t.kod}`}
                  style={{
                    padding: "12px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    textDecoration: "none",
                    background: "var(--bg-elevated)",
                    transition: "all 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#61cae4";
                    e.currentTarget.style.background = "rgb(var(--primary-rgb) / 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.background = "var(--bg-elevated)";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.7rem",
                        textTransform: "uppercase",
                      }}
                    >
                      Κωδικός
                    </span>
                    <span
                      style={{
                        color: "var(--primary-text)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {t.count} {t.count === 1 ? "διορισμός" : "διορισμοί"}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontWeight: 700,
                      fontSize: "1rem",
                      color: "var(--text-heading)",
                    }}
                  >
                    #{t.kod}
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}