import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Φορείς & θέσεις",
  description:
    "Αναζήτηση φορέα (δήμοι, υπουργεία, νοσοκομεία, πανεπιστήμια) της προκήρυξης ΑΣΕΠ 1ΓΒ/2026 ΤΕ: όλες οι θέσεις ανά ειδικότητα και οι κενές θέσεις.",
};

export default function ForeisLayout({ children }: { children: React.ReactNode }) {
  return children;
}
