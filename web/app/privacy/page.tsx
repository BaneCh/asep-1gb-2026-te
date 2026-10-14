import React from "react";
import Link from "next/link";
import { ShieldCheck, EyeOff, Cookie } from "lucide-react";
import ProfileLink from "@/components/layout/ProfileLink";
import { AUTHOR, CONTACT_URL } from "@/lib/site";

export const metadata = {
  title: "Προσωπικά Δεδομένα & Απόρρητο",
  description: "Πώς διαχειριζόμαστε τα δεδομένα και πώς μπορείτε να ζητήσετε απόκρυψη του ονόματός σας.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen py-28 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <Link
        href="/"
        className="text-sm text-muted hover:text-primary-text transition-colors inline-flex items-center gap-2 mb-8"
      >
        ← Επιστροφή στην Αρχική
      </Link>

      <div className="space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/40 text-success text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            GDPR & Διαφάνεια
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-heading">
            Προσωπικά Δεδομένα & Cookies
          </h1>
          <p className="text-muted mt-2 text-sm sm:text-base">
            Σε απλά ελληνικά.
          </p>
        </div>

        {/* 1. Πηγή Δεδομένων */}
        <div className="p-6 rounded-2xl bg-surface border border-line space-y-3">
          <h2 className="text-lg font-semibold text-heading">1. Από πού προέρχονται τα στοιχεία;</h2>
          <p className="text-sm text-body leading-relaxed">
            Όλα τα στοιχεία που εμφανίζονται στην πλατφόρμα προέρχονται <strong>αποκλειστικά από τους δημόσιους πίνακες αποτελεσμάτων</strong> που ανάρτησε ο ΑΣΕΠ στην επίσημη ιστοσελίδα του για την προκήρυξη 1ΓΒ/2026 (ΤΕ), και δεν εμφανίζεται τίποτα περισσότερο από όσα δημοσίευσε ο ΑΣΕΠ.
          </p>
          <p className="text-sm text-muted leading-relaxed">
            Δεν διαθέτουμε καμία πρόσβαση σε μη δημόσια αρχεία, ούτε συλλέγουμε τηλέφωνα, διευθύνσεις ή άλλα ευαίσθητα δεδομένα. Εμφανίζονται μόνο επώνυμο, όνομα, Α.Μ. αίτησης, βαθμολογίες και προσόντα όπως στους πίνακες κατάταξης· ο Αριθμός Δελτίου Ταυτότητας (ΑΔΤ) μόνο με μάσκα (π.χ. ***972). Δεν εμφανίζονται πατρώνυμα, ενδείξεις ειδικών κατηγοριών ή απορριπτέοι υποψήφιοι.
          </p>
        </div>

        {/* 2. Cookies */}
        <div className="p-6 rounded-2xl bg-surface border border-line space-y-3">
          <div className="flex items-center gap-2 text-heading font-semibold text-lg">
            <Cookie className="w-5 h-5 text-primary-text" />
            2. Χρησιμοποιούμε Cookies;
          </div>
          <p className="text-sm text-body leading-relaxed">
            <strong>Όχι.</strong> Η ιστοσελίδα δεν χρησιμοποιεί διαφημιστικά cookies ούτε cookies εντοπισμού προφίλ. 
            Χρησιμοποιούμε μόνο ανώνυμα τεχνικά στατιστικά επισκεψιμότητας (μέσω Vercel Analytics) χωρίς αποθήκευση προσωπικών αναγνωριστικών, αποκλειστικά για να γνωρίζουμε πόσοι επισκέπτες μπαίνουν στην πλατφόρμα.
          </p>
        </div>

        {/* 3. Δικαίωμα Απόκρυψης / Take-down (ΠΟΛΥ ΣΗΜΑΝΤΙΚΟ) */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-surface to-surface border border-primary/50 space-y-4">
        <div className="flex items-center gap-2 text-heading font-semibold text-lg">
            <EyeOff className="w-5 h-5 text-primary-text" />
            3. Θέλετε να αποκρύψετε το όνομά σας;
        </div>
        <p className="text-sm text-body leading-relaxed">
            Σεβόμαστε απόλυτα την επιθυμία οποιουδήποτε υποψηφίου να μην εμφανίζεται το ονοματεπώνυμό του στις αναζητήσεις αυτής της ανεξάρτητης πλατφόρμας.
        </p>
        <p className="text-sm text-body leading-relaxed">
            Αν επιθυμείτε την <strong>άμεση ανωνυμοποίηση</strong> των στοιχείων σας (π.χ. εμφάνιση μόνο με Α.Μ.), στείλτε μου ένα μήνυμα στο LinkedIn:
        </p>
        {CONTACT_URL.includes("linkedin.com") ? (
          <ProfileLink href={CONTACT_URL} kind="linkedin" label={`${AUTHOR} στο LinkedIn`} />
        ) : (
          <a
            href={CONTACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-surface border border-line font-mono text-sm text-primary-text hover:border-primary transition-colors flex items-center gap-2 w-fit"
          >
            <span>{CONTACT_URL.replace(/^mailto:/, "").replace(/^https?:\/\//, "")}</span>
          </a>
        )}
        <p className="text-xs text-dim">
            Αναφέρετε απλώς τον Α.Μ. της αίτησής σας και το όνομα σας θα αφαιρεθεί από την πλατφόρμα το συντομότερο δυνατό.
        </p>
        </div>

        {/* 4. Μη Επίσημος Χαρακτήρας */}
        <div className="text-xs text-dim leading-relaxed border-t border-line pt-6">
          * Η παρούσα ιστοσελίδα αποτελεί ιδιωτική, μη κερδοσκοπική πρωτοβουλία επεξεργασίας ανοιχτών δεδομένων και δεν συνδέεται επίσημα με το Ανώτατο Συμβούλιο Επιλογής Προσωπικού (ΑΣΕΠ).
        </div>
      </div>
    </main>
  );
}