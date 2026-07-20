import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const FEATURES = [
  { icon: "🔍", title: "Smart Search", desc: "Filter by city, locality, room type and budget. Find the right PG in seconds." },
  { icon: "💳", title: "3 Ways to Pay Rent", desc: "Smart PG (Razorpay), Direct UPI, or Cash — all tracked and receipted." },
  { icon: "📢", title: "Complaint Tracking", desc: "Raise issues with photos, get assigned staff, and track to resolution." },
  { icon: "👥", title: "Resident Management", desc: "Owners manage rooms, allocate residents by QR invite, and generate rent in one click." },
  { icon: "📊", title: "Revenue Analytics & Reports", desc: "Revenue trends plus downloadable PDF/Excel reports." },
  { icon: "🪪", title: "ID Verification", desc: "Residents upload Aadhaar, PAN or Passport. Owners see full KYC at a glance." },
  { icon: "⭐", title: "Ratings & Reviews", desc: "Verified residents leave honest reviews, owners can reply publicly." },
  { icon: "🔔", title: "Real-time Notifications", desc: "Every payment, complaint, announcement and visitor triggers an in-app alert." },
];

const STEPS = [
  { step: "1", who: "Owner", action: "Create your PG listing with photos, amenities and rules." },
  { step: "2", who: "Owner", action: "Add rooms and generate a QR invite for instant resident joining." },
  { step: "3", who: "Owner", action: "Generate monthly rent records with one click." },
  { step: "4", who: "Resident", action: "Pick a payment method — Smart PG, UPI, or Cash — and download the receipt." },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(search.trim() ? `/pgs?search=${encodeURIComponent(search)}` : "/pgs");
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] dark:bg-slate-900">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 55%, #ff7a09 0%, transparent 45%), radial-gradient(circle at 85% 20%, #f59e0b 0%, transparent 40%)",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-6 py-28 text-center">
          <span className="inline-block bg-brand-500/20 text-brand-300 text-xs font-semibold px-3 py-1 rounded-full mb-5 border border-brand-500/30 tracking-wider uppercase">
            🏠 India's Smartest PG Platform
          </span>

          <h1 className="font-heading text-5xl md:text-6xl font-extrabold mb-5 leading-tight">
            Find Your Perfect
            <br />
            <span className="text-brand-400">PG Stay</span>
          </h1>

          <p className="text-slate-300 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Browse verified PGs, pay rent your way, track complaints and manage
            your stay — all in one place.
          </p>

          <form onSubmit={handleSearch} className="flex max-w-md mx-auto gap-2">
            <input
              className="flex-1 rounded-xl px-4 py-3 text-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="Search city or locality..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn-primary shrink-0">Search</button>
          </form>

          <div className="flex flex-wrap justify-center gap-6 mt-10 text-slate-400 text-sm">
            {["500+ PGs listed", "10,000+ residents", "₹2Cr+ rent collected"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="text-brand-400">✓</span> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="font-heading text-3xl font-bold text-center text-slate-900 dark:text-white mb-2">How it works</h2>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-12">From listing to payment in four simple steps</p>
        <div className="grid md:grid-cols-4 gap-6">
          {STEPS.map((s) => (
            <div key={s.step} className="text-center">
              <div className="w-12 h-12 rounded-full bg-brand-500 text-white font-heading font-bold text-lg flex items-center justify-center mx-auto mb-3">
                {s.step}
              </div>
              <p className="text-xs uppercase tracking-wider text-brand-500 font-semibold mb-1">{s.who}</p>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{s.action}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-heading text-3xl font-bold text-center text-slate-900 dark:text-white mb-2">Everything you need</h2>
          <p className="text-center text-slate-500 dark:text-slate-400 mb-12">Built for both PG owners and residents</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-5 hover:border-brand-200 transition">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-heading font-semibold text-slate-900 dark:text-white mb-1">{f.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-8 border-brand-200 bg-gradient-to-br from-brand-50 to-white dark:from-slate-800 dark:to-slate-800">
            <p className="text-3xl mb-3">🔑</p>
            <h3 className="font-heading text-2xl font-bold text-slate-900 dark:text-white mb-2">Are you a PG Owner?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-5 leading-relaxed">
              List your PG, manage rooms, staff and visitors, collect rent your way and
              track everything from one dashboard — completely free.
            </p>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 mb-6">
              {["Unlimited PG listings", "Razorpay + UPI + Cash rent collection", "QR-based resident onboarding", "Reports, analytics & activity logs"].map((p) => (
                <li key={p} className="flex items-center gap-2"><span className="text-brand-500">✓</span>{p}</li>
              ))}
            </ul>
            <Link to="/signup" className="btn-primary">List Your PG →</Link>
          </div>

          <div className="card p-8 border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:from-slate-800 dark:to-slate-800">
            <p className="text-3xl mb-3">🏠</p>
            <h3 className="font-heading text-2xl font-bold text-slate-900 dark:text-white mb-2">Looking for a PG?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-5 leading-relaxed">
              Search verified PGs across cities, pay rent your way and keep
              everything — receipts, complaints, roommates — in one place.
            </p>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 mb-6">
              {["Browse 500+ verified PGs", "Pay via Smart PG, UPI or Cash", "Instant PDF receipts", "Raise & track complaints"].map((p) => (
                <li key={p} className="flex items-center gap-2"><span className="text-blue-500">✓</span>{p}</li>
              ))}
            </ul>
            <Link to="/pgs" className="btn-secondary">Browse PGs →</Link>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-20 text-center text-white px-6">
        <h2 className="font-heading text-4xl font-bold mb-3">Ready to simplify PG life?</h2>
        <p className="text-slate-400 mb-8 text-lg">Join thousands of owners and residents already using Smart PG.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/signup" className="btn-primary text-base px-8 py-3">Create Free Account</Link>
          <Link to="/pgs" className="border border-white/30 text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/10 transition text-base">Browse PGs</Link>
        </div>
      </section>

      <footer className="bg-slate-950 border-t border-white/5 py-8 text-center text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} Smart PG. All rights reserved.</p>
        <div className="flex justify-center gap-6 mt-3">
          <Link to="/pgs" className="hover:text-slate-300 transition">Browse PGs</Link>
          <Link to="/signup" className="hover:text-slate-300 transition">Sign Up</Link>
          <Link to="/login" className="hover:text-slate-300 transition">Login</Link>
        </div>
      </footer>
    </div>
  );
}
