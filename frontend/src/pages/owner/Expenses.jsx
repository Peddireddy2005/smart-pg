import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { createExpense, getOwnerExpenses, deleteExpense } from "../../services/expenseService";
import ConfirmModal from "../../components/ConfirmModal";

const CATEGORIES = ["Electricity", "Water", "Maintenance", "Internet", "Salary", "Repairs", "Other"];
const CATEGORY_ICON = { Electricity: "⚡", Water: "🚰", Maintenance: "🛠️", Internet: "📶", Salary: "💵", Repairs: "🔧", Other: "📌" };

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
      <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white mb-6">Expenses</h1>

      <form onSubmit={submit} className="card p-6 mb-8 space-y-4">
        <h2 className="font-heading font-semibold text-slate-800 dark:text-white">Record Expense</h2>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 bg-red-50 dark:bg-red-900/20">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total This Month</p>
          <p className="font-heading text-xl font-bold text-red-600">₹{data.total.toLocaleString()}</p>
        </div>
        {Object.entries(data.byCategory).slice(0, 3).map(([cat, amt]) => (
          <div key={cat} className="card p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">{CATEGORY_ICON[cat]} {cat}</p>
            <p className="font-heading text-xl font-bold text-slate-700 dark:text-slate-200">₹{amt.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {loading ? <p className="text-slate-400">Loading...</p> : data.expenses.length === 0 ? (
        <p className="text-slate-400">No expenses recorded for this period.</p>
      ) : (
        <div className="card overflow-hidden">
          {data.expenses.map((e) => (
            <div key={e._id} className="px-5 py-3 border-b dark:border-slate-700 last:border-0 flex justify-between items-center">
              <div>
                <p className="font-medium text-sm text-slate-800 dark:text-white">{CATEGORY_ICON[e.category]} {e.category}{e.note ? ` — ${e.note}` : ""}</p>
                <p className="text-xs text-slate-400">{e.pg?.name} · {new Date(e.date).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-700 dark:text-slate-200">₹{e.amount.toLocaleString()}</span>
                <button onClick={() => setDeleting(e._id)} className="btn-danger text-xs">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal open={!!deleting} title="Delete this expense?" confirmLabel="Delete" onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </div>
  );
}
