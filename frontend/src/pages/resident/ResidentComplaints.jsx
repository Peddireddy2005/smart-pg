import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";

const STATUS_STYLES = { pending: "badge-yellow", "in-progress": "badge-blue", resolved: "badge-green" };
const CATEGORIES = ["Electrical", "Plumbing", "Internet", "Cleaning", "Food", "Others"];
const CATEGORY_ICON = { Electrical: "⚡", Plumbing: "🚰", Internet: "📶", Cleaning: "🧹", Food: "🍽️", Others: "📌" };

export default function ResidentComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [hasPG, setHasPG] = useState(true);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", category: "Others" });
  const [images, setImages] = useState([]);
  const fileRef = useRef(null);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    api.get("/auth/me").then(({ data }) => { if (!data.assignedPG) setHasPG(false); });
    api.get("/complaints/my")
      .then(({ data }) => setComplaints(data))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null); setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      images.forEach((img) => formData.append("images", img));
      const { data } = await api.post("/complaints", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setComplaints((prev) => [data, ...prev]);
      setForm({ title: "", description: "", priority: "medium", category: "Others" });
      setImages([]);
      if (fileRef.current) fileRef.current.value = "";
      setMsg({ type: "success", text: "Complaint submitted!" });
      toast.success("Complaint submitted");
    } catch (err) {
      const message = err.response?.data?.message || "Failed";
      setMsg({ type: "error", text: message });
      toast.error(message);
    } finally { setLoading(false); }
  };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white mb-6">Complaints</h1>

      {hasPG ? (
        <form onSubmit={submit} className="card p-5 mb-6 space-y-3">
          <h2 className="font-heading font-semibold text-slate-800 dark:text-white">Raise a Complaint</h2>
          {msg && (
            <div className={`text-sm rounded-xl px-4 py-2.5 ${msg.type === "success" ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300" : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"}`}>
              {msg.text}
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Title</label>
              <input className="input" placeholder="e.g. WiFi not working" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} placeholder="Describe the issue in detail..." required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Photos (optional, up to 4)</label>
            <input ref={fileRef} type="file" accept="image/*" multiple className="input" onChange={(e) => setImages(Array.from(e.target.files || []).slice(0, 4))} />
          </div>
          <button disabled={loading} className="btn-primary">{loading ? "Submitting..." : "Submit Complaint"}</button>
        </form>
      ) : (
        <div className="card p-5 mb-6 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/40">
          <p className="text-amber-700 dark:text-amber-300 text-sm font-medium">Assign to a PG first to raise complaints.</p>
        </div>
      )}

      <h2 className="font-heading font-semibold text-slate-700 dark:text-slate-300 mb-3">My Complaints ({complaints.length})</h2>

      {loadingList ? (
        <p className="text-slate-400">Loading...</p>
      ) : complaints.length === 0 ? (
        <p className="text-slate-400">No complaints yet.</p>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <div key={c._id} className="card p-4">
              <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                <p className="font-semibold text-slate-800 dark:text-white">{CATEGORY_ICON[c.category] || "📌"} {c.title}</p>
                <div className="flex gap-2">
                  {c.priority && <span className={c.priority === "high" ? "badge-red" : c.priority === "medium" ? "badge-yellow" : "badge-gray"}>{c.priority}</span>}
                  <span className={STATUS_STYLES[c.status]}>{c.status}</span>
                </div>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{c.description}</p>
              {c.images?.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {c.images.map((img, i) => <img key={i} src={img.url} alt="" className="w-14 h-14 object-cover rounded-lg border border-gray-200 dark:border-slate-700" />)}
                </div>
              )}
              {c.assignedStaff && <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">🧑‍🔧 Handled by {c.assignedStaff.name}</p>}
              {c.ownerNote && <p className="text-sm text-blue-700 dark:text-blue-300 mt-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2">💬 Owner: {c.ownerNote}</p>}
              <p className="text-xs text-slate-400 mt-2">{c.pg?.name} · {new Date(c.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}