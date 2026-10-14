// Light / dark θέμα — κοινές σταθερές για το layout (server) και το ThemeToggle (client).
export const THEME_STORAGE_KEY = "theme";

// Θέμα για όποιον μπαίνει πρώτη φορά (ή δεν έχει επιλέξει ακόμα). Αλλάξτε σε
// "light" για φωτεινό ξεκίνημα. Η επιλογή του επισκέπτη από το toggle υπερισχύει.
export const DEFAULT_THEME: "light" | "dark" = "dark";

const OTHER_THEME = DEFAULT_THEME === "dark" ? "light" : "dark";

// Εκτελείται inline στο <head> πριν το πρώτο paint: εφαρμόζει το αποθηκευμένο
// θέμα (ή το DEFAULT_THEME) ώστε να μην «αναβοσβήνει».
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");document.documentElement.setAttribute("data-theme",t==="${OTHER_THEME}"?"${OTHER_THEME}":"${DEFAULT_THEME}");}catch(e){document.documentElement.setAttribute("data-theme","${DEFAULT_THEME}");}})();`;
