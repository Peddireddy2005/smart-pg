import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { createInventoryItem, getOwnerInventory, addRepairRecord, deleteInventoryItem } from "../../services/inventoryService";
import ConfirmModal from "../../components/ConfirmModal";

const CATEGORIES = ["Beds", "Mattress", "Fan", "AC", "Table", "Chair", "Cupboard", "Other"];
const CONDITION_STYLE = { New: "badge-green", Good: "badge-blue", Fair: "badge-yellow", "Needs Repair": "badge-red", Damaged: "badge-gray" };

export default function Inventory() {
  const [pgs, setPgs] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ pgId: "", name: "", category: "Beds", quantity: 1, condition: "Good" });
  const [adding, setAdding] = useState(false);
  const [repairing, setRepairing] = useState(null);
  const [repairNote, setRepairNote] = useState("");
  const [repairCost, setRepairCost] = useState("");
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, i] = await Promise.all([api.get("/pg/owner"), getOwnerInventory()]);
      setPgs(p.data);
      setItems(i);
      if (p.data[0]) setForm((f) => ({ ...f, pgId: f.pgId || p.data[0]._id }));
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const submit = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const created = await createInventoryItem(form.pgId, { name: form.name, category: form.category, quantity: Number(form.quantity), condition: form.condition });
      const pg = pgs.find((p) => p._id === form.pgId);
      setItems((prev) => [{ ...created, pg }, ...prev]);
      setForm({ ...form, name: "", quantity: 1 });
      toast.success("Item added");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setAdding(false);
    }
  };

  const submitRepair = async () => {
    try {
      const updated = await addRepairRecord(repairing, { note: repairNote, cost: Number(repairCost) || 0 });
      setItems((prev) => prev.map((i) => (i._id === repairing ? { ...i, ...updated } : i)));
      toast.success("Repair logged");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setRepairing(null);
      setRepairNote("");
      setRepairCost("");
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteInventoryItem(deleting);
      setItems((prev) => prev.filter((i) => i._id !== deleting));
      toast.success("Item removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white mb-6">Inventory</h1>

      <form onSubmit={submit} className="card p-6 mb-8 space-y-4">
        <h2 className="font-heading font-semibold text-slate-800 dark:text-white">Add Item</h2>
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
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Item Name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Study Table" />
          </div>
          <div>
            <label className="label">Quantity</label>
            <input className="input" type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div>
            <label className="label">Condition</label>
            <select className="input" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
              {Object.keys(CONDITION_STYLE).map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <button disabled={adding || !pgs.length} className="btn-primary">{adding ? "Adding..." : "+ Add Item"}</button>
      </form>

      {loading ? <p className="text-slate-400">Loading...</p> : items.length === 0 ? (
        <p className="text-slate-400">No inventory items yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item._id} className="card p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-heading font-bold text-slate-900 dark:text-white">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.category} · Qty {item.quantity} · {item.pg?.name}</p>
                </div>
                <span className={CONDITION_STYLE[item.condition]}>{item.condition}</span>
              </div>
              {item.repairHistory?.length > 0 && (
                <div className="mt-2 space-y-1">
                  {item.repairHistory.slice(-2).map((r, i) => (
                    <p key={i} className="text-xs text-slate-500 dark:text-slate-400">🔧 {new Date(r.date).toLocaleDateString()} — {r.note} {r.cost ? `(₹${r.cost})` : ""}</p>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <button onClick={() => setRepairing(item._id)} className="btn-secondary text-xs">Log Repair</button>
                <button onClick={() => setDeleting(item._id)} className="btn-danger text-xs">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {repairing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setRepairing(null)}>
          <div className="card p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white mb-3">Log Repair</h3>
            <input className="input mb-3" placeholder="What was fixed?" value={repairNote} onChange={(e) => setRepairNote(e.target.value)} />
            <input className="input mb-4" type="number" placeholder="Cost (₹)" value={repairCost} onChange={(e) => setRepairCost(e.target.value)} />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRepairing(null)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={submitRepair} className="btn-primary text-sm">Save</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal open={!!deleting} title="Remove this item?" confirmLabel="Remove" onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />
    </div>
  );
}
