"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/utils";

interface Stats {
  total_candidates: number;
  total_dioristoi: number;
  total_eidikotites: number;
  total_theseis: number;
  pososto_epityxias: number;
}

function useCountUp(target: number, duration = 2000, delay = 0) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let startTime: number | null = null;
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(target * eased));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);

  return count;
}

function StatCard({
  label,
  value,
  suffix = "",
  delay = 0,
  accent = false,
}: {
  label: string;
  value: number;
  suffix?: string;
  delay?: number;
  accent?: boolean;
}) {
  const count = useCountUp(value, 2000, delay);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delay / 1000 }}
      className="glass glass-hover"
      style={{ padding: "1.5rem" }}
    >
      <div
        style={{
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--text-muted)",
          marginBottom: "0.5rem",
        }}
      >
        {label}
      </div>
      <div
        className={accent ? "text-gradient" : ""}
        style={{
          fontSize: "2.5rem",
          fontWeight: 700,
          lineHeight: 1,
          color: accent ? undefined : "var(--text-heading)",
        }}
      >
        {formatNumber(count)}
        {suffix}
      </div>
    </motion.div>
  );
}

export default function Hero({ stats }: { stats: Stats }) {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 24px 80px",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: "1200px", width: "100%", position: "relative" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
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
              marginBottom: "2rem",
            }}
          >
            ● Οριστικά Αποτελέσματα · 1ΓΒ/2026 ΤΕ
          </div>

          <h1
            className="font-display"
            style={{
              fontSize: "clamp(2.5rem, 7vw, 6rem)",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              marginBottom: "1.5rem",
            }}
          >
            <span style={{ color: "var(--text)" }}>ΑΣΕΠ 1ΓΒ/2026</span>
            <br />
            <span style={{ color: "var(--text)" }}>
              Οριστικά αποτελέσματα
            </span>
          </h1>

          <p
            style={{
              fontSize: "1.25rem",
              color: "var(--text-muted)",
              maxWidth: "640px",
              marginBottom: "3rem",
              lineHeight: 1.6,
            }}
          >
            Τα οριστικά αποτελέσματα για τις θέσεις ΤΕ σε ένα σημείο. Αναζήτησε
            με Α.Μ. ή όνομα, εξερεύνησε τα στατιστικά, δες πού διορίστηκες.
          </p>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginTop: "3rem",
          }}
        >
          <StatCard
            label="Υποψήφιοι"
            value={stats.total_candidates}
            delay={200}
            accent
          />
          <StatCard
            label="Διοριστέοι"
            value={stats.total_dioristoi}
            delay={400}
          />
          <StatCard
            label="Θέσεις Προκήρυξης"
            value={stats.total_theseis}
            delay={500}
          />
          <StatCard
            label="Πίνακες Κατάταξης"
            value={stats.total_eidikotites}
            delay={600}
          />
          <StatCard
            label="Ποσοστό Επιτυχίας"
            value={Math.round(stats.pososto_epityxias)}
            suffix="%"
            delay={800}
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          style={{
            display: "flex",
            gap: "1rem",
            marginTop: "3rem",
            flexWrap: "wrap",
          }}
        >
          <a
            href="/search"
            className="btn-accent"
          >
            🔍 Αναζήτηση Α.Μ. →
          </a>
          <a
            href="/stats"
            className="btn-outline"
          >
            📊 Στατιστικά
          </a>
        </motion.div>
      </div>
    </section>
  );
}