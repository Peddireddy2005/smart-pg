import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Zap, Droplets, Wrench, Wifi, Users, Hammer, Pin } from "lucide-react";
import api from "../../services/api";
import { createExpense, getOwnerExpenses, deleteExpense } from "../../services/expenseService";
import ConfirmModal from "../../components/ConfirmModal";

const CATEGORIES = ["Electricity", "Water", "Maintenance", "Internet", "Salary", "Repairs", "Other"];
const CATEGORY_ICON = { Electricity: Zap, Water: Droplets, Maintenance: Wrench, Internet: Wifi, Salary: Users, Repairs: Hammer, Other: Pin };

export default function Expenses() {
  const now = new Date();
  const [pgs, setPgs] = useState([]);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState({ expenses: [], total: 0, byCategory: {} });
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ pgId: "", category: "Electricity", amount: "", date: now.toISOString().slice(0, 10), note: "" });
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, d] = await Promise.all([api.get("/pg/owner"), getOwnerExpenses(month, year)]);
      setPgs(p.data);
      setData(d);
      if (p.data[0] && !form.pgId) setForm((f) => ({ ...f, pgId: p.data[0]._id }));
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month, year]); // eslint-disable-line

  const submit = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await createExpense(form.pgId, { category: form.category, amount: Number(form.amount), date: form.date, note: form.note });
      toast.success("Expense recorded");
      setForm({ ...form, amount: "", note: "" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setAdding(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteExpense(deleting);
      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-slate-900 mb-6">Expenses</h1>

      <form onSubmit={submit} className="card p-6 mb-8 space-y-4">
        <h2 className="font-heading font-semibold text-slate-800">Record Expense</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">PG</label>
            <select className="input" value={form.pgId} onChange={(e) => setForm({ ...form, pgId: e.target.value })}>
              {pgs.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Amount (₹)</label>
            <input className="input" type="number" min={0} required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Note</label>
          <input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional details" />
        </div>
        <button disabled={adding || !pgs.length} className="btn-primary">{adding ? "Saving..." : "+ Add Expense"}</button>
      </form>

      <div className="flex items-center gap-3 mb-6">
        <select className="input w-auto" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <input className="input w-24" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
      </div>

      <div className="card p-5 mb-6">
        <div className="ledger-row">
          <span className="text-sm font-medium text-red-600">Total this month</span>
          <span className="amount font-heading font-bold text-red-600 text-xl">₹{data.total.toLocaleString()}</span>
        </div>
        {Object.entries(data.byCategory).map(([cat, amt]) => {
          const Icon = CATEGORY_ICON[cat] || Pin;
          return (
            <div key={cat} className="ledger-row">
              <span className="flex items-center gap-2.5 text-sm text-slate-600"><Icon size={16} className="text-slate-400" /> {cat}</span>
              <span className="amount font-semibold text-slate-700">₹{amt.toLocaleString()}</span>
            </div>
          );
        })}
      </div>

      {loading ? <p className="text-slate-400">Loading...</p> : data.expenses.length === 0 ? (
        <p className="text-slate-400">No expenses recorded for this period.</p>
      ) : (
        <div className="card overflow-hidden">
          {data.expenses.map((e) => {
            const Icon = CATEGORY_ICON[e.category] || Pin;
            return (
              <div key={e._id} className="px-5 py-3 border-b last:border-0 flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm text-slate-800 flex items-center gap-2"><Icon size={14} className="text-slate-400" /> {e.category}{e.note ? ` — ${e.note}` : ""}</p>
                  <p className="text-xs text-slate-400">{e.pg?.name} · {new Date(e.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="amount font-semibold text-slate-700">₹{e.amount.toLocaleString()}</span>
                  <button onClick={() => setDeleting(e._id)} className="btn-danger text-xs">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal open={!!deleting} title="Delete this expense?" confirmLabel="Delete" onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </div>
  );
}