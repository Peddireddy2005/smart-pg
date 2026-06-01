import { useEffect, useState } from "react";
import api from "../../services/api";

const STATUS_STYLES = {
  pending: "badge-yellow",
  "in-progress": "badge-blue",
  resolved: "badge-green",
};

export default function OwnerComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/complaints/owner/all")
      .then(({ data }) => { setComplaints(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const update = async (id, status) => {
    console.log("[OWNER COMPLAINTS] Update:", id, "→", status);
    const { data } = await api.put(`/complaints/${id}/status`, { status });
    setComplaints((prev) => prev.map((c) => (c._id === id ? data : c)));
  };

  const filtered = filter === "all" ? complaints : complaints.filter((c) => c.status === filter);

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-slate-900 mb-6">Complaints</h1>

      <div className="flex gap-2 mb-6">
        {["all", "pending", "in-progress", "resolved"].map((s) => (
          <button key={s} onClick={() => { console.log("[COMPLAINTS] Filter:", s); setFilter(s); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${filter === s ? "bg-slate-900 text-white" : "bg-white border border-gray-200 text-slate-600 hover:border-slate-300"}`}>
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
          <p className="font-heading font-semibold text-slate-600">No complaints here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c._id} className="card p-5">
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-3 flex-1">
                  {c.resident?.photoUrl ? <img src={c.resident.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5" /> :
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm shrink-0 mt-0.5">{c.resident?.name?.charAt(0)}</div>}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-800">{c.title}</p>
                      <span className={STATUS_STYLES[c.status]}>{c.status}</span>
                    </div>
                    <p className="text-sm text-slate-500">{c.description}</p>
                    <p className="text-xs text-slate-400 mt-1.5">
                      {c.pg?.name} · Room {c.room?.roomNumber} · {c.resident?.name} · {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <select value={c.status} onChange={(e) => update(c._id, e.target.value)}
                  className="input w-auto text-sm shrink-0">
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}