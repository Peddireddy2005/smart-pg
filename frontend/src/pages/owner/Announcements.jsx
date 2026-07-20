import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { createAnnouncement, getOwnerAnnouncements, deleteAnnouncement } from "../../services/announcementService";
import ConfirmModal from "../../components/ConfirmModal";

const TYPES = ["General", "Water Shutdown", "Rent Reminder", "Holiday", "Cleaning"];
const TYPE_ICON = { General: "📣", "Water Shutdown": "🚰", "Rent Reminder": "₹", Holiday: "🎉", Cleaning: "🧹" };

export default function Announcements() {
  const [pgs, setPgs] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ pgId: "", title: "", message: "", type: "General" });
  const [posting, setPosting] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/pg/owner"), getOwnerAnnouncements()])
      .then(([p, a]) => { setPgs(p.data); setAnnouncements(a); if (p.data[0]) setForm((f) => ({ ...f, pgId: p.data[0]._id })); })
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.pgId) { toast.error("Select a PG first"); return; }
    setPosting(true);
    try {
      const created = await createAnnouncement(form.pgId, { title: form.title, message: form.message, type: form.type });
      const pg = pgs.find((p) => p._id === form.pgId);
      setAnnouncements((prev) => [{ ...created, pg }, ...prev]);
      setForm({ ...form, title: "", message: "" });
      toast.success("Announcement posted to all residents");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post");
    } finally {
      setPosting(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteAnnouncement(deleting);
      setAnnouncements((prev) => prev.filter((a) => a._id !== deleting));
      toast.success("Deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white mb-6">Announcements</h1>

      <form onSubmit={submit} className="card p-6 mb-8 space-y-4">
        <h2 className="font-heading font-semibold text-slate-800 dark:text-white">Post a Notice</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">PG</label>
            <select className="input" value={form.pgId} onChange={(e) => setForm({ ...form, pgId: e.target.value })}>
              {pgs.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Title</label>
          <input className="input" required placeholder="e.g. Water Shutdown Tomorrow" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="label">Message</label>
          <textarea className="input" rows={3} required placeholder="Details for residents..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </div>
        <button disabled={posting || !pgs.length} className="btn-primary">
          {posting ? "Posting..." : "📣 Notify All Residents"}
        </button>
        {!pgs.length && !loading && <p className="text-xs text-amber-600">Add a PG first to post announcements.</p>}
      </form>

      <h2 className="font-heading font-semibold text-slate-800 dark:text-white mb-3">History</h2>
      {loading ? <p className="text-slate-400">Loading...</p> : announcements.length === 0 ? (
        <p className="text-slate-400">No announcements posted yet.</p>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a._id} className="card p-4 flex justify-between items-start gap-4">
              <div>
                <p className="font-semibold text-slate-800 dark:text-white">{TYPE_ICON[a.type] || "📣"} {a.title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{a.message}</p>
                <p className="text-xs text-slate-400 mt-1.5">{a.pg?.name} · {new Date(a.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => setDeleting(a._id)} className="btn-danger text-xs shrink-0">Delete</button>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal open={!!deleting} title="Delete this announcement?" confirmLabel="Delete" onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </div>
  );
}
