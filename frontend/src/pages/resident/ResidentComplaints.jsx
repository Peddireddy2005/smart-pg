import { useEffect, useState } from "react";
import api from "../../services/api";

const STATUS_STYLES = { pending: "badge-yellow", "in-progress": "badge-blue", resolved: "badge-green" };

export default function ResidentComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [hasPG, setHasPG] = useState(true);
  const [form, setForm] = useState({ title: "", description: "" });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/auth/me").then(({ data }) => { if (!data.assignedPG) setHasPG(false); });
    api.get("/complaints/my").then(({ data }) => setComplaints(data)).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null); setLoading(true);
    console.log("[COMPLAINTS] Submit:", form.title);
    try {
      const { data } = await api.post("/complaints", form);
      setComplaints((prev) => [data, ...prev]);
      setForm({ title: "", description: "" });
      setMsg({ type: "success", text: "Complaint submitted!" });
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed" });
    } finally { setLoading(false); }
  };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-slate-900 mb-6">Complaints</h1>

      {hasPG ? (
        <form onSubmit={submit} className="card p-5 mb-6 space-y-3">
          <h2 className="font-heading font-semibold text-slate-800">Raise a Complaint</h2>
          {msg && (
            <div className={`text-sm rounded-xl px-4 py-2.5 ${msg.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
              {msg.text}
            </div>
          )}
          <div>
            <label className="label">Title</label>
            <input className="input" placeholder="e.g. WiFi not working" required
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} placeholder="Describe the issue in detail..." required
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button disabled={loading} className="btn-primary">
            {loading ? "Submitting..." : "Submit Complaint"}
          </button>
        </form>
      ) : (
        <div className="card p-5 mb-6 bg-amber-50 border-amber-200">
          <p className="text-amber-700 text-sm font-medium">Assign to a PG first to raise complaints.</p>
        </div>
      )}

      <h2 className="font-heading font-semibold text-slate-700 mb-3">My Complaints ({complaints.length})</h2>
      {complaints.length === 0 ? <p className="text-slate-400">No complaints yet.</p> : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <div key={c._id} className="card p-4">
              <div className="flex justify-between items-start mb-2">
                <p className="font-semibold text-slate-800">{c.title}</p>
                <span className={STATUS_STYLES[c.status]}>{c.status}</span>
              </div>
              <p className="text-sm text-slate-500">{c.description}</p>
              {c.ownerNote && <p className="text-sm text-blue-700 mt-2 bg-blue-50 rounded-lg px-3 py-2">💬 Owner: {c.ownerNote}</p>}
              <p className="text-xs text-slate-400 mt-2">{c.pg?.name} · {new Date(c.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}