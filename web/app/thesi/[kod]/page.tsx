"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatVathmologia, formatNumber } from "@/lib/utils";

interface Position {
  kod_thesis: string;
  eidikotita: string;
  kod_organogrammatos: string;
  foreas: string;
  foreas_main: string;
  edra: string;
  perifereia: string;
  dimos: string;
  nomos: string;
  titloi: string;
  prosonta: string;
  entopiotita: string;
  theseis: number;
}

interface Candidate {
  am: string;
  eponymo: string;
  onoma: string;
  vathmologia: number | null;
  aa: number;
  eidikotita: string;
  slug: string;
}

interface Stats {
  total: number;
  avg_vath: number | null;
  max_vath: number | null;
  min_vath: number | null;
}

interface ApiResponse {
  position: Position;
  candidates: Candidate[];
  stats: Stats;
}

export default function PositionPage() {
  const params = useParams();
  const kod = params?.kod as string;

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!kod) return;
    fetch(`/api/position/${kod}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d) setData(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [kod]);

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
        Φόρτωση...
      </main>
    );
  }

  if (notFound || !data) {
    return (
      <main style={{ minHeight: "100vh", padding: "120px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h1>Η θέση δεν βρέθηκε</h1>
          <Link href="/search" style={{ color: "var(--primary-text)" }}>
            ← Πίσω στην αναζήτηση
          </Link>
        </div>
      </main>
    );
  }

  const { position, candidates, stats } = data;

  // HRMS link (αν έχει κωδικό ψηφιακού οργανογράμματος)
  const hrmsLink = position.kod_organogrammatos
    ? `https://hrms.gov.gr/api/public/positions/${position.kod_organogrammatos.split(",")[0].trim()}/job-description`
    : null;

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "120px 24px 80px",
        position: "relative",
        zIndex: 1,
      }}
    >
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

        {/* Header */}
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
            ● Κωδικός Θέσης {position.kod_thesis}
          </div>

          <h1
            className="font-display"
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
              fontWeight: 700,
              marginBottom: "1.5rem",
              lineHeight: 1.2,
            }}
          >
            <span className="text-gradient">{position.eidikotita}</span>
          </h1>

          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "1.1rem",
              marginBottom: "3rem",
            }}
          >
            {position.foreas}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            marginBottom: "3rem",
          }}
        >
          <motion.div
            className="glass"
            style={{ padding: "1.5rem" }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
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
              Διορισμένοι
            </div>
            <div
              className="text-gradient"
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {formatNumber(stats.total)}
            </div>
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                marginTop: "4px",
              }}
            >
              από {position.theseis}{" "}
              {position.theseis === 1 ? "θέση" : "θέσεις"}
            </div>
          </motion.div>

          <motion.div
            className="glass"
            style={{ padding: "1.5rem" }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
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
              Μέση Βαθμολογία
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "var(--primary-text)",
                lineHeight: 1,
              }}
            >
              {formatVathmologia(stats.avg_vath)}
            </div>
          </motion.div>

          <motion.div
            className="glass"
            style={{ padding: "1.5rem" }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
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
              Max / Min
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.2 }}>
              <span style={{ color: "var(--success)" }}>
                {formatVathmologia(stats.max_vath)}
              </span>
              <span style={{ color: "var(--text-muted)", margin: "0 8px" }}>
                /
              </span>
              <span style={{ color: "var(--danger)" }}>
                {formatVathmologia(stats.min_vath)}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Details */}
        <motion.div
          className="glass"
          style={{ padding: "2rem", marginBottom: "2rem" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2
            className="font-display"
            style={{
              fontSize: "1.3rem",
              fontWeight: 600,
              marginBottom: "1.5rem",
            }}
          >
            Στοιχεία Θέσης
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1.5rem",
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
                Φορέας
              </div>
              <div style={{ fontSize: "0.95rem" }}>{position.foreas}</div>
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
                Έδρα
              </div>
              <div style={{ fontSize: "0.95rem" }}>{position.edra}</div>
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
                Περιφέρεια
              </div>
              <div style={{ fontSize: "0.95rem" }}>{position.perifereia}</div>
            </div>

            {position.dimos && (
              <div>
                <div
                  style={{
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginBottom: "4px",
                  }}
                >
                  Δήμος
                </div>
                <div style={{ fontSize: "0.95rem" }}>{position.dimos}</div>
              </div>
            )}

            {position.nomos && (
              <div>
                <div
                  style={{
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginBottom: "4px",
                  }}
                >
                  Νομός
                </div>
                <div style={{ fontSize: "0.95rem" }}>{position.nomos}</div>
              </div>
            )}

            <div>
              <div
                style={{
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: "4px",
                }}
              >
                Εντοπιότητα
              </div>
              <div style={{ fontSize: "0.95rem" }}>
                {position.entopiotita || "—"}
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
                Αποδεκτοί Τίτλοι
              </div>
              <div style={{ fontSize: "0.95rem" }}>
                {position.titloi || "—"}
              </div>
            </div>

            {position.prosonta && (
              <div>
                <div
                  style={{
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginBottom: "4px",
                  }}
                >
                  Πρόσθετα Προσόντα
                </div>
                <div style={{ fontSize: "0.95rem" }}>{position.prosonta}</div>
              </div>
            )}
          </div>

          {hrmsLink && (
            <div
              style={{
                marginTop: "2rem",
                paddingTop: "1.5rem",
                borderTop: "1px solid var(--border)",
              }}
            >
              <a
                href={hrmsLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "var(--primary-text)",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                🔗 Δες την περιγραφή καθηκόντων στο HRMS →
              </a>
            </div>
          )}
        </motion.div>

        {/* Candidates */}
        <motion.div
          className="glass"
          style={{ padding: "2rem" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2
            className="font-display"
            style={{
              fontSize: "1.3rem",
              fontWeight: 600,
              marginBottom: "1.5rem",
            }}
          >
            Διορισμένοι ({candidates.length})
          </h2>

          {candidates.length === 0 ? (
            <div
              style={{
                color: "var(--text-muted)",
                textAlign: "center",
                padding: "2rem",
              }}
            >
              Κανένας διορισμένος δεν βρέθηκε για αυτή τη θέση.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {candidates.map((c, i) => (
                <Link
                  key={`${c.am}-${i}`}
                  href={`/ypopsifios/${c.am}?slug=${c.slug}&aa=${c.aa}`}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "8px",
                    background: "var(--surface-subtle)",
                    border: "1px solid transparent",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
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
                        color: i < 3 ? "var(--primary-text)" : "var(--text-dim)",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                      }}
                    >
                      #{i + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                        {c.eponymo} {c.onoma}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          fontFamily: "var(--font-jetbrains-mono), monospace",
                        }}
                      >
                        Α.Μ. {c.am}
                      </div>
                    </div>
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
          )}
        </motion.div>
      </div>
    </main>
  );
}