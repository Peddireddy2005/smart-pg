import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { inviteVisitor, getMyVisitors } from "../../services/visitorService";

const STATUS_STYLES = { pending: "badge-yellow", approved: "badge-blue", rejected: "badge-red", entered: "badge-green", exited: "badge-gray" };

export default function Visitors() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", phone: "", purpose: "" });
  const [inviting, setInviting] = useState(false);
  const [qr, setQr] = useState(null);

  const load = () => {
    setLoading(true);
    getMyVisitors().then(setVisitors).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      const created = await inviteVisitor(form);
      setVisitors((prev) => [created, ...prev]);
      setQr(created.qrDataUrl);
      setForm({ name: "", phone: "", purpose: "" });
      toast.success("Visitor invited");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to invite");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white mb-6">Visitors</h1>

      <form onSubmit={submit} className="card p-5 mb-6 space-y-3">
        <h2 className="font-heading font-semibold text-slate-800 dark:text-white">Invite a Visitor</h2>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        </div>
        <div><label className="label">Purpose</label><input className="input" placeholder="e.g. Family visit" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></div>
        <button disabled={inviting} className="btn-primary">{inviting ? "Inviting..." : "Generate QR Invite"}</button>
      </form>

      {qr && (
        <div className="card p-5 mb-6 text-center">
          <p className="font-heading font-semibold text-slate-800 dark:text-white mb-3">Show this QR at the gate</p>
          <img src={qr} alt="Visitor QR" className="w-40 h-40 mx-auto rounded-xl border border-gray-100 dark:border-slate-700" />
        </div>
      )}

      <h2 className="font-heading font-semibold text-slate-700 dark:text-slate-300 mb-3">My Visitors</h2>
      {loading ? <p className="text-slate-400">Loading...</p> : visitors.length === 0 ? <p className="text-slate-400">No visitors invited yet.</p> : (
        <div className="space-y-3">
          {visitors.map((v) => (
            <div key={v._id} className="card p-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-slate-800 dark:text-white">{v.name} <span className={STATUS_STYLES[v.status]}>{v.status}</span></p>
                <p className="text-xs text-slate-400">{v.purpose || "-"} · {new Date(v.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
