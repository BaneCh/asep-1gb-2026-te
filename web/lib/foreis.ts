// Βοηθητικά για την αναζήτηση ανά φορέα (σελίδα /foreis και φίλτρο στον /xartis).
//
// Στο positions.json το πεδίο `foreas` έχει τη μορφή «ΚΥΡΙΟΣ ΦΟΡΕΑΣ | ΥΠΗΡΕΣΙΑ | ...»
// (π.χ. «ΥΠΟΥΡΓΕΙΟ ΔΙΚΑΙΟΣΥΝΗΣ | ΕΦΕΤΕΙΟ ΘΕΣΣΑΛΟΝΙΚΗΣ»). Το `foreas_main` είναι στην
// πράξη ίδιο με το `foreas`, οπότε ο κύριος φορέας προκύπτει από το πρώτο τμήμα.

/** Πεζά, χωρίς τόνους/διαλυτικά, «ς» → «σ»: για αναζήτηση ανεξάρτητη από τόνους/κεφαλαία. */
export function normalizeGr(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ς/g, "σ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Ο κύριος φορέας (πριν το πρώτο « | »). */
export function mainForeas(foreas: string): string {
  return String(foreas || "").split("|")[0].trim();
}

/** Η υπηρεσία μέσα στον φορέα (μετά το πρώτο « | »), ή "" αν δεν υπάρχει. */
export function subForeas(foreas: string): string {
  const parts = String(foreas || "").split("|").map((s) => s.trim()).filter(Boolean);
  return parts.slice(1).join(" · ");
}

const WORD_SPLIT = /[^\p{L}\p{N}]+/u;

/**
 * Ταιριάζει το κείμενο αναζήτησης στον φορέα;
 * - Οι ολοκληρωμένες λέξεις (όλες εκτός της τελευταίας, ή η τελευταία αν τελειώνει σε «ς»)
 *   πρέπει να ταιριάζουν σε ολόκληρη λέξη: «δημος» → «ΔΗΜΟΣ», όχι «ΔΗΜΟΣΙΩΝ».
 * - Η τελευταία, μισογραμμένη λέξη ταιριάζει ως αρχή λέξης: «υποδομ» → «ΥΠΟΔΟΜΩΝ».
 */
export function foreasMatches(foreas: string, query: string): boolean {
  // Πεζά αλλά με το τελικό «ς» ακόμα διακριτό, για να ξέρουμε αν η λέξη ολοκληρώθηκε
  const raw = (query || "").toLowerCase().split(WORD_SPLIT).filter(Boolean);
  if (!raw.length) return true;
  const fWords = normalizeGr(foreas).split(WORD_SPLIT).filter(Boolean);
  return raw.every((rw, i) => {
    const w = normalizeGr(rw);
    if (rw.endsWith("ς")) return fWords.includes(w); // γράφτηκε με τελικό σίγμα: ακριβής λέξη
    if (i === raw.length - 1) return fWords.some((f) => f.startsWith(w)); // μισογραμμένη
    // Ολοκληρωμένη λέξη: επιτρέπεται κατάληξη έως 2 γραμμάτων (θεσσαλονικη → θεσσαλονικης)
    return fWords.some((f) => f.startsWith(w) && f.length - w.length <= 2);
  });
}
