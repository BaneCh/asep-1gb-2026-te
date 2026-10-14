"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "@/components/layout/ThemeToggle";

const NAV_ITEMS = [
  { href: "/", label: "Αρχική" },
  { href: "/xartis", label: "Χάρτης" },
  { href: "/search", label: "Αναζήτηση" },
  { href: "/stats", label: "Στατιστικά" },
  { href: "/about", label: "Σχετικά" },
];

// Μαύρη μπάρα πλοήγησης σε light & dark — όπως το .pf-nav του alexveskos.html
export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "#000",
        boxShadow: "0 2px 16px rgba(0,0,0,0.5)",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 20px",
          minHeight: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 no-underline"
        >
          <span
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "6px",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "15px",
              fontWeight: 700,
              color: "#000",
            }}
          >
            Α
          </span>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem", letterSpacing: "0.02em" }}>
            ΑΣΕΠ 1ΓΒ/2026 ΤΕ
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex" style={{ gap: "32px", alignItems: "center" }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  textDecoration: "none",
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: active ? "#fff" : "rgba(255,255,255,0.65)",
                  borderBottom: active ? "2px solid #61cae4" : "2px solid transparent",
                  padding: "6px 0",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = active ? "#fff" : "rgba(255,255,255,0.65)")
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <ThemeToggle />

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex md:hidden"
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "6px",
              padding: "4px 10px",
              color: "#fff",
              fontSize: "1.1rem",
              cursor: "pointer",
            }}
            aria-label="Μενού πλοήγησης"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: "#000",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              padding: "8px 20px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              overflow: "hidden",
            }}
            className="md:hidden"
          >
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    padding: "12px 4px",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: active ? "#fff" : "rgba(255,255,255,0.65)",
                    borderLeft: active ? "2px solid #61cae4" : "2px solid transparent",
                    paddingLeft: "12px",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
