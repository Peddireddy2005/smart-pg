import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Building2, DoorOpen, Users, LineChart, Wallet, Flag } from "lucide-react";
import api from "../services/api";
import { getSession } from "../services/authService";
import ConfirmModal from "../components/ConfirmModal";

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

  const STAT_CARDS = stats ? [
    { label: "My PGs", value: stats.totalPGs, icon: Building2, mono: false },
    { label: "Total rooms", value: stats.totalRooms, icon: DoorOpen, mono: false },
    { label: "Residents", value: stats.totalResidents, icon: Users, mono: false },
    { label: "Occupancy", value: `${stats.occupancyPct}%`, icon: LineChart, mono: false },
    { label: "Pending rents", value: stats.pendingPayments, icon: Wallet, mono: false, warn: stats.pendingPayments > 0 },
    { label: "Open issues", value: stats.openComplaints, icon: Flag, mono: false, danger: stats.openComplaints > 0 },
  ] : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-8 flex-wrap gap-3">
        <div>
          <p className="eyebrow mb-1">Owner · {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
          <h1 className="font-heading text-3xl font-semibold text-ink-900 dark:text-white">
            Good morning, {user?.name?.split(" ")[0]}
          </h1>
        </div>
        <Link to="/owner/add-pg" className="btn-primary">+ Add PG</Link>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          {STAT_CARDS.map((s) => (
            <div key={s.label} className="card p-4">
              <s.icon size={18} className={`mb-3 ${s.danger ? "text-rust-500" : s.warn ? "text-brand-500" : "text-ink-400"}`} strokeWidth={1.75} />
              <p className={`amount text-2xl font-semibold ${s.danger ? "text-rust-500" : s.warn ? "text-brand-600" : "text-ink-900 dark:text-white"}`}>{s.value}</p>
              <p className="text-ink-400 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <h2 className="font-heading font-semibold text-xl text-ink-900 dark:text-white mb-4">My PGs</h2>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-32" />)}
        </div>
      ) : pgs.length === 0 ? (
        <div className="card p-12 text-center text-ink-400">
          <Building2 size={40} className="mx-auto mb-4 text-ink-400" strokeWidth={1.5} />
          <p className="font-heading font-semibold text-ink-900 dark:text-white text-lg">No PGs yet</p>
          <p className="text-sm mt-1 mb-6">Start by adding your first PG listing</p>
          <Link to="/owner/add-pg" className="btn-primary">+ Add Your First PG</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {pgs.map((pg) => (
            <Link key={pg._id} to={`/owner/pg/${pg._id}`}
              className={`card p-5 group block hover:border-brand-400 transition ${pg.isArchived ? "opacity-60" : ""}`}>
              {pg.images?.[0] && (
                <img src={pg.images[0].url} alt={pg.name} className="w-full h-36 object-cover rounded-md mb-3 border border-[#E4DFD1]" />
              )}
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-heading font-semibold text-ink-900 dark:text-white group-hover:text-brand-600 transition">
                  {pg.name} {pg.isArchived && <span className="badge-gray ml-1">Archived</span>}
                </h3>
                <span className={pg.vacantBeds > 0 ? "badge-green" : "badge-red"}>{pg.vacantBeds} beds vacant</span>
              </div>
              <p className="text-ink-400 text-sm mb-3">{pg.city}</p>
              <div className="flex gap-4 text-sm text-ink-400 mb-4">
                <span className="flex items-center gap-1.5"><DoorOpen size={14} /> {pg.totalRooms} rooms</span>
                <span className="flex items-center gap-1.5"><Users size={14} /> {pg.totalResidents} residents</span>
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