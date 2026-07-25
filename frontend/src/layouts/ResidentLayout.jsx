import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Wallet, CheckCircle2, Flag, Home, IndianRupee, CircleUser } from "lucide-react";
import api from "../services/api";

export default function ResidentDashboard() {
  const [profile, setProfile] = useState(null);
  const [payments, setPayments] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/auth/me"),
      api.get("/payments/my"),
      api.get("/complaints/my"),
    ])
      .then(([p, pay, comp]) => {
        setProfile(p.data);
        setPayments(pay.data);
        setComplaints(comp.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" /></div>;
  }

  const now = new Date();
  const currentPending = payments.find(
    (p) => (p.status === "pending" || p.status === "pending_approval") && p.month === now.getMonth() + 1 && p.year === now.getFullYear()
  );
  const activeComplaints = complaints.filter((c) => c.status !== "resolved" && c.status !== "closed").length;
  const paidThisYear = payments.filter((p) => p.status === "paid" && p.year === now.getFullYear()).reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div className="mb-8">
        <p className="eyebrow mb-1">{now.toLocaleString("default", { month: "long", year: "numeric" })}</p>
        <h1 className="font-heading text-3xl font-semibold text-ink-900 dark:text-white">Hello, {profile?.name?.split(" ")[0]}</h1>
      </div>

      {profile?.assignedPG ? (
        <div className="card p-5 mb-5 bg-ink-900 border-0 text-white">
          <p className="text-ink-100/60 text-xs font-semibold uppercase tracking-wider mb-3">Your stay</p>
          <div className="flex justify-between items-start flex-wrap gap-3">
            <div>
              <p className="font-heading text-xl font-semibold">{profile.assignedPG.name}</p>
              <p className="text-ink-100/60 text-sm mt-0.5">{profile.assignedPG.city}</p>
              {profile.assignedRoom && <p className="text-ink-100/80 text-sm mt-1">Room {profile.assignedRoom.roomNumber}</p>}
            </div>
            {profile.assignedRoom?.rent && (
              <div className="text-right">
                <p className="amount text-brand-400 text-2xl font-semibold">₹{profile.assignedRoom.rent.toLocaleString()}</p>
                <p className="text-ink-100/60 text-xs">per month</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card p-5 mb-5 bg-brand-50 dark:bg-brand-900/10 border-brand-200 dark:border-brand-900/40">
          <p className="text-brand-700 dark:text-brand-300 font-semibold">Not assigned to any PG yet</p>
          <p className="text-brand-600 dark:text-brand-400 text-sm mt-1">Contact your PG owner, or scan a room's QR invite to join instantly.</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <Wallet size={18} className={`mb-2 ${currentPending ? "text-brand-500" : "text-sage-500"}`} strokeWidth={1.75} />
          <p className={`amount text-xl font-semibold ${currentPending ? "text-brand-600" : "text-sage-600"}`}>
            {currentPending ? `₹${currentPending.amount.toLocaleString()}` : "Clear"}
          </p>
          <p className="text-ink-400 text-xs mt-1">This month</p>
        </div>
        <div className="card p-4">
          <CheckCircle2 size={18} className="mb-2 text-sage-500" strokeWidth={1.75} />
          <p className="amount text-xl font-semibold text-sage-600">₹{paidThisYear.toLocaleString()}</p>
          <p className="text-ink-400 text-xs mt-1">Paid this year</p>
        </div>
        <div className="card p-4">
          <Flag size={18} className={`mb-2 ${activeComplaints > 0 ? "text-rust-500" : "text-ink-400"}`} strokeWidth={1.75} />
          <p className={`amount text-xl font-semibold ${activeComplaints > 0 ? "text-rust-500" : "text-ink-900 dark:text-white"}`}>{activeComplaints}</p>
          <p className="text-ink-400 text-xs mt-1">Open issues</p>
        </div>
      </div>

      {currentPending && (
        <div className="card p-5 mb-5 border-brand-200 dark:border-brand-900/40 bg-brand-50 dark:bg-brand-900/10">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <p className="font-heading font-semibold text-brand-800 dark:text-brand-300">Rent due</p>
              <p className="text-brand-700 dark:text-brand-400 text-sm">{now.toLocaleString("default", { month: "long" })} {now.getFullYear()}</p>
              <p className="amount text-2xl font-semibold text-brand-900 dark:text-brand-200 mt-1">₹{currentPending.amount.toLocaleString()}</p>
            </div>
            <Link to="/resident/payments" className="btn-primary shrink-0">Pay now →</Link>
          </div>
        </div>
      )}

      <h2 className="font-heading font-semibold text-ink-700 dark:text-slate-300 mb-3">Quick actions</h2>
      <div className="grid grid-cols-2 gap-3">
        {[
          { to: "/resident/payments", icon: IndianRupee, label: "Pay rent", sub: currentPending ? `₹${currentPending.amount.toLocaleString()} due` : "All clear" },
          { to: "/resident/complaints", icon: Flag, label: "Complaints", sub: `${activeComplaints} active` },
          { to: "/resident/room", icon: Home, label: "My room", sub: "Room & roommates" },
          { to: "/resident/profile", icon: CircleUser, label: "My profile", sub: "Update details & ID" },
        ].map((a) => (
          <Link key={a.to} to={a.to} className="card p-4 hover:border-brand-400 transition group">
            <a.icon size={20} className="mb-3 text-brand-500" strokeWidth={1.75} />
            <p className="font-heading font-semibold text-ink-900 dark:text-white group-hover:text-brand-600 transition text-sm">{a.label}</p>
            <p className="text-ink-400 text-xs">{a.sub}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}