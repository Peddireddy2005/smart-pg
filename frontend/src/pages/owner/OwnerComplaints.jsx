import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { getOwnerStaff } from "../../services/staffService";

const STATUS_STYLES = { pending: "badge-yellow", "in-progress": "badge-blue", resolved: "badge-green", closed: "badge-gray" };
const PRIORITY_STYLES = { low: "badge-gray", medium: "badge-yellow", high: "badge-red" };
const CATEGORY_ICON = { Electrical: "⚡", Plumbing: "🚰", Internet: "📶", Cleaning: "🧹", Food: "🍽️", Others: "📌" };

export default function OwnerComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [staff, setStaff] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/complaints/owner/all"), getOwnerStaff()])
      .then(([c, s]) => { setComplaints(c.data); setStaff(s); })
      .catch(() => toast.error("Failed to load complaints"))
      .finally(() => setLoading(false));
  }, []);

  const update = async (id, status) => {
    try {
      const { data } = await api.put(`/complaints/${id}/status`, { status });
      setComplaints((prev) => prev.map((c) => (c._id === id ? data : c)));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    }
  };

  const assignStaff = async (id, staffId) => {
    try {
      const { data } = await api.put(`/complaints/${id}/assign`, { staffId: staffId || null });
      setComplaints((prev) => prev.map((c) => (c._id === id ? data : c)));
      toast.success(staffId ? "Staff assigned" : "Unassigned");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const filtered = filter === "all" ? complaints : complaints.filter((c) => c.status === filter);

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white mb-6">Complaints</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "pending", "in-progress", "resolved", "closed"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${filter === s ? "bg-slate-900 text-white" : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300"}`}>
            {s === "all" ? "All" : s}
            <span className="ml-1.5 opacity-60 text-xs">
              ({s === "all" ? complaints.length : complaints.filter((c) => c.status === s).length})
            </span>
          </button>
        ))}
      </div>

      {loading ? <p className="text-slate-400">Loading...</p> : filtered.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-heading font-semibold text-slate-600 dark:text-slate-300">No complaints here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c._id} className="card p-5">
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-3 flex-1 min-w-0">
                  {c.resident?.photoUrl
                    ? <img src={c.resident.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5" />
                    : <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold text-sm shrink-0 mt-0.5">{c.resident?.name?.charAt(0)}</div>
                  }
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-slate-800 dark:text-white">{CATEGORY_ICON[c.category] || "📌"} {c.title}</p>
                      <span className={STATUS_STYLES[c.status]}>{c.status}</span>
                      <span className={PRIORITY_STYLES[c.priority]}>{c.priority} priority</span>
                      {c.category && <span className="badge-purple">{c.category}</span>}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{c.description}</p>
                    {c.images?.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {c.images.map((img, i) => (
                          <button key={i} onClick={() => setExpanded(img.url)}>
                            <img src={img.url} alt="" className="w-14 h-14 object-cover rounded-lg border border-gray-200 dark:border-slate-700" />
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-1.5">
                      {c.pg?.name} · Room {c.room?.roomNumber} · {c.resident?.name} · {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                    {c.assignedStaff && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">🧑‍🔧 Assigned to {c.assignedStaff.name} ({c.assignedStaff.role})</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0 items-end">
                  <select value={c.status} onChange={(e) => update(c._id, e.target.value)} className="input w-auto text-sm">
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <select value={c.assignedStaff?._id || ""} onChange={(e) => assignStaff(c._id, e.target.value)} className="input w-auto text-sm">
                    <option value="">Assign staff...</option>
                    {staff.filter((s) => s.isActive).map((s) => <option key={s._id} value={s._id}>{s.name} ({s.role})</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {expanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setExpanded(null)}>
          <img src={expanded} alt="" className="max-w-2xl max-h-[80vh] rounded-xl" />
        </div>
      )}
    </div>
  );
}
