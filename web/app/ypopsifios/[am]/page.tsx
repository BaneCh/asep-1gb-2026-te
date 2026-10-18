"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { formatVathmologia } from "@/lib/utils";
import EpilaxontesCard, { type EpilaxonRow } from "@/components/ypopsifios/EpilaxontesCard";

interface Candidate {
  am: string;
  aa: number;
  eponymo: string;
  onoma: string;
  adt_masked: string;
  omada_prosonton: string;
  thesi_diorismou: string;
  pinakas: string;
  metaptyxiako: string;
  didaktoriko: string;
  minas_empeirias: number | null;
  monades_empeirias: number | null;
  kod_entopiotitas: string;
  math1: number | null;
  math2: number | null;
  synolo_graptou: number | null;
  vathmologia: number | null;
  eidikotita: string;
  eidikotitaSlug: string;
}

function StatBox({
  label,
  value,
  highlight = false,
  delay = 0,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, duration: 0.5 }}
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
          fontSize: "1.5rem",
          fontWeight: 700,
          color: highlight ? undefined : "var(--text)",
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
    </motion.div>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const am = params?.am as string;
  const slugParam = searchParams?.get("slug");
  const aaParam = searchParams?.get("aa");

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [epilaxontes, setEpilaxontes] = useState<EpilaxonRow[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!am) return;
    const cleanAm = String(am).replace(/\.0$/, "");
    fetch(`/api/ypopsifios?am=${encodeURIComponent(cleanAm)}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data && data.all) {
          setCandidates(data.all);
          setEpilaxontes(data.epilaxontes || []);
          // Αν έχουμε slug (+ προαιρετικά aa) param, διάλεξε αυτή την εγγραφή.
          // Ο ίδιος Α.Μ. μπορεί να υπάρχει πολλές φορές στον ίδιο πίνακα
          // (μία ανά ομάδα προσόντων), γι' αυτό το aa ξεχωρίζει την εγγραφή.
          if (slugParam) {
            const idx = data.all.findIndex(
              (c: Candidate) =>
                c.eidikotitaSlug === slugParam &&
                (!aaParam || String(c.aa) === aaParam)
            );
            if (idx >= 0) setActiveIdx(idx);
          }
        }
      })
      .catch((e) => {
        console.error(e);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [am, slugParam, aaParam]);

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
        Φόρτωση προφίλ...
      </main>
    );
  }

  if (notFound || candidates.length === 0) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: "120px 24px",
          textAlign: "center",
        }}
      >
        <h1 style={{ marginBottom: "1rem" }}>Δεν βρέθηκε</h1>
        <Link href="/search" style={{ color: "var(--primary-text)" }}>
          ← Πίσω στην αναζήτηση
        </Link>
      </main>
    );
  }

  const candidate = candidates[activeIdx];
  const isDioristaios = !!candidate.thesi_diorismou;
  const cleanAmString = String(candidate.am).replace(/\.0$/, "");
  const cleanThesiKod = candidate.thesi_diorismou
    ? String(candidate.thesi_diorismou).replace(/\.0$/, "")
    : "";

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "120px 24px 80px",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <Link
          href="/search"
          style={{
            color: "var(--text-muted)",
            textDecoration: "none",
            fontSize: "0.9rem",
            display: "inline-block",
            marginBottom: "2rem",
          }}
        >
          ← Πίσω στην αναζήτηση
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "6px 16px",
              borderRadius: "100px",
              border: "1px solid var(--border)",
              background: isDioristaios
                ? "rgb(var(--success-rgb) / 0.08)"
                : "rgb(var(--danger-rgb) / 0.08)",
              fontSize: "0.75rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: isDioristaios ? "var(--success)" : "var(--danger)",
              marginBottom: "1.5rem",
            }}
          >
            ● {isDioristaios ? "Διοριστέος" : "Μη διοριστέος"}
          </div>

          <h1
            className="font-display"
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              marginBottom: "0.5rem",
            }}
          >
            {candidate.eponymo} {candidate.onoma}
          </h1>

          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "1.05rem",
              marginBottom: "3rem",
            }}
          >
            Α.Μ.{" "}
            <span
              style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
            >
              {cleanAmString}
            </span>
            {candidate.adt_masked && ` · ${candidate.adt_masked}`}
          </p>
        </motion.div>

        {/* === Επιλογή ειδικότητας (αν έχει πολλαπλές) === */}
        {candidates.length > 1 && (
          <div
            style={{
              marginBottom: "2rem",
              padding: "1rem 1.25rem",
              background: "rgb(var(--primary-rgb) / 0.04)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--text-muted)",
                marginBottom: "0.75rem",
              }}
            >
              {(() => {
                const tables = new Set(candidates.map((c) => c.eidikotitaSlug)).size;
                return `${candidates.length} εγγραφές σε ${tables} ${
                  tables === 1 ? "πίνακα" : "πίνακες"
                } κατάταξης (μία ανά ομάδα προσόντων)`;
              })()}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {candidates.map((c, i) => (
                <button
                  key={`${c.eidikotitaSlug}-${i}`}
                  onClick={() => setActiveIdx(i)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border:
                      i === activeIdx
                        ? "1px solid var(--primary)"
                        : "1px solid var(--border)",
                    background:
                      i === activeIdx
                        ? "rgb(var(--primary-rgb) / 0.1)"
                        : "transparent",
                    color: i === activeIdx ? "var(--primary-text)" : "var(--text)",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "left",
                  }}
                >
                  {c.eidikotita.length > 60
                    ? c.eidikotita.substring(0, 60) + "..."
                    : c.eidikotita}
                  <span style={{ opacity: 0.6 }}>
                    {" "}· #{c.aa} · ομάδα {c.omada_prosonton}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Βασικά KPIs (με κλικαρίσιμη θέση διορισμού) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            marginBottom: "3rem",
          }}
        >
          <StatBox
            label="Τελική Βαθμολογία"
            value={formatVathmologia(candidate.vathmologia)}
            highlight
            delay={100}
          />
          <StatBox
            label="Σύνολο Γραπτού"
            value={formatVathmologia(candidate.synolo_graptou)}
            delay={200}
          />

          {/* Κλικαρίσιμο κουτί Θέσης Διορισμού */}
          {cleanThesiKod ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 300 / 1000, duration: 0.5 }}
            >
              <Link
                href={`/thesi/${cleanThesiKod}`}
                className="glass glass-hover"
                style={{
                  padding: "1.25rem",
                  display: "block",
                  textDecoration: "none",
                  borderRadius: "16px",
                  border: "1px solid rgb(var(--primary-rgb) / 0.25)",
                  background: "rgb(var(--primary-rgb) / 0.03)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "var(--text-muted)",
                    }}
                  >
                    Θέση Διορισμού
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--primary-text)",
                      fontWeight: 600,
                    }}
                  >
                    Λεπτομέρειες →
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "var(--primary-text)",
                    lineHeight: 1.2,
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                  }}
                >
                  #{cleanThesiKod}
                </div>
              </Link>
            </motion.div>
          ) : (
            <StatBox label="Θέση Διορισμού" value="—" delay={300} />
          )}

          <StatBox label="Σειρά" value={`#${candidate.aa}`} delay={400} />
        </div>

        {/* Σειρά αναπλήρωσης — μόνο για μη διοριστέους */}
        {!isDioristaios && <EpilaxontesCard rows={epilaxontes} />}

        <h2
          className="font-display"
          style={{ fontSize: "1.5rem", marginBottom: "1rem" }}
        >
          Αναλυτικές Βαθμολογίες
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            marginBottom: "3rem",
          }}
        >
          <StatBox
            label="Μαθ 1 (Γνώσεις)"
            value={formatVathmologia(candidate.math1)}
          />
          <StatBox
            label="Μαθ 2 (Δεξιότητες)"
            value={formatVathmologia(candidate.math2)}
          />
          <StatBox
            label="Μήνες Εμπειρίας"
            value={candidate.minas_empeirias ?? "—"}
          />
          <StatBox
            label="Μονάδες Εμπειρίας"
            value={candidate.monades_empeirias ?? "—"}
          />
        </div>

        <h2
          className="font-display"
          style={{ fontSize: "1.5rem", marginBottom: "1rem" }}
        >
          Στοιχεία Ειδικότητας
        </h2>

        <div
          className="glass"
          style={{ padding: "1.5rem", marginBottom: "3rem" }}
        >
          <div style={{ marginBottom: "1rem" }}>
            <div
              style={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "4px",
              }}
            >
              Ειδικότητα
            </div>
            <div style={{ fontWeight: 600 }}>{candidate.eidikotita}</div>
          </div>

          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            <div>
              <div
                style={{
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: "4px",
                }}
              >
                Πίνακας
              </div>
              <div>{candidate.pinakas || "—"}</div>
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
                Μεταπτυχιακό
              </div>
              <div>{candidate.metaptyxiako || "—"}</div>
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
                Διδακτορικό
              </div>
              <div>{candidate.didaktoriko || "—"}</div>
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
                Κωδ. Εντοπιότητας
              </div>
              <div>{candidate.kod_entopiotitas || "—"}</div>
            </div>
          </div>
        </div>

        <Link
          href={`/eidikotita/${candidate.eidikotitaSlug}`}
          className="glass glass-hover"
          style={{
            padding: "16px 32px",
            display: "inline-block",
            color: "var(--primary-text)",
            textDecoration: "none",
            fontWeight: 600,
            borderRadius: "12px",
          }}
        >
          Δες όλη την ειδικότητα →
        </Link>
      </div>
    </main>
  );
}