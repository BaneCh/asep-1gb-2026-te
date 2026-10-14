import Link from "next/link";

// Το AI chat είναι προσωρινά απενεργοποιημένο. Το αρχικό UI βρίσκεται στο
// ./_disabled/ChatPage.tsx (οι φάκελοι με "_" δεν γίνονται routes).
export const metadata = {
  title: "AI Βοηθός",
  robots: { index: false, follow: false },
};

export default function ChatPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "140px 24px 80px",
        textAlign: "center",
        position: "relative",
        zIndex: 1,
      }}
    >
      <h1
        className="font-display"
        style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "1rem" }}
      >
        Ο AI βοηθός δεν είναι διαθέσιμος
      </h1>
      <p
        style={{
          color: "var(--text-muted)",
          maxWidth: "560px",
          margin: "0 auto 2rem",
          lineHeight: 1.6,
        }}
      >
        Η λειτουργία είναι προσωρινά απενεργοποιημένη. Μπορείς να βρεις
        υποψηφίους, ειδικότητες και θέσεις από την αναζήτηση.
      </p>
      <Link href="/search" style={{ color: "var(--primary-text)", fontWeight: 600 }}>
        🔍 Μετάβαση στην αναζήτηση →
      </Link>
    </main>
  );
}
