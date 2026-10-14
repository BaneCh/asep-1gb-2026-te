"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Result {
  am: string;
  slug: string;
  aa: number;
  eponymo: string;
  onoma: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setSearched(true);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
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

          <h1
            className="font-display"
            style={{
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              fontWeight: 700,
              marginBottom: "1rem",
            }}
          >
            <span className="text-gradient">Αναζήτηση</span>
          </h1>

          <p
            style={{
              color: "var(--text-muted)",
              marginBottom: "2rem",
              fontSize: "1.1rem",
            }}
          >
            Ψάξε με Α.Μ. αίτησης ή Επώνυμο.
          </p>

          <div
            className="glass"
            style={{
              padding: "4px",
              marginBottom: "2rem",
            }}
          >
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="π.χ. 18663 ή ΠΑΠΑΓΟΡΑ"
              style={{
                width: "100%",
                padding: "20px 24px",
                fontSize: "1.1rem",
                background: "transparent",
                border: "none",
                color: "var(--text)",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          {loading && (
            <div
              style={{
                color: "var(--primary-text)",
                textAlign: "center",
                padding: "2rem",
              }}
            >
              Αναζήτηση...
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div
              className="glass"
              style={{
                padding: "2rem",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              Δεν βρέθηκαν αποτελέσματα για "{query}"
            </div>
          )}

          {!loading && results.length > 0 && (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {results.map((r, i) => (
                <motion.div
                  key={`${r.am}-${r.slug}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    href={`/ypopsifios/${r.am}?slug=${r.slug}&aa=${r.aa}`}
                    className="glass glass-hover"
                    style={{
                      padding: "1.25rem 1.5rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      textDecoration: "none",
                      color: "var(--text)",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "1.05rem",
                          marginBottom: "4px",
                        }}
                      >
                        {r.eponymo} {r.onoma}
                      </div>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--text-muted)",
                          fontFamily: "var(--font-jetbrains-mono), monospace",
                        }}
                      >
                        Α.Μ. {r.am}
                      </div>
                    </div>
                    <div
                      style={{
                        color: "var(--primary-text)",
                        fontSize: "1.5rem",
                      }}
                    >
                      →
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {!searched && query.length < 2 && (
            <div
              style={{
                color: "var(--text-dim)",
                textAlign: "center",
                padding: "3rem 1rem",
                fontSize: "0.95rem",
              }}
            >
              Πληκτρολόγησε τουλάχιστον 2 χαρακτήρες για αναζήτηση.
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}