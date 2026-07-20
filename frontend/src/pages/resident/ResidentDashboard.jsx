import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

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
        <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">Hello, {profile?.name?.split(" ")[0]} 👋</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{now.toLocaleString("default", { month: "long", year: "numeric" })}</p>
      </div>

      {profile?.assignedPG ? (
        <div className="card p-5 mb-5 bg-gradient-to-r from-slate-900 to-slate-800 border-0 text-white">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Your Stay</p>
          <div className="flex justify-between items-start flex-wrap gap-3">
            <div>
              <p className="font-heading text-xl font-bold">{profile.assignedPG.name}</p>
              <p className="text-slate-400 text-sm mt-0.5">📍 {profile.assignedPG.city}</p>
              {profile.assignedRoom && <p className="text-slate-300 text-sm mt-1">🚪 Room {profile.assignedRoom.roomNumber}</p>}
            </div>
            {profile.assignedRoom?.rent && (
              <div className="text-right">
                <p className="text-brand-400 font-heading text-2xl font-bold">₹{profile.assignedRoom.rent.toLocaleString()}</p>
                <p className="text-slate-400 text-xs">per month</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card p-5 mb-5 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/40">
          <p className="text-amber-800 dark:text-amber-300 font-semibold">Not assigned to any PG yet</p>
          <p className="text-amber-600 dark:text-amber-400 text-sm mt-1">Contact your PG owner, or scan a room's QR invite to join instantly.</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-2xl mb-1">💳</p>
          <p className={`font-heading text-xl font-bold ${currentPending ? "text-amber-500" : "text-emerald-600"}`}>
            {currentPending ? `₹${currentPending.amount.toLocaleString()}` : "Clear"}
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">This Month</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl mb-1">✅</p>
          <p className="font-heading text-xl font-bold text-emerald-600">₹{paidThisYear.toLocaleString()}</p>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Paid This Year</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl mb-1">⚑</p>
          <p className={`font-heading text-xl font-bold ${activeComplaints > 0 ? "text-red-500" : "text-slate-600 dark:text-slate-300"}`}>{activeComplaints}</p>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Open Issues</p>
        </div>
      </div>

      {currentPending && (
        <div className="card p-5 mb-5 border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <p className="font-heading font-bold text-amber-800 dark:text-amber-300">Rent Due</p>
              <p className="text-amber-700 dark:text-amber-400 text-sm">{now.toLocaleString("default", { month: "long" })} {now.getFullYear()}</p>
              <p className="font-heading text-2xl font-bold text-amber-900 dark:text-amber-200 mt-1">₹{currentPending.amount.toLocaleString()}</p>
            </div>
            <Link to="/resident/payments" className="btn-primary shrink-0">Pay Now →</Link>
          </div>
        </div>
      )}

      <h2 className="font-heading font-semibold text-slate-700 dark:text-slate-300 mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        {[
          { to: "/resident/payments", icon: "💳", label: "Pay Rent", sub: currentPending ? `₹${currentPending.amount.toLocaleString()} due` : "All clear" },
          { to: "/resident/complaints", icon: "📢", label: "Complaints", sub: `${activeComplaints} active` },
          { to: "/resident/room", icon: "🏠", label: "My Room", sub: "Room & roommates" },
          { to: "/resident/profile", icon: "👤", label: "My Profile", sub: "Update details & ID" },
        ].map((a) => (
          <Link key={a.to} to={a.to} className="card p-4 hover:border-brand-300 transition group">
            <p className="text-2xl mb-2">{a.icon}</p>
            <p className="font-heading font-semibold text-slate-800 dark:text-white group-hover:text-brand-500 transition text-sm">{a.label}</p>
            <p className="text-slate-400 text-xs">{a.sub}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
