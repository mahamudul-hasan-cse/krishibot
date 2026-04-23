"use client";

import { useEffect, useState } from "react";
import { Sun, Sprout } from "lucide-react";

const STORAGE_KEY = "krishibot_theme";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem(STORAGE_KEY, "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem(STORAGE_KEY, "light");
    }
  }

  if (!mounted) {
    // Avoid hydration mismatch — render a neutral placeholder until mounted.
    return <div className="w-9 h-9" aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark agriculture mode"}
      aria-label="Toggle theme"
      className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-50 dark:border-soil-600 dark:text-soil-100 dark:hover:bg-soil-700 transition-colors"
    >
      {isDark
        ? <Sprout size={16} strokeWidth={2} />
        : <Sun size={16} strokeWidth={2} />}
    </button>
  );
}
