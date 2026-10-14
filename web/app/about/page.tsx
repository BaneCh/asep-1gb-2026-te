import React from "react";
import Link from "next/link";
import { HelpCircle, ShieldCheck, ExternalLink, Zap, Heart, User } from "lucide-react";
import ProfileLink from "@/components/layout/ProfileLink";
import {
  ASEP_RESULTS_URL,
  FEK_URL,
  AUTHOR,
  AUTHOR_LINKEDIN_URL,
  AUTHOR_GITHUB_URL,
  ORIGINAL_AUTHOR,
  ORIGINAL_AUTHOR_URL,
  ORIGINAL_REPO_URL,
  ORIGINAL_SITE_URL,
} from "@/lib/site";

export const metadata = {
  title: "Σχετικά με το Project",
  description:
    "Τι είναι αυτή η πλατφόρμα για τα αποτελέσματα ΑΣΕΠ 1ΓΒ/2026 (ΤΕ), από πού προέρχονται τα δεδομένα και σε ποιο project βασίζεται.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen py-28 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <Link
        href="/"
        className="text-sm text-muted hover:text-primary-text transition-colors inline-flex items-center gap-2 mb-8"
      >
        ← Επιστροφή στην Αρχική
      </Link>

      <div className="space-y-10">
        {/* Title */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/50 text-primary-text text-xs font-semibold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" />
            Side Project • 1ΓΒ/2026 ΤΕ
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold font-display tracking-tight text-heading">
            Σχετικά με{" "}
            <span>
              αυτή την πλατφόρμα
            </span>
          </h1>
          <p className="text-lg text-body leading-relaxed">
            Τα οριστικά αποτελέσματα της προκήρυξης ΑΣΕΠ 1ΓΒ/2026 για θέσεις
            Τεχνολογικής Εκπαίδευσης (ΤΕ), συγκεντρωμένα σε ένα σημείο.
          </p>
        </div>

        {/* Τι είναι */}
        <div className="p-8 rounded-2xl bg-surface border border-line space-y-4">
          <h2 className="text-xl font-bold text-heading flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary-text" />
            Τι θα βρεις εδώ
          </h2>
          <p className="text-body leading-relaxed text-sm sm:text-base">
            Ο ΑΣΕΠ δημοσίευσε τα αποτελέσματα σε 36 ξεχωριστά αρχεία Excel — 34 πίνακες
            κατάταξης (ένας ανά ειδικότητα) και δύο συγκεντρωτικά — ενώ οι 2.628 θέσεις
            περιγράφονται στο ΦΕΚ της προκήρυξης, σε πάνω από 120 σελίδες πινάκων.
          </p>
          <p className="text-body leading-relaxed text-sm sm:text-base">
            Εδώ τα στοιχεία αυτά ενώνονται: αναζήτηση με Α.Μ. ή ονοματεπώνυμο, σελίδα
            ανά ειδικότητα με βαθμολογίες και διοριστέους, σελίδα ανά κωδικό θέσης και
            χάρτης με την κατανομή των θέσεων ανά περιοχή.
          </p>
        </div>

        {/* Credits — εμφανώς: έμπνευση και αρχικός κώδικας από τον Fokion */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-primary/15 to-surface border border-primary space-y-4">
          <h2 className="text-xl font-bold text-heading flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary-text" />
            Έμπνευση & αρχικός κώδικας: {ORIGINAL_AUTHOR}
          </h2>
          <p className="text-body leading-relaxed text-sm sm:text-base">
            Αυτή η πλατφόρμα είναι εμπνευσμένη από το open-source project του{" "}
            <strong className="text-heading">{ORIGINAL_AUTHOR}</strong> για τα αποτελέσματα
            της 2ΓΒ/2026 (ΠΕ), και ο πηγαίος κώδικάς της προέρχεται από εκείνο το project,
            με την άδειά του. Ο σχεδιασμός, ο χάρτης και η αρχική δομή δεδομένων είναι
            δική του δουλειά· εδώ προσαρμόστηκαν για τα αρχεία της 1ΓΒ/2026 (ΤΕ).
            Ευχαριστώ πολύ!
          </p>
          <p className="text-body leading-relaxed text-sm sm:text-base">
            Αν ψάχνεις αποτελέσματα <strong className="text-heading">ΠΕ (Πανεπιστημιακής
            Εκπαίδευσης) της 2ΓΒ/2026</strong>, θα τα βρεις στην ιστοσελίδα του:
          </p>
          <div className="flex flex-wrap gap-3">
            <ProfileLink href={ORIGINAL_SITE_URL} kind="web" label="Αποτελέσματα ΠΕ (2ΓΒ/2026) — asep-2gb-2026.vercel.app" />
            <ProfileLink href={ORIGINAL_AUTHOR_URL} kind="linkedin" label={`${ORIGINAL_AUTHOR} στο LinkedIn`} />
            <ProfileLink href={ORIGINAL_REPO_URL} kind="github" label="Αρχικός κώδικας (GitHub)" />
          </div>
        </div>

        {/* Δημιουργός αυτής της έκδοσης */}
        <div className="p-6 rounded-2xl bg-surface border border-line space-y-3">
          <h2 className="text-base font-semibold text-heading flex items-center gap-2">
            <User className="w-5 h-5 text-primary-text" />
            Δημιουργός της έκδοσης 1ΓΒ/2026 (ΤΕ)
          </h2>
          <p className="text-sm text-body leading-relaxed">
            Προσαρμογή για τα αποτελέσματα ΤΕ:{" "}
            <strong className="text-heading">{AUTHOR}</strong>. Για σχόλια, διορθώσεις ή
            ιδέες, μπορείς να επικοινωνήσεις μέσω LinkedIn.
          </p>
          <div className="flex flex-wrap gap-3">
            <ProfileLink href={AUTHOR_LINKEDIN_URL} kind="linkedin" label={`${AUTHOR} στο LinkedIn`} />
            {AUTHOR_GITHUB_URL && (
              <ProfileLink href={AUTHOR_GITHUB_URL} kind="github" label="GitHub" />
            )}
          </div>
        </div>

        {/* Προσωπικά δεδομένα */}
        <div className="p-6 rounded-2xl bg-surface border border-line space-y-3">
          <div className="flex items-center gap-2 text-heading font-semibold">
            <ShieldCheck className="w-5 h-5 text-success" />
            Προσωπικά Δεδομένα
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Όλα τα δεδομένα προέρχονται αποκλειστικά από τις δημόσιες ανακοινώσεις του
            ΑΣΕΠ και δεν εμφανίζεται τίποτα περισσότερο από όσα δημοσίευσε ο ΑΣΕΠ.
            Εμφανίζονται μόνο επώνυμο, όνομα, Α.Μ. αίτησης και ο αριθμός ταυτότητας
            καλυμμένος (***). Δεν εμφανίζονται πατρώνυμα, ειδικές κατηγορίες ούτε
            απορριπτέοι υποψήφιοι.
          </p>
        </div>

        {/* Επίσημες Πηγές ΑΣΕΠ */}
        <div className="p-5 rounded-xl bg-surface border border-line space-y-2">
          <div className="text-xs font-semibold text-muted uppercase tracking-wider">
            Επίσημες Πηγές Αναφοράς (ΑΣΕΠ)
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <a
              href={ASEP_RESULTS_URL}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1.5 text-xs text-primary-text hover:underline"
            >
              <span>📄 Οριστικά Αποτελέσματα 1ΓΒ/2026 (ΑΣΕΠ)</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
            <span className="hidden sm:inline text-dim">•</span>
            <a
              href={FEK_URL}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1.5 text-xs text-primary-text hover:underline"
            >
              <span>🏛️ ΦΕΚ Προκήρυξης 1ΓΒ/2026 (Α.Σ.Ε.Π. 11/25.02.2026)</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>
          <p className="text-xs text-dim pt-2">
            Η πλατφόρμα είναι ανεξάρτητη και δεν συνδέεται με τον ΑΣΕΠ. Για κάθε
            επίσημη χρήση ισχύουν μόνο οι ανακοινώσεις του ΑΣΕΠ.
          </p>
        </div>

        <div className="pt-6 border-t border-line text-sm text-muted">
          Καλή επιτυχία σε όλους τους υποψηφίους!
        </div>
      </div>
    </main>
  );
}
