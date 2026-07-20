import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import { getSession } from "../../services/authService";
import ConfirmModal from "../../components/ConfirmModal";

export default function OwnerDashboard() {
  const [pgs, setPGs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const user = getSession();

  useEffect(() => {
    Promise.all([api.get("/pg/owner"), api.get("/pg/owner/stats")])
      .then(([p, s]) => {
        setPGs(p.data);
        setStats(s.data);
      })
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    try {
      await api.delete(`/pg/${deletingId}`);
      setPGs((prev) => prev.filter((p) => p._id !== deletingId));
      toast.success("PG deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete PG");
    } finally {
      setDeletingId(null);
    }
  };

  const handleArchive = async (id) => {
    try {
      const { data } = await api.put(`/pg/${id}/archive`);
      setPGs((prev) => prev.map((p) => (p._id === id ? { ...p, isArchived: data.isArchived } : p)));
      toast.success(data.isArchived ? "PG archived" : "PG unarchived");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8 flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">
            Good morning, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Here's what's happening with your PGs today</p>
        </div>
        <Link to="/owner/add-pg" className="btn-primary">+ Add PG</Link>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          {[
            { label: "My PGs", value: stats.totalPGs, color: "text-brand-500", bg: "bg-brand-50 dark:bg-brand-900/20", icon: "🏘️" },
            { label: "Total Rooms", value: stats.totalRooms, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", icon: "🚪" },
            { label: "Residents", value: stats.totalResidents, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: "👥" },
            { label: "Occupancy", value: `${stats.occupancyPct}%`, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20", icon: "📈" },
            { label: "Pending Rents", value: stats.pendingPayments, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", icon: "₹" },
            { label: "Open Issues", value: stats.openComplaints, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20", icon: "⚑" },
          ].map((s) => (
            <div key={s.label} className={`card p-4 ${s.bg} border-0`}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className={`font-heading text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <h2 className="font-heading font-bold text-xl text-slate-900 dark:text-white mb-4">My PGs</h2>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-32" />)}
        </div>
      ) : pgs.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <p className="text-5xl mb-4">🏘️</p>
          <p className="font-heading font-semibold text-slate-600 dark:text-slate-300 text-lg">No PGs yet</p>
          <p className="text-sm mt-1 mb-6">Start by adding your first PG listing</p>
          <Link to="/owner/add-pg" className="btn-primary">+ Add Your First PG</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {pgs.map((pg) => (
            <Link key={pg._id} to={`/owner/pg/${pg._id}`}
              className={`card p-5 group block hover:border-brand-200 transition ${pg.isArchived ? "opacity-60" : ""}`}>
              {pg.images?.[0] && (
                <img src={pg.images[0].url} alt={pg.name} className="w-full h-36 object-cover rounded-xl mb-3 border border-gray-100 dark:border-slate-700" />
              )}
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-heading font-semibold text-slate-900 dark:text-white group-hover:text-brand-500 transition">
                  {pg.name} {pg.isArchived && <span className="badge-gray ml-1">Archived</span>}
                </h3>
                <span className={pg.vacantBeds > 0 ? "badge-green" : "badge-red"}>{pg.vacantBeds} beds vacant</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">📍 {pg.city}</p>
              <div className="flex gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
                <span>🚪 {pg.totalRooms} rooms</span>
                <span>👥 {pg.totalResidents} residents</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Link to={`/owner/pg/${pg._id}/edit`} onClick={(e) => e.stopPropagation()} className="btn-secondary text-sm">Edit</Link>
                <button onClick={(e) => { e.preventDefault(); handleArchive(pg._id); }} className="btn-secondary text-sm">
                  {pg.isArchived ? "Unarchive" : "Archive"}
                </button>
                <button onClick={(e) => { e.preventDefault(); setDeletingId(pg._id); }} className="btn-danger text-sm">Delete</button>
              </div>
            </Link>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deletingId}
        title="Delete this PG?"
        description="All rooms, residents and data associated with this PG will be permanently removed."
        confirmLabel="Delete PG"
        onCancel={() => setDeletingId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
