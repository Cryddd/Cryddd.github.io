import { createContext, useContext, useEffect, useState } from "react";

const InteractiveTextContext = createContext({
  enabled: true,
  toggle: () => {},
});

const STORAGE_KEY = "cryddd:interactive-text";

export function InteractiveTextProvider({ children }) {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return saved === "1";
    // Default off when the user prefers reduced motion.
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
    document.documentElement.dataset.interactiveText = enabled ? "on" : "off";
  }, [enabled]);

  const value = {
    enabled,
    toggle: () => setEnabled((v) => !v),
  };

  return (
    <InteractiveTextContext.Provider value={value}>
      {children}
    </InteractiveTextContext.Provider>
  );
}

export function useInteractiveText() {
  return useContext(InteractiveTextContext);
}
