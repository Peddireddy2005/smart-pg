import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";

export default function PGListings() {
  const [pgs, setPGs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState(
    searchParams.get("search") ||
    searchParams.get("city") ||
    ""
  );

  useEffect(() => {
    const loadPGs = async () => {
      try {
        setLoading(true);

        const { data } = await api.get(
          `/pg${search ? `?search=${encodeURIComponent(search)}` : ""}`
        );

        setPGs(data);
      } catch (err) {
        console.error(err);
        setPGs([]);
      } finally {
        setLoading(false);
      }
    };

    loadPGs();
  }, [search]);

  const handleSearch = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const { data } = await api.get(
        `/pg${search ? `?search=${encodeURIComponent(search)}` : ""}`
      );

      setPGs(data);
    } catch (err) {
      console.error(err);
      setPGs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">
          Browse PGs
        </h1>

        <form
          onSubmit={handleSearch}
          className="flex gap-3 mb-8"
        >
          <input
            className="input"
            placeholder="Search city, locality..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            type="submit"
            className="btn-primary"
          >
            Search
          </button>
        </form>

        {loading ? (
          <p>Loading...</p>
        ) : pgs.length === 0 ? (
          <p>No PGs found.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pgs.map((pg) => (
              <Link
                key={pg._id}
                to={`/pgs/${pg._id}`}
                className="card"
              >
                <h2 className="font-bold text-lg">
                  {pg.name}
                </h2>

                <p className="text-slate-500">
                  {pg.city}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}