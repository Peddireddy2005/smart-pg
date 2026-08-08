import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, CheckCircle2, Wallet, MessageSquareWarning, Users,
  LineChart, IdCard, Star, BellRing,
} from "lucide-react";

const FEATURES = [
  { icon: Search, title: "Smart search", desc: "Filter by city, locality, room type and budget." },
  { icon: Wallet, title: "3 ways to pay rent", desc: "Smart PG (Razorpay), Direct UPI, or Cash — all tracked and receipted." },
  { icon: MessageSquareWarning, title: "Complaint tracking", desc: "Raise issues with photos, get assigned staff, track to resolution." },
  { icon: Users, title: "Resident management", desc: "Allocate residents by QR invite, generate rent in one click." },
  { icon: LineChart, title: "Revenue tracking", desc: "See collected vs. pending, plus downloadable PDF/Excel reports." },
  { icon: IdCard, title: "ID verification", desc: "Aadhaar, PAN or Passport, reviewed at a glance." },
  { icon: Star, title: "Ratings & reviews", desc: "Verified residents leave honest reviews; owners can reply." },
  { icon: BellRing, title: "Real-time alerts", desc: "Every payment, complaint and announcement pings in-app." },
];

const OWNER_TRACK = [
  "List your PG with photos, amenities and house rules.",
  "Add rooms, then share a QR invite for instant resident joining.",
  "Generate the month's rent records in one click.",
];

const RESIDENT_TRACK = [
  "Find a room by city, budget or amenities.",
  "Join in seconds by scanning your room's QR code.",
  "Pay however suits you, and download the receipt.",
];

export default function Home() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(search.trim() ? `/pgs?search=${encodeURIComponent(search)}` : "/pgs");
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* ---------------- Hero ---------------- */}
      <section className="border-b border-[#DAD4C4]">
        <div className="max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="eyebrow mb-4">Paying-guest management, run like a ledger</p>
            <h1 className="font-heading text-5xl md:text-6xl font-semibold text-ink-900 leading-[1.05] mb-6">
              Every rent, receipt<br />and resident —<br />in one book.
            </h1>
            <p className="text-ink-400 text-lg mb-8 max-w-md leading-relaxed">
              Smart PG replaces the notebook and the group-chat reminders with
              verified listings, three ways to collect rent, and a paper trail
              for every payment.
            </p>

            <form onSubmit={handleSearch} className="flex max-w-md gap-2 mb-8">
              <input
                className="input"
                placeholder="Search city or locality..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn-primary shrink-0">Search</button>
            </form>

            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-ink-400">
              {["500+ PGs listed", "10,000+ residents", "₹2Cr+ rent collected"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-sage-500" /> {t}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="card p-0 overflow-hidden rotate-1">
              <div className="bg-ink-900 px-6 py-4 flex items-center justify-between">
                <span className="text-paper font-heading font-semibold">Smart PG</span>
                <span className="badge-green !bg-transparent !border-sage-200 text-sage-200">Paid</span>
              </div>
              <div className="p-6 stub-edge">
                <p className="eyebrow mb-1">Rent receipt · Oct 2026</p>
                <p className="text-ink-900 font-heading text-lg font-semibold mb-4">
                  Room 204, Sunrise PG
                </p>
                <div className="flex justify-between text-sm text-ink-400 mb-1">
                  <span>Rent</span><span className="amount">₹9,500</span>
                </div>
                <div className="flex justify-between text-sm text-ink-400 mb-4">
                  <span>Convenience fee</span><span className="amount">₹20</span>
                </div>
                <div className="border-t border-[#DAD4C4] pt-4 flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-ink-900">Total paid</span>
                  <span className="amount text-2xl font-semibold text-ink-900">₹9,520</span>
                </div>
                <p className="text-xs text-ink-400 mt-4">Verified automatically via Razorpay</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Two tracks: owner / resident ---------------- */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-8">
        <div className="card p-8">
          <p className="eyebrow mb-2">For owners</p>
          <h2 className="font-heading text-2xl font-semibold text-ink-900 mb-5">
            Run the property, not the paperwork
          </h2>
          <ol className="space-y-4 mb-7">
            {OWNER_TRACK.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm text-ink-400">
                <span className="amount text-brand-500 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                {step}
              </li>
            ))}
          </ol>
          <Link to="/signup" className="btn-primary">List your PG</Link>
        </div>

        <div className="card p-8">
          <p className="eyebrow mb-2">For residents</p>
          <h2 className="font-heading text-2xl font-semibold text-ink-900 mb-5">
            Move in without the group chat
          </h2>
          <ol className="space-y-4 mb-7">
            {RESIDENT_TRACK.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm text-ink-400">
                <span className="amount text-brand-500 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                {step}
              </li>
            ))}
          </ol>
          <Link to="/pgs" className="btn-secondary">Browse PGs</Link>
        </div>
      </section>

      {/* ---------------- Feature grid ---------------- */}
      <section className="bg-ink-900 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="eyebrow mb-2">What's inside</p>
          <h2 className="font-heading text-3xl font-semibold text-paper mb-12">Everything the ledger used to hide</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-ink-700">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-ink-900 p-6">
                <f.icon size={20} className="text-brand-400 mb-4" strokeWidth={1.75} />
                <h3 className="font-heading font-semibold text-paper mb-1">{f.title}</h3>
                <p className="text-ink-100/70 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Closing CTA ---------------- */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="font-heading text-3xl font-semibold text-ink-900 mb-3">
          Ready to close the notebook?
        </h2>
        <p className="text-ink-400 mb-8">Free for owners and residents alike.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/signup" className="btn-primary">Create free account</Link>
          <Link to="/pgs" className="btn-secondary">Browse PGs</Link>
        </div>
      </section>

      <footer className="border-t border-[#DAD4C4] py-8 text-center text-ink-400 text-sm">
        <p>© {new Date().getFullYear()} Smart PG. All rights reserved.</p>
        <div className="flex justify-center gap-6 mt-3">
          <Link to="/pgs" className="hover:text-ink-900 transition">Browse PGs</Link>
          <Link to="/signup" className="hover:text-ink-900 transition">Sign Up</Link>
          <Link to="/login" className="hover:text-ink-900 transition">Login</Link>
        </div>
      </footer>
    </div>
  );
}