import React from "react";
import Link from "next/link";
import { ShieldCheck, Heart } from "lucide-react";
import ProfileLink from "@/components/layout/ProfileLink";
import {
  AUTHOR,
  AUTHOR_LINKEDIN_URL,
  AUTHOR_GITHUB_URL,
  ORIGINAL_AUTHOR,
  ORIGINAL_AUTHOR_URL,
  ORIGINAL_REPO_URL,
  ORIGINAL_SITE_URL,
} from "@/lib/site";

export default function Footer() {
  return (
    <footer className="w-full border-t border-line bg-bg py-10 text-muted mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
          {/* Αριστερά: Στοιχεία Διαγωνισμού & Disclaimer */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
            <div className="flex items-center gap-2 text-heading font-semibold tracking-wide">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              ΑΣΕΠ 1ΓΒ/2026 ΤΕ Hub
            </div>
            <p className="text-xs text-muted max-w-md">
              Ανεξάρτητη πλατφόρμα επεξεργασίας των δημόσιων αποτελεσμάτων της
              προκήρυξης 1ΓΒ/2026 (ΤΕ). Δεν συνδέεται με τον ΑΣΕΠ· ο αριθμός
              ταυτότητας εμφανίζεται μόνο καλυμμένος (***).
            </p>
          </div>

          {/* Δεξιά: Δημιουργός + Credits */}
          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex flex-col items-center md:items-end gap-2">
              <div className="text-xs text-muted">
                Δημιουργία: <span className="text-heading font-medium">{AUTHOR}</span>
              </div>
              <div className="flex flex-wrap justify-center md:justify-end items-center gap-3">
                <ProfileLink href={AUTHOR_LINKEDIN_URL} kind="linkedin" label="LinkedIn" />
                {AUTHOR_GITHUB_URL && (
                  <ProfileLink href={AUTHOR_GITHUB_URL} kind="github" label="GitHub" />
                )}
              </div>
            </div>

            <Link href="/about" className="text-[11px] text-primary-text hover:underline flex items-center gap-1">
              Σχετικά με το project →
            </Link>
          </div>
        </div>

        {/* Credits στον Fokion — κεντραρισμένη κάρτα στο τέλος της σελίδας */}
        <div className="mt-8 flex justify-center">
          <div className="w-full max-w-2xl rounded-xl border border-primary bg-primary/10 px-5 py-4 flex flex-col items-center gap-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-body">
              <Heart className="w-4 h-4 text-primary-text shrink-0" />
              <span>
                Εμπνευσμένο από το project του{" "}
                <strong className="text-heading">{ORIGINAL_AUTHOR}</strong> για τα
                αποτελέσματα <strong className="text-heading">ΠΕ</strong> (2ΓΒ/2026) — ο
                αρχικός κώδικας είναι δικός του.
              </span>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-3">
              <ProfileLink href={ORIGINAL_SITE_URL} kind="web" label="Αποτελέσματα ΠΕ (2ΓΒ/2026)" />
              <ProfileLink href={ORIGINAL_AUTHOR_URL} kind="linkedin" label={ORIGINAL_AUTHOR} />
              <ProfileLink href={ORIGINAL_REPO_URL} kind="github" label="Αρχικός κώδικας" />
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-8 pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted gap-4">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            <span>Πηγή: δημόσιες ανακοινώσεις ΑΣΕΠ</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-dim">
            <Link href="/privacy" className="hover:text-body transition-colors underline">
              Απόρρητο & GDPR
            </Link>
          </div>
          <div>
            © {new Date().getFullYear()} {AUTHOR}
          </div>
        </div>
      </div>
    </footer>
  );
}
