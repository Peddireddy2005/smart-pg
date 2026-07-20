import { useEffect, useState } from "react";

/**
 * Light/Dark theme toggle (spec §28 — "Light Theme / Dark Theme"). Applies
 * the `dark` class to <html> (Tailwind's class-based dark mode) and
 * persists the choice in localStorage.
 */
export default function ThemeToggle({ dark = true }) {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark((d) => !d)}
      title="Toggle theme"
      className={`p-2 rounded-xl transition ${dark ? "hover:bg-white/10 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
    >
      <span className="text-lg">{isDark ? "☀️" : "🌙"}</span>
    </button>
  );
}
