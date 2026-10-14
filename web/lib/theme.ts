// Light / dark θέμα — κοινές σταθερές για το layout (server) και το ThemeToggle (client).
export const THEME_STORAGE_KEY = "theme";

// Εκτελείται inline στο <head> πριν το πρώτο paint: εφαρμόζει το αποθηκευμένο
// θέμα (προεπιλογή: light, όπως στο alexveskos.html) ώστε να μην «αναβοσβήνει».
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");document.documentElement.setAttribute("data-theme",t==="dark"?"dark":"light");}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;
