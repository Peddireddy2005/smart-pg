import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import StarRating from "../components/StarRating";

export default function PGListings() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [pgs, setPGs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const search = searchParams.get("search") || "";
  const city = searchParams.get("city") || "";
  const minRent = searchParams.get("minRent") || "";
  const maxRent = searchParams.get("maxRent") || "";
  const page = Number(searchParams.get("page") || 1);

  const [localSearch, setLocalSearch] = useState(search);
  const [localCity, setLocalCity] = useState(city);
  const [localMin, setLocalMin] = useState(minRent);
  const [localMax, setLocalMax] = useState(maxRent);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search) params.set("search", search);
      if (city) params.set("city", city);
      if (minRent) params.set("minRent", minRent);
      if (maxRent) params.set("maxRent", maxRent);
      const { data } = await api.get(`/pg?${params}`);
      setPGs(data.pgs);
      setTotalPages(data.totalPages);
    } catch {
      setPGs([]);
    } finally {
      setLoading(false);
    }
  }, [search, city, minRent, maxRent, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get("/pg/cities").then(({ data }) => setCities(data)).catch(() => {});
  }, []);

  const applyFilters = (e) => {
    e.preventDefault();
    const p = {};
    if (localSearch) p.search = localSearch;
    if (localCity) p.city = localCity;
    if (localMin) p.minRent = localMin;
    if (localMax) p.maxRent = localMax;
    p.page = "1";
    setSearchParams(p);
  };

  const clearFilters = () => {
    setLocalSearch(""); setLocalCity(""); setLocalMin(""); setLocalMax("");
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="font-heading text-3xl font-bold text-slate-900 mb-6">Browse PGs</h1>

        {/* Filters */}
        <form onSubmit={applyFilters} className="card p-5 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input className="input" placeholder="Search name, city, locality..."
              value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} />

            <select className="input" value={localCity} onChange={(e) => setLocalCity(e.target.value)}>
              <option value="">All Cities</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <div className="flex gap-2">
              <input className="input" type="number" placeholder="Min ₹" value={localMin}
                onChange={(e) => setLocalMin(e.target.value)} />
              <input className="input" type="number" placeholder="Max ₹" value={localMax}
                onChange={(e) => setLocalMax(e.target.value)} />
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1">Search</button>
              <button type="button" onClick={clearFilters} className="btn-secondary text-sm px-3">Clear</button>
            </div>
          </div>
        </form>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-5 h-48 animate-pulse bg-gray-100" />
            ))}
          </div>
        ) : pgs.length === 0 ? (
          <div className="card p-12 text-center text-slate-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-heading font-semibold text-slate-600">No PGs found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {pgs.map((pg) => (
                <Link key={pg._id} to={`/pgs/${pg._id}`} className="card overflow-hidden hover:border-brand-200 transition group">
                  {pg.images?.[0] ? (
                    <img src={pg.images[0].url} alt={pg.name} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-4xl">🏠</div>
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-1">
                      <h2 className="font-heading font-bold text-slate-900 group-hover:text-brand-500 transition line-clamp-1">{pg.name}</h2>
                      <span className={`text-xs shrink-0 ml-2 ${pg.vacantBeds > 0 ? "badge-green" : "badge-red"}`}>
                        {pg.vacantBeds > 0 ? `${pg.vacantBeds} vacant` : "Full"}
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm mb-2">📍 {pg.locality ? `${pg.locality}, ` : ""}{pg.city}</p>
                    {pg.ratingsCount > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        <StarRating value={Math.round(pg.ratingsAverage)} readOnly size="text-sm" />
                        <span className="text-xs text-slate-500">({pg.ratingsCount})</span>
                      </div>
                    )}
                    {pg.rentRange?.min > 0 && (
                      <p className="font-heading font-bold text-brand-500 text-sm">
                        Starting ₹{pg.rentRange.min.toLocaleString()}/mo
                      </p>
                    )}
                    {pg.amenities?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {pg.amenities.slice(0, 3).map((a, i) => (
                          <span key={i} className="bg-slate-100 text-slate-600 text-[11px] px-2 py-0.5 rounded-lg">{a}</span>
                        ))}
                        {pg.amenities.length > 3 && (
                          <span className="text-[11px] text-slate-400">+{pg.amenities.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                {[...Array(totalPages)].map((_, i) => {
                  const p = i + 1;
                  const current = { search, city, minRent, maxRent, page: String(p) };
                  return (
                    <Link key={p} to={`/pgs?${new URLSearchParams(current)}`}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition ${page === p ? "bg-brand-500 text-white" : "bg-white border border-gray-200 text-slate-600 hover:border-brand-300"}`}>
                      {p}
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
