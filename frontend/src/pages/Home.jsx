import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Home() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="min-h-screen bg-[#f8f7f4] font-body">
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #ff7a09 0%, transparent 50%), radial-gradient(circle at 80% 20%, #f59e0b 0%, transparent 40%)" }} />
        <div className="relative max-w-5xl mx-auto px-6 py-24 text-center">
          <span className="inline-block bg-brand-500/20 text-brand-300 text-xs font-semibold px-3 py-1 rounded-full mb-4 border border-brand-500/30">
            🏠 India's Smartest PG Platform
          </span>
          <h1 className="font-heading text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
            Find Your Perfect<br />
            <span className="text-brand-400">PG Stay</span>
          </h1>
          <p className="text-slate-300 text-lg mb-10 max-w-xl mx-auto">
            Browse verified PGs, pay rent online, and manage everything — all in one place.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); navigate(search ? `/pgs?search=${search}` : "/pgs"); }}
            className="flex max-w-md mx-auto gap-2">
            <input className="flex-1 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 shadow-lg"
              placeholder="Search city, locality..." value={search}
              onChange={(e) => setSearch(e.target.value)} />
            <button type="submit" className="btn-primary">Search</button>
          </form>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="font-heading text-3xl font-bold text-slate-900 text-center mb-12">Everything you need</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: "🔍", title: "Smart Search", desc: "Find PGs by location, price range, and amenities instantly.", color: "bg-blue-50 text-blue-600" },
            { icon: "💳", title: "Online Payments", desc: "Pay rent with one click. Track all your payment history.", color: "bg-emerald-50 text-emerald-600" },
            { icon: "📢", title: "Complaint System", desc: "Raise issues and track resolution status in real time.", color: "bg-amber-50 text-amber-600" },
            { icon: "👥", title: "Resident Management", desc: "Owners can manage allocations and view resident profiles.", color: "bg-purple-50 text-purple-600" },
            { icon: "📊", title: "Dashboard Analytics", desc: "Get a complete view of your PG's performance and occupancy.", color: "bg-rose-50 text-rose-600" },
            { icon: "🪪", title: "ID Verification", desc: "Residents upload ID proof. Owners verify before move-in.", color: "bg-teal-50 text-teal-600" },
          ].map((f) => (
            <div key={f.title} className="card p-6">
              <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center text-xl mb-4`}>{f.icon}</div>
              <h3 className="font-heading font-semibold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-500 py-16 px-6 text-center">
        <h2 className="font-heading text-3xl font-bold text-white mb-4">Ready to simplify PG life?</h2>
        <p className="text-orange-100 mb-8">Join thousands of owners and residents on Smart PG.</p>
        <div className="flex justify-center gap-4">
          <Link to="/signup" className="bg-white text-brand-600 font-semibold px-6 py-3 rounded-xl hover:bg-orange-50 transition shadow">
            Create Free Account
          </Link>
          <Link to="/pgs" className="border-2 border-white text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition">
            Browse PGs
          </Link>
        </div>
      </section>

      <footer className="text-center py-6 text-sm text-gray-400">
        © {new Date().getFullYear()} Smart PG · All rights reserved
      </footer>
    </div>
  );
}