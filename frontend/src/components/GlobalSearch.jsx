import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, Building2, DoorOpen, Flag, IndianRupee } from "lucide-react";
import { globalSearch } from "../services/searchService";

export default function GlobalSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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

  // Cmd/Ctrl+K focuses the search box from anywhere in the owner dashboard.
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

  const hasResults = results && (results.pgs.length || results.residents.length || results.rooms.length || results.complaints.length || results.payments.length);

  return (
    <div className="relative w-full max-w-sm" ref={ref}>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          className="input text-sm pl-9 pr-14"
          placeholder="Search residents, PGs, rooms..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q && setOpen(true)}
        />
        <kbd className="hidden md:flex absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded pointer-events-none">
          ⌘K
        </kbd>
      </div>
      {open && (
        <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 z-50 max-h-96 overflow-y-auto">
          {loading && <p className="text-slate-400 text-sm p-4 text-center">Searching...</p>}
          {!loading && !hasResults && <p className="text-slate-400 text-sm p-4 text-center">No matches for "{q}"</p>}
          {!loading && results?.residents?.length > 0 && (
            <div className="p-2">
              <p className="text-[11px] uppercase font-bold text-slate-400 px-2 py-1">Residents</p>
              {results.residents.map((r) => (
                <button key={r._id} onClick={() => goTo(`/owner/resident/${r._id}`)} className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <User size={14} className="text-slate-400" /> {r.name} <span className="text-slate-400 text-xs">{r.email}</span>
                </button>
              ))}
            </div>
          )}
          {!loading && results?.pgs?.length > 0 && (
            <div className="p-2 border-t dark:border-slate-700">
              <p className="text-[11px] uppercase font-bold text-slate-400 px-2 py-1">PGs</p>
              {results.pgs.map((p) => (
                <button key={p._id} onClick={() => goTo(`/owner/pg/${p._id}`)} className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Building2 size={14} className="text-slate-400" /> {p.name} <span className="text-slate-400 text-xs">{p.city}</span>
                </button>
              ))}
            </div>
          )}
          {!loading && results?.rooms?.length > 0 && (
            <div className="p-2 border-t dark:border-slate-700">
              <p className="text-[11px] uppercase font-bold text-slate-400 px-2 py-1">Rooms</p>
              {results.rooms.map((r) => (
                <button key={r._id} onClick={() => goTo(`/owner/pg/${r.pg?._id}`)} className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <DoorOpen size={14} className="text-slate-400" /> Room {r.roomNumber} <span className="text-slate-400 text-xs">{r.pg?.name}</span>
                </button>
              ))}
            </div>
          )}
          {!loading && results?.complaints?.length > 0 && (
            <div className="p-2 border-t dark:border-slate-700">
              <p className="text-[11px] uppercase font-bold text-slate-400 px-2 py-1">Complaints</p>
              {results.complaints.map((c) => (
                <button key={c._id} onClick={() => goTo("/owner/complaints")} className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Flag size={14} className="text-slate-400" /> {c.title} <span className="text-slate-400 text-xs">{c.resident?.name}</span>
                </button>
              ))}
            </div>
          )}
          {!loading && results?.payments?.length > 0 && (
            <div className="p-2 border-t dark:border-slate-700">
              <p className="text-[11px] uppercase font-bold text-slate-400 px-2 py-1">Payments</p>
              {results.payments.map((p) => (
                <button key={p._id} onClick={() => goTo("/owner/payments")} className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <IndianRupee size={14} className="text-slate-400" /> {p.resident?.name} <span className="text-slate-400 text-xs">Room {p.room?.roomNumber}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}