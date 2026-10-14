// Κοινό mapping GeoJSON περιφέρεια → περιφερειακές ενότητες (όπως εμφανίζονται
// στο πεδίο `perifereia` του positions.json, δηλ. η «ΕΔΡΑ» της προκήρυξης).
// Η αντιστοίχιση είναι ΑΚΡΙΒΗΣ (όχι substring), ώστε σύντομα ονόματα όπως «ΚΩ»
// να μην ταιριάζουν λάθος. Το scripts/validate.py ελέγχει ότι κάθε ενότητα
// του positions.json υπάρχει εδώ.
export const PERIFEREIES_MAPPING: Record<string, string[]> = {
  Attiki: [
    "ΚΕΝΤΡΙΚΟΥ ΤΟΜΕΑ ΑΘΗΝΩΝ",
    "ΒΟΡΕΙΟΥ ΤΟΜΕΑ ΑΘΗΝΩΝ",
    "ΝΟΤΙΟΥ ΤΟΜΕΑ ΑΘΗΝΩΝ",
    "ΔΥΤΙΚΟΥ ΤΟΜΕΑ ΑΘΗΝΩΝ",
    "ΑΝΑΤΟΛΙΚΗΣ ΑΤΤΙΚΗΣ",
    "ΔΥΤΙΚΗΣ ΑΤΤΙΚΗΣ",
    "ΠΕΙΡΑΙΩΣ",
    "ΝΗΣΩΝ",
  ],
  "Kentriki Makedonia": [
    "ΘΕΣΣΑΛΟΝΙΚΗΣ",
    "ΗΜΑΘΙΑΣ",
    "ΚΙΛΚΙΣ",
    "ΠΕΛΛΑΣ",
    "ΠΙΕΡΙΑΣ",
    "ΣΕΡΡΩΝ",
    "ΧΑΛΚΙΔΙΚΗΣ",
  ],
  "Dytiki Makedonia": ["ΓΡΕΒΕΝΩΝ", "ΚΑΣΤΟΡΙΑΣ", "ΚΟΖΑΝΗΣ", "ΦΛΩΡΙΝΑΣ"],
  "Anatoliki Makedonia kai Thraki": [
    "ΔΡΑΜΑΣ",
    "ΕΒΡΟΥ",
    "ΚΑΒΑΛΑΣ",
    "ΘΑΣΟΥ",
    "ΞΑΝΘΗΣ",
    "ΡΟΔΟΠΗΣ",
  ],
  Ipeiros: ["ΑΡΤΑΣ", "ΘΕΣΠΡΩΤΙΑΣ", "ΙΩΑΝΝΙΝΩΝ", "ΠΡΕΒΕΖΑΣ"],
  Thessalia: ["ΚΑΡΔΙΤΣΑΣ", "ΛΑΡΙΣΑΣ", "ΜΑΓΝΗΣΙΑΣ", "ΤΡΙΚΑΛΩΝ", "ΣΠΟΡΑΔΩΝ"],
  "Ionioi Nisoi": ["ΖΑΚΥΝΘΟΥ", "ΚΕΡΚΥΡΑΣ", "ΚΕΦΑΛΛΗΝΙΑΣ", "ΛΕΥΚΑΔΑΣ", "ΙΘΑΚΗΣ"],
  "Dytiki Ellada": ["ΑΙΤΩΛΟΑΚΑΡΝΑΝΙΑΣ", "ΑΧΑΪΑΣ", "ΗΛΕΙΑΣ"],
  "Stereá Elláda": ["ΒΟΙΩΤΙΑΣ", "ΕΥΒΟΙΑΣ", "ΕΥΡΥΤΑΝΙΑΣ", "ΦΘΙΩΤΙΔΑΣ", "ΦΩΚΙΔΑΣ"],
  Peloponnisos: ["ΑΡΓΟΛΙΔΑΣ", "ΑΡΚΑΔΙΑΣ", "ΚΟΡΙΝΘΙΑΣ", "ΛΑΚΩΝΙΑΣ", "ΜΕΣΣΗΝΙΑΣ"],
  "Voreio Aigaio": ["ΛΕΣΒΟΥ", "ΛΗΜΝΟΥ", "ΣΑΜΟΥ", "ΧΙΟΥ"],
  "Notio Aigaio": [
    "ΑΝΔΡΟΥ",
    "ΘΗΡΑΣ",
    "ΚΕΑΣ - ΚΥΘΝΟΥ",
    "ΜΗΛΟΥ",
    "ΜΥΚΟΝΟΥ",
    "ΝΑΞΟΥ",
    "ΠΑΡΟΥ",
    "ΣΥΡΟΥ",
    "ΤΗΝΟΥ",
    "ΚΑΛΥΜΝΟΥ",
    "ΚΑΡΠΑΘΟΥ-ΗΡΩΙΚΗΣ ΝΗΣΟΥ ΚΑΣΟΥ",
    "ΚΩ",
    "ΡΟΔΟΥ",
  ],
  Kriti: ["ΗΡΑΚΛΕΙΟΥ", "ΛΑΣΙΘΙΟΥ", "ΡΕΘΥΜΝΟΥ", "ΧΑΝΙΩΝ"],
};

// Επίσημα ελληνικά ονόματα περιφερειών για τίτλους
export const REGION_TITLE_MAP: Record<string, string> = {
  Attiki: "ΠΕΡΙΦΕΡΕΙΑ ΑΤΤΙΚΗΣ",
  "Kentriki Makedonia": "ΚΕΝΤΡΙΚΗ ΜΑΚΕΔΟΝΙΑ",
  "Dytiki Makedonia": "ΔΥΤΙΚΗ ΜΑΚΕΔΟΝΙΑ",
  "Anatoliki Makedonia kai Thraki": "ΑΝΑΤΟΛΙΚΗ ΜΑΚΕΔΟΝΙΑ & ΘΡΑΚΗ",
  Ipeiros: "ΗΠΕΙΡΟΣ",
  Thessalia: "ΘΕΣΣΑΛΙΑ",
  "Ionioi Nisoi": "ΙΟΝΙΑ ΝΗΣΙΑ",
  "Dytiki Ellada": "ΔΥΤΙΚΗ ΕΛΛΑΔΑ",
  "Stereá Elláda": "ΣΤΕΡΕΑ ΕΛΛΑΔΑ",
  Peloponnisos: "ΠΕΛΟΠΟΝΝΗΣΟΣ",
  "Voreio Aigaio": "ΒΟΡΕΙΟ ΑΙΓΑΙΟ",
  "Notio Aigaio": "ΝΟΤΙΟ ΑΙΓΑΙΟ",
  Kriti: "ΚΡΗΤΗ",
};

export function normalizeRegion(text: string): string {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Επιστρέφει true αν η περιφερειακή ενότητα `unit` ανήκει στην περιφέρεια `geoName`
export function unitInRegion(unit: string, geoName: string): boolean {
  const u = normalizeRegion(unit);
  return (PERIFEREIES_MAPPING[geoName] || []).some(
    (gn) => normalizeRegion(gn) === u
  );
}
