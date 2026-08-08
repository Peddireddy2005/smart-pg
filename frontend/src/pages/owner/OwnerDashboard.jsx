import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { DoorOpen, Users, IndianRupee, Flag, MapPin, Plus } from "lucide-react";
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
          <h1 className="font-heading text-3xl font-bold text-slate-900">
            Good morning, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-slate-500 mt-1">Here's what's happening with your PGs today</p>
        </div>
        <Link to="/owner/add-pg" className="btn-primary inline-flex items-center gap-1.5">
          <Plus size={16} /> Add PG
        </Link>
      </div>

      {stats && (
        <div className="card p-5 mb-8">
          <div className="flex items-end justify-between mb-2">
            <p className="eyebrow">Occupancy</p>
            <p className="text-xs text-slate-400">across {stats.totalPGs} PG{stats.totalPGs !== 1 ? "s" : ""}</p>
          </div>
          <p className="amount font-heading text-5xl font-bold text-ink-900 mb-1">{stats.occupancyPct}%</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mb-5">
            <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${stats.occupancyPct}%` }} />
          </div>

          <div className="divide-y divide-[#EAF6F3]">
            <div className="ledger-row">
              <span className="flex items-center gap-2.5 text-sm text-slate-600"><DoorOpen size={17} className="text-slate-400" /> Total rooms</span>
              <span className="amount font-semibold text-slate-800">{stats.totalRooms}</span>
            </div>
            <div className="ledger-row">
              <span className="flex items-center gap-2.5 text-sm text-slate-600"><Users size={17} className="text-slate-400" /> Residents</span>
              <span className="amount font-semibold text-slate-800">{stats.totalResidents}</span>
            </div>
            <div className="ledger-row">
              <span className="flex items-center gap-2.5 text-sm text-slate-600"><IndianRupee size={17} className="text-slate-400" /> Pending rents this month</span>
              <span className={`amount font-semibold ${stats.pendingPayments > 0 ? "text-amber-600" : "text-slate-800"}`}>{stats.pendingPayments}</span>
            </div>
            <div className="ledger-row">
              <span className="flex items-center gap-2.5 text-sm text-slate-600"><Flag size={17} className="text-slate-400" /> Open complaints</span>
              <span className={`amount font-semibold ${stats.openComplaints > 0 ? "text-red-500" : "text-slate-800"}`}>{stats.openComplaints}</span>
            </div>
            <div className="ledger-row">
              <span className="flex items-center gap-2.5 text-sm text-slate-600"><IndianRupee size={17} className="text-slate-400" /> Revenue this month</span>
              <span className="amount font-semibold text-emerald-600">₹{stats.revenue.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      <h2 className="font-heading font-bold text-xl text-slate-900 mb-4">My PGs</h2>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-32" />)}
        </div>
      ) : pgs.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <p className="font-heading font-semibold text-slate-600 text-lg">No PGs yet</p>
          <p className="text-sm mt-1 mb-6">Start by adding your first PG listing</p>
          <Link to="/owner/add-pg" className="btn-primary">Add Your First PG</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {pgs.map((pg) => (
            <Link key={pg._id} to={`/owner/pg/${pg._id}`}
              className={`card p-5 group block hover:border-brand-200 transition ${pg.isArchived ? "opacity-60" : ""}`}>
              {pg.images?.[0] && (
                <img src={pg.images[0].url} alt={pg.name} className="w-full h-36 object-cover rounded-xl mb-3 border border-gray-100" />
              )}
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-heading font-semibold text-slate-900 group-hover:text-brand-500 transition">
                  {pg.name} {pg.isArchived && <span className="badge-gray ml-1">Archived</span>}
                </h3>
                <span className={pg.vacantBeds > 0 ? "badge-green" : "badge-red"}>{pg.vacantBeds} beds vacant</span>
              </div>
              <p className="text-slate-500 text-sm mb-3 flex items-center gap-1"><MapPin size={13} /> {pg.city}</p>
              <div className="flex gap-4 text-sm text-slate-500 mb-4">
                <span className="flex items-center gap-1.5"><DoorOpen size={15} /> {pg.totalRooms} rooms</span>
                <span className="flex items-center gap-1.5"><Users size={15} /> {pg.totalResidents} residents</span>
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