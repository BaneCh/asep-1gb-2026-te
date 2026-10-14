// Κεντρικές ρυθμίσεις του site. Ορίστε NEXT_PUBLIC_SITE_URL στο deployment
// (π.χ. https://to-site-sou.vercel.app). Στο Vercel, αν λείπει, χρησιμοποιείται
// αυτόματα το production domain του project.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const SITE_NAME = "ΑΣΕΠ 1ΓΒ/2026 ΤΕ Hub";
export const CONTEST = "1ΓΒ/2026";

// Επίσημες πηγές ΑΣΕΠ
export const ASEP_RESULTS_URL = "https://info.asep.gr/node/79995";
export const FEK_URL =
  "https://ia37rg02wpsa01.blob.core.windows.net/fek/10/2026/20261000011.pdf";

// Δημιουργός αυτής της έκδοσης (1ΓΒ/2026 ΤΕ)
export const AUTHOR = "Alexandros Veskos";
export const AUTHOR_LINKEDIN_URL = "https://www.linkedin.com/in/alex-veskos/";

// Επικοινωνία για αιτήματα απόκρυψης ονόματος (σελίδα «Απόρρητο»).
// Προεπιλογή: το LinkedIn σου. Μπορεί να αλλάξει με NEXT_PUBLIC_CONTACT_URL
// (π.χ. "mailto:...").
export const CONTACT_URL = process.env.NEXT_PUBLIC_CONTACT_URL || AUTHOR_LINKEDIN_URL;
// Όσο είναι κενό, το κουμπί GitHub δεν εμφανίζεται.
export const AUTHOR_GITHUB_URL = "https://github.com/BaneCh";

// Credits — βασίζεται στο open-source project του Fokion για την 2ΓΒ/2026 (ΠΕ)
export const ORIGINAL_AUTHOR = "Fokion";
export const ORIGINAL_AUTHOR_URL = "https://www.linkedin.com/in/fokionas/";
export const ORIGINAL_REPO_URL =
  "https://github.com/trooperas/asep-2gb-2026-analytics";
// Η ιστοσελίδα του Fokion με τα αποτελέσματα ΠΕ (2ΓΒ/2026)
export const ORIGINAL_SITE_URL = "https://asep-2gb-2026.vercel.app/";
