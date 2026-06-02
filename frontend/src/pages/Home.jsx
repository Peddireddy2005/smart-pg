import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Home() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();

    if (search.trim()) {
      navigate(`/pgs?search=${search}`);
    } else {
      navigate("/pgs");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, #ff7a09 0%, transparent 50%), radial-gradient(circle at 80% 20%, #f59e0b 0%, transparent 40%)",
          }}
        />

        <div className="relative max-w-5xl mx-auto px-6 py-24 text-center">
          <span className="inline-block bg-brand-500/20 text-brand-300 text-xs font-semibold px-3 py-1 rounded-full mb-4 border border-brand-500/30">
            🏠 India's Smartest PG Platform
          </span>

          <h1 className="font-heading text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
            Find Your Perfect
            <br />
            <span className="text-brand-400">PG Stay</span>
          </h1>

          <p className="text-slate-300 text-lg mb-10 max-w-xl mx-auto">
            Browse verified PGs, pay rent online, and manage everything —
            all in one place.
          </p>

          <form
            onSubmit={handleSearch}
            className="flex max-w-md mx-auto gap-2"
          >
            <input
              className="flex-1 rounded-xl px-4 py-3 text-slate-900"
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
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="font-heading text-3xl font-bold text-center mb-12">
          Everything you need
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: "🔍",
              title: "Smart Search",
              desc: "Find PGs instantly.",
            },
            {
              icon: "💳",
              title: "Online Payments",
              desc: "Pay rent online.",
            },
            {
              icon: "📢",
              title: "Complaints",
              desc: "Track complaints easily.",
            },
            {
              icon: "👥",
              title: "Residents",
              desc: "Manage residents.",
            },
            {
              icon: "📊",
              title: "Analytics",
              desc: "View PG performance.",
            },
            {
              icon: "🪪",
              title: "Verification",
              desc: "ID proof verification.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="card p-6"
            >
              <div className="text-3xl mb-3">{item.icon}</div>

              <h3 className="font-heading font-semibold mb-2">
                {item.title}
              </h3>

              <p className="text-slate-500 text-sm">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-500 py-16 text-center text-white">
        <h2 className="font-heading text-3xl font-bold mb-4">
          Ready to simplify PG life?
        </h2>

        <p className="mb-8">
          Join Smart PG today.
        </p>

        <div className="flex justify-center gap-4">
          <Link
            to="/signup"
            className="bg-white text-brand-600 px-6 py-3 rounded-xl font-semibold"
          >
            Create Account
          </Link>

          <Link
            to="/pgs"
            className="border border-white px-6 py-3 rounded-xl"
          >
            Browse PGs
          </Link>
        </div>
      </section>
    </div>
  );
}