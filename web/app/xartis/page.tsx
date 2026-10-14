"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import GreeceMap from "@/components/maps/GreeceMap";
import { formatNumber } from "@/lib/utils";
import {
  PERIFEREIES_MAPPING,
  REGION_TITLE_MAP,
  normalizeRegion,
  unitInRegion,
} from "@/lib/regions";

// Ενιαίο όνομα ειδικότητας για το φίλτρο: το ΦΕΚ γράφει την ίδια ειδικότητα με
// παραλλαγές («(ΙΔΑΧ)*», «Ή»/«ή», «ΔΙΟΙΚΗΤΙΚΟΥ- ΛΟΓΙΣΤΙΚΟΥ»). Επίσης το
// «ΤΕ Χ ΕΙΔ. ΤΕ Χ» γίνεται απλώς «ΤΕ Χ».
function specialtyLabel(eidikotita: string): string {
  const s = String(eidikotita || "")
    .replace(/\(ΙΔΑΧ\)\*?/g, "")
    .replace(/Ή/g, "ή")
    .replace(/-\s+/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  const m = s.match(/^(.+?) ΕΙΔ\. (.+)$/);
  return m && m[1] === m[2] ? m[1] : s;
}

export default function XartisPage() {
  const [positions, setPositions] = useState<any[]>([]);
  const [citiesGeo, setCitiesGeo] = useState<Record<string, any>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [eidikotitaFilter, setEidikotitaFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/data/positions.json").then((r) => r.json()),
      fetch("/data/cities-geo.json").then((r) => r.json()),
    ])
      .then(([pos, cities]) => {
        setPositions(pos);
        setCitiesGeo(cities);
      })
      .catch((e) => console.error("Load error:", e))
      .finally(() => setLoading(false));
  }, []);

  function handleSelect(region: string) {
    setSelected(region);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  // Επιλογές dropdown: ειδικότητες με το σύνολο θέσεων η καθεμία
  const eidikotitaOptions = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const p of positions) {
      const label = specialtyLabel(p.eidikotita);
      acc[label] = (acc[label] || 0) + (p.theseis || 0);
    }
    return Object.entries(acc)
      .map(([label, theseis]) => ({ label, theseis }))
      .sort((a, b) => a.label.localeCompare(b.label, "el"));
  }, [positions]);

  // Θέσεις μετά το φίλτρο ειδικότητας — τροφοδοτούν και τον χάρτη και τη λίστα
  const filteredPositions = useMemo(() => {
    if (!eidikotitaFilter) return positions;
    return positions.filter((p) => specialtyLabel(p.eidikotita) === eidikotitaFilter);
  }, [positions, eidikotitaFilter]);

  const filteredTheseis = useMemo(
    () => filteredPositions.reduce((sum, p) => sum + (p.theseis || 0), 0),
    [filteredPositions]
  );

  // Αυστηρό, memoized φιλτράρισμα θέσεων (χωρίς false positives)
  const selectedPositions = useMemo(() => {
    if (!selected) return [];

    // Κλικ σε περιφέρεια του χάρτη (π.χ. "Attiki") ή σε marker περιφερειακής ενότητας
    if (PERIFEREIES_MAPPING[selected]) {
      return filteredPositions.filter((p) => unitInRegion(p.perifereia || "", selected));
    }
    const selNorm = normalizeRegion(selected);
    return filteredPositions.filter((p) => normalizeRegion(p.perifereia || "") === selNorm);
  }, [selected, filteredPositions]);

  const totalTheseis = useMemo(() => {
    return selectedPositions.reduce((sum, p) => sum + (p.theseis || 0), 0);
  }, [selectedPositions]);

  // Σωστός τίτλος: Ελληνικό όνομα περιφέρειας ή όνομα πόλης
  const displayTitle = selected
    ? REGION_TITLE_MAP[selected] || selected.toUpperCase()
    : "";

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
        Φόρτωση χάρτη...
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "90px 16px 60px",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
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
            ● Χάρτης Θέσεων
          </div>

          <h1
            className="font-display"
            style={{
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              fontWeight: 700,
              marginBottom: "1rem",
            }}
          >
            <span className="text-gradient">Χάρτης</span> Ελλάδας
          </h1>

          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "1.1rem",
              marginBottom: "2rem",
              maxWidth: "700px",
            }}
          >
            Πάτησε σε μια περιφέρεια ή σε έναν κύκλο πόλης για να δεις τις θέσεις που προκηρύχθηκαν.
            Μπορείς να φιλτράρεις και ανά ειδικότητα.
          </p>
        </motion.div>

        {/* Φίλτρο ειδικότητας */}
        <div
          className="glass"
          style={{
            padding: "1rem 1.25rem",
            marginBottom: "1.5rem",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0.75rem 1rem",
          }}
        >
          <label
            htmlFor="eidikotita-filter"
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--text-muted)",
            }}
          >
            Ειδικότητα
          </label>
          <select
            id="eidikotita-filter"
            value={eidikotitaFilter}
            onChange={(e) => setEidikotitaFilter(e.target.value)}
            style={{
              flex: "1 1 320px",
              minWidth: 0,
              maxWidth: "100%",
              padding: "10px 12px",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              background: "var(--bg-elevated)",
              color: "var(--text)",
              fontSize: "0.9rem",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            <option value="">Όλες οι ειδικότητες ({formatNumber(eidikotitaOptions.reduce((s, o) => s + o.theseis, 0))} θέσεις)</option>
            {eidikotitaOptions.map((o) => (
              <option key={o.label} value={o.label}>
                {o.label} ({formatNumber(o.theseis)} {o.theseis === 1 ? "θέση" : "θέσεις"})
              </option>
            ))}
          </select>
          {eidikotitaFilter && (
            <>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                {formatNumber(filteredPositions.length)} κωδικοί · {formatNumber(filteredTheseis)} θέσεις
              </span>
              <button
                onClick={() => setEidikotitaFilter("")}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                ✕ Καθαρισμός
              </button>
            </>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GreeceMap
            positions={filteredPositions}
            citiesGeo={citiesGeo}
            onSelectPerifereia={handleSelect}
          />
        </motion.div>

        {/* Selected region details container with smooth scroll ref */}
        <div ref={resultsRef} style={{ scrollMarginTop: "100px" }}>
          <AnimatePresence>
            {selected && (
              <motion.div
                key={selected}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="glass"
                style={{ padding: "2rem", marginTop: "2rem" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "1rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div>
                    <h2
                      className="font-display"
                      style={{
                        fontSize: "1.75rem",
                        fontWeight: 700,
                        marginBottom: "0.5rem",
                      }}
                    >
                      <span className="text-gradient">{displayTitle}</span>
                    </h2>
                    <p
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.95rem",
                      }}
                    >
                      {formatNumber(selectedPositions.length)} κωδικοί θέσεων ·{" "}
                      {formatNumber(totalTheseis)} συνολικές θέσεις
                    </p>
                    {eidikotitaFilter && (
                      <p style={{ color: "var(--primary-text)", fontSize: "0.85rem", marginTop: "4px" }}>
                        Φίλτρο: {eidikotitaFilter}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setSelected(null)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "transparent",
                      color: "var(--text-muted)",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    ✕ Κλείσιμο
                  </button>
                </div>

                {/* Λίστα θέσεων */}
                <div
                  style={{
                    display: "grid",
                    gap: "0.75rem",
                    maxHeight: "600px",
                    overflowY: "auto",
                    paddingRight: "8px",
                  }}
                >
                  {selectedPositions.slice(0, 50).map((p, i) => (
                    <Link
                      key={`${p.kod_thesis}-${i}`}
                      href={`/thesi/${p.kod_thesis}`}
                      style={{
                        padding: "14px 18px",
                        borderRadius: "10px",
                        background: "var(--surface-subtle)",
                        border: "1px solid transparent",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "1rem",
                        textDecoration: "none",
                        color: "var(--text)",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--primary)";
                        e.currentTarget.style.background =
                          "rgb(var(--primary-rgb) / 0.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "transparent";
                        e.currentTarget.style.background =
                          "var(--surface-subtle)";
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "0.95rem",
                            marginBottom: "4px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {p.foreas}
                        </div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--text-muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {p.eidikotita}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: "4px",
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            color: "var(--primary-text)",
                            fontFamily:
                              "var(--font-jetbrains-mono), monospace",
                            fontWeight: 600,
                            fontSize: "0.9rem",
                          }}
                        >
                          #{p.kod_thesis}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {p.theseis}{" "}
                          {p.theseis === 1 ? "θέση" : "θέσεις"}
                        </div>
                      </div>
                    </Link>
                  ))}

                  {selectedPositions.length > 50 && (
                    <div
                      style={{
                        textAlign: "center",
                        color: "var(--text-muted)",
                        padding: "1rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      ... και άλλοι {selectedPositions.length - 50} κωδικοί θέσεων
                      {!eidikotitaFilter && " — διάλεξε ειδικότητα για να περιορίσεις τη λίστα"}
                    </div>
                  )}

                  {selectedPositions.length === 0 && (
                    <div
                      style={{
                        textAlign: "center",
                        color: "var(--text-muted)",
                        padding: "2rem",
                      }}
                    >
                      Δεν βρέθηκαν θέσεις για αυτή την επιλογή.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}