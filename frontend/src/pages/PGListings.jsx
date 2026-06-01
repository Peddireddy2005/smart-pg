import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";

export default function PGListings() {
  const [pgs, setPGs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const q = searchParams.get("search") || searchParams.get("city") || "";
    setSearch(q);
    fetchPGs(q);
  }, [searchParams]);

  const fetchPGs = (q = "") => {
    console.log("[PG LISTINGS] Fetching with query:", q);
    api.get(`/pg${q ? `?search=${q}` : ""}`)
      .then(({ data }) => { setPGs(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40 px-6 py-4 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
          <span className="font-heading font-bold text-lg text-slate-900">Smart PG</span>
        </Link>
        <form onSubmit={(e) => { e.preventDefault(); fetchPGs(search); }} className="flex-1 flex gap-2 max-w-md">
          <input className="input" placeholder="Search city, locality, PG name..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
          <button type="submit" className="btn-primary whitespace-nowrap">Search</button>
        </form>
        <Link to="/login" className="btn-secondary text-sm whitespace-nowrap">Sign In</Link>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <p className="text-slate-500 text-sm mb-6">{loading ? "Loading..." : `${pgs.length} PGs found`}</p>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-5 bg-gray-200 rounded mb-3 w-3/4" />
                <div className="h-4 bg-gray-100 rounded mb-2 w-1/2" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : pgs.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-5xl mb-4">🏠</p>
            <p className="font-heading font-semibold text-xl text-slate-600">No PGs found</p>
            <p className="text-sm mt-1">Try a different city or search term</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pgs.map((pg) => (
              <Link to={`/pgs/${pg._id}`} key={pg._id} className="card p-5 group block">
                <div className="flex justify-between items-start mb-3">
                  <h2 className="font-heading font-semibold text-slate-900 group-hover:text-brand-500 transition leading-tight">{pg.name}</h2>
                  <span className={pg.availableRooms > 0 ? "badge-green" : "badge-red"}>
                    {pg.availableRooms > 0 ? `${pg.availableRooms} Avail` : "Full"}
                  </span>
                </div>
                <p className="text-slate-500 text-sm mb-3">📍 {pg.locality ? `${pg.locality}, ` : ""}{pg.city}</p>
                {pg.rentRange?.min > 0 && (
                  <p className="font-heading font-bold text-brand-500 mb-3">
                    ₹{pg.rentRange.min.toLocaleString()} – ₹{pg.rentRange.max.toLocaleString()}<span className="text-xs text-slate-400 font-normal">/mo</span>
                  </p>
                )}
                {pg.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {pg.amenities.slice(0, 4).map((a, i) => (
                      <span key={i} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-lg">{a}</span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-3">{pg.totalRooms} rooms · {pg.owner?.name}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}