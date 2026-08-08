import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, Building2, DoorOpen, Flag, IndianRupee, Loader2, SearchX } from "lucide-react";
import { globalSearch } from "../services/searchService";

const SECTIONS = [
  { key: "residents", label: "Residents", icon: User },
  { key: "pgs", label: "PGs", icon: Building2 },
  { key: "rooms", label: "Rooms", icon: DoorOpen },
  { key: "complaints", label: "Complaints", icon: Flag },
  { key: "payments", label: "Payments", icon: IndianRupee },
];

export default function GlobalSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (!q.trim()) { setResults(null); return; }
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await globalSearch(q.trim());
        setResults(data);
        setOpen(true);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [q]);

  const goTo = (path) => {
    setOpen(false);
    setQ("");
    navigate(path);
  };

  const clear = () => {
    setQ("");
    setResults(null);
    inputRef.current?.focus();
  };

  const hasResults = results && SECTIONS.some((s) => results[s.key]?.length);

  const rowFor = (key, item) => {
    switch (key) {
      case "residents":
        return { label: item.name, sub: item.email, onClick: () => goTo(`/owner/resident/${item._id}`) };
      case "pgs":
        return { label: item.name, sub: item.city, onClick: () => goTo(`/owner/pg/${item._id}`) };
      case "rooms":
        return { label: `Room ${item.roomNumber}`, sub: item.pg?.name, onClick: () => goTo(`/owner/pg/${item.pg?._id}`) };
      case "complaints":
        return { label: item.title, sub: item.resident?.name, onClick: () => goTo("/owner/complaints") };
      case "payments":
        return { label: item.resident?.name, sub: `Room ${item.room?.roomNumber}`, onClick: () => goTo("/owner/payments") };
      default:
        return { label: "", sub: "", onClick: () => {} };
    }
  };

  return (
    <div className="relative w-full max-w-sm" ref={ref}>
      <div
        className={`flex items-center gap-2 rounded-xl border bg-white pl-3 pr-2 h-10 transition-all
          ${focused ? "border-brand-400 shadow-[0_0_0_3px_rgba(20,184,166,0.14)]" : "border-gray-200 hover:border-gray-300"}`}
      >
        {loading ? (
          <Loader2 size={16} className="shrink-0 text-slate-400 animate-spin" />
        ) : (
          <Search size={16} className="shrink-0 text-slate-400" />
        )}

        <input
          ref={inputRef}
          className="flex-1 min-w-0 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
          placeholder="Search residents, PGs, rooms..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => { setFocused(true); if (q) setOpen(true); }}
          onBlur={() => setFocused(false)}
        />

        {q ? (
          <button
            type="button"
            onClick={clear}
            className="shrink-0 text-slate-300 hover:text-slate-500 text-xs font-semibold px-1.5"
            aria-label="Clear search"
          >
            ✕
          </button>
        ) : (
          <kbd className="hidden md:flex shrink-0 items-center gap-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-1 rounded-md">
            ⌘K
          </kbd>
        )}
      </div>

      {open && q && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl ring-1 ring-black/5 border border-gray-100 z-50 max-h-96 overflow-y-auto overflow-x-hidden">
          {loading && !results && (
            <p className="text-slate-400 text-sm p-5 text-center">Searching...</p>
          )}

          {!loading && !hasResults && (
            <div className="p-6 text-center">
              <SearchX size={22} className="mx-auto text-slate-300 mb-1.5" />
              <p className="text-slate-400 text-sm">No matches for "<span className="text-slate-600 font-medium">{q}</span>"</p>
            </div>
          )}

          {SECTIONS.map(({ key, label, icon: Icon }, i) => {
            const items = results?.[key];
            if (!items?.length) return null;
            return (
              <div key={key} className={`p-2 ${i > 0 ? "border-t border-gray-100" : ""}`}>
                <p className="text-[11px] uppercase font-bold tracking-wide text-slate-400 px-2 py-1.5">{label}</p>
                {items.map((item) => {
                  const row = rowFor(key, item);
                  return (
                    <button
                      key={item._id}
                      onClick={row.onClick}
                      className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-50 transition flex items-center gap-2.5"
                    >
                      <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Icon size={14} className="text-slate-500" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-slate-700 truncate">{row.label}</span>
                        {row.sub && <span className="block text-xs text-slate-400 truncate">{row.sub}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}