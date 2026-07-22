import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

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
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}