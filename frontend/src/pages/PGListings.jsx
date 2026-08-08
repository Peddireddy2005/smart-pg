import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { MapPin, SearchX, Home } from "lucide-react";
import api from "../services/api";
import StarRating from "../components/StarRating";

const AMENITY_FILTERS = [
  { key: "food", label: "Food" },
  { key: "ac", label: "AC" },
  { key: "parking", label: "Parking" },
  { key: "wifi", label: "WiFi" },
  { key: "laundry", label: "Laundry" },
];

export default function PGListings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const embedded = location.pathname.startsWith("/owner") || location.pathname.startsWith("/resident");
  const basePath = location.pathname.startsWith("/owner")
    ? "/owner/pg-listings"
    : location.pathname.startsWith("/resident")
    ? "/resident/pg-listings"
    : "/pgs";

  const [pgs, setPGs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const search = searchParams.get("search") || "";
  const city = searchParams.get("city") || "";
  const minRent = searchParams.get("minRent") || "";
  const maxRent = searchParams.get("maxRent") || "";
  const gender = searchParams.get("gender") || "";
  const sort = searchParams.get("sort") || "newest";
  const page = Number(searchParams.get("page") || 1);
  const amenities = AMENITY_FILTERS.filter((a) => searchParams.get(a.key));

  const [localSearch, setLocalSearch] = useState(search);
  const [localCity, setLocalCity] = useState(city);
  const [localMin, setLocalMin] = useState(minRent);
  const [localMax, setLocalMax] = useState(maxRent);
  const [localGender, setLocalGender] = useState(gender);
  const [localAmenities, setLocalAmenities] = useState(new Set(amenities.map((a) => a.key)));

  const queryKey = searchParams.toString();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12, sort });
      if (search) params.set("search", search);
      if (city) params.set("city", city);
      if (minRent) params.set("minRent", minRent);
      if (maxRent) params.set("maxRent", maxRent);
      if (gender) params.set("gender", gender);
      AMENITY_FILTERS.forEach((a) => { if (searchParams.get(a.key)) params.set(a.key, "1"); });
      const { data } = await api.get(`/pg?${params}`);
      setPGs(data.pgs);
      setTotalPages(data.totalPages);
    } catch {
      setPGs([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

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
    if (localGender) p.gender = localGender;
    localAmenities.forEach((k) => { p[k] = "1"; });
    if (sort !== "newest") p.sort = sort;
    p.page = "1";
    setSearchParams(p);
  };

  const clearFilters = () => {
    setLocalSearch(""); setLocalCity(""); setLocalMin(""); setLocalMax(""); setLocalGender("");
    setLocalAmenities(new Set());
    setSearchParams({});
  };

  const toggleAmenity = (key) => {
    setLocalAmenities((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const changeSort = (value) => {
    const p = Object.fromEntries(searchParams);
    p.sort = value;
    p.page = "1";
    setSearchParams(p);
  };

  return (
    <div className={embedded ? "" : "min-h-screen bg-[#f8f7f4]"}>
      <div className={embedded ? "" : "max-w-6xl mx-auto px-6 py-8"}>
        <h1 className="font-heading text-3xl font-bold text-slate-900 mb-6">Browse PGs</h1>

        <form onSubmit={applyFilters} className="card p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <input className="input" placeholder="Search name, city, locality..."
              value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} />

            <select className="input" value={localCity} onChange={(e) => setLocalCity(e.target.value)}>
              <option value="">All Cities</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select className="input" value={localGender} onChange={(e) => setLocalGender(e.target.value)}>
              <option value="">Any Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Co-ed">Co-ed</option>
            </select>

            <div className="flex gap-2">
              <input className="input" type="number" placeholder="Min ₹" value={localMin}
                onChange={(e) => setLocalMin(e.target.value)} />
              <input className="input" type="number" placeholder="Max ₹" value={localMax}
                onChange={(e) => setLocalMax(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            {AMENITY_FILTERS.map((a) => (
              <button key={a.key} type="button" onClick={() => toggleAmenity(a.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${localAmenities.has(a.key) ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600"}`}>
                {a.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1 justify-center">Search</button>
            <button type="button" onClick={clearFilters} className="btn-secondary text-sm px-3">Clear</button>
          </div>
        </form>

        <div className="flex justify-end mb-4">
          <select className="input w-auto text-sm" value={sort} onChange={(e) => changeSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="low_price">Price: Low to High</option>
            <option value="high_price">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-48" />)}
          </div>
        ) : pgs.length === 0 ? (
          <div className="card p-12 text-center text-slate-400">
            <SearchX size={32} className="mx-auto mb-3" strokeWidth={1.5} />
            <p className="font-heading font-semibold text-slate-600">No PGs found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {pgs.map((pg) => (
                <Link key={pg._id} to={`${basePath}/${pg._id}`} className="card overflow-hidden hover:border-brand-200 transition group">
                  {pg.images?.[0] ? (
                    <img src={pg.images[0].url} alt={pg.name} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      <Home size={32} className="text-slate-300" strokeWidth={1.5} />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-1">
                      <h2 className="font-heading font-bold text-slate-900 group-hover:text-brand-500 transition line-clamp-1">{pg.name}</h2>
                      <span className={`text-xs shrink-0 ml-2 ${pg.vacantBeds > 0 ? "badge-green" : "badge-red"}`}>
                        {pg.vacantBeds > 0 ? `${pg.vacantBeds} vacant` : "Full"}
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm mb-2 flex items-center gap-1"><MapPin size={13} /> {pg.locality ? `${pg.locality}, ` : ""}{pg.city}</p>
                    {pg.ratingsCount > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        <StarRating value={Math.round(pg.ratingsAverage)} readOnly size="text-sm" />
                        <span className="text-xs text-slate-500">({pg.ratingsCount})</span>
                      </div>
                    )}
                    {pg.rentRange?.min > 0 && (
                      <p className="amount font-heading font-bold text-brand-500 text-sm">
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

            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                {[...Array(totalPages)].map((_, i) => {
                  const p = i + 1;
                  const current = { search, city, minRent, maxRent, gender, sort, page: String(p) };
                  return (
                    <Link key={p} to={`${basePath}?${new URLSearchParams(current)}`}
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