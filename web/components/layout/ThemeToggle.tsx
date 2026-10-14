"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/lib/theme";

// Light / dark όπως στο alexveskos.html: «Active: Light Mode» + ήλιος/φεγγάρι.
// Το θέμα αποθηκεύεται στο localStorage και εφαρμόζεται πριν το πρώτο paint
// από το THEME_INIT_SCRIPT (lib/theme.ts, inline στο app/layout.tsx).

type Theme = "light" | "dark";

function readTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore<Theme>(subscribe, readTheme, () => DEFAULT_THEME);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // π.χ. ιδιωτική περιήγηση — το θέμα απλώς δεν θυμάται την επιλογή
    }
  }

  const label = theme === "dark" ? "Dark Mode" : "Light Mode";

  return (
    <button
      type="button"
      onClick={toggle}
      className="pf-theme-toggle"
      aria-label={theme === "dark" ? "Αλλαγή σε φωτεινό θέμα" : "Αλλαγή σε σκοτεινό θέμα"}
      title={theme === "dark" ? "Φωτεινό θέμα" : "Σκοτεινό θέμα"}
    >
      <span className="pf-active">
        Active: <span>{label}</span>
      </span>
      <span className={`pf-toggle ${theme === "dark" ? "toggle-dark" : "toggle-light"}`} />
    </button>
  );
}
