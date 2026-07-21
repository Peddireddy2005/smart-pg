import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";

// Room type is derived from bed capacity rather than picked manually —
// keeps it consistent and removes a redundant decision for the owner.
const deriveRoomType = (capacity) => {
  const n = Number(capacity);
  if (n === 1) return "Single";
  if (n === 2) return "Double";
  if (n === 3) return "Triple";
  return "Dormitory";
};

export default function AddRoom() {
  const { pgId } = useParams();
  const [form, setForm] = useState({ roomNumber: "", capacity: "", rent: "", depositAmount: "", floor: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await api.post(`/rooms/${pgId}`, { ...form, type: deriveRoomType(form.capacity) });
      toast.success("Room added!");
      navigate(`/owner/pg/${pgId}`);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to add room";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-8">
        <Link to={`/owner/pg/${pgId}`} className="text-slate-400 hover:text-slate-600 text-sm">← Back to PG</Link>
        <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">Add Room</h1>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}

      <form onSubmit={submit} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Room Number *</label>
            <input className="input" placeholder="101" required value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} />
          </div>
          <div>
            <label className="label">Floor</label>
            <input className="input" placeholder="1st Floor" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Capacity (beds) *</label>
            <input className="input" type="number" placeholder="2" required min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            {form.capacity && <p className="text-xs text-slate-400 mt-1">Will be listed as: {deriveRoomType(form.capacity)}</p>}
          </div>
          <div>
            <label className="label">Monthly Rent (₹) *</label>
            <input className="input" type="number" placeholder="8500" required min={0} value={form.rent} onChange={(e) => setForm({ ...form, rent: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="label">Security Deposit (₹) <span className="text-slate-400 normal-case font-normal">(optional, one-time, charged on move-in)</span></label>
          <input className="input" type="number" placeholder="e.g. 10000" min={0} value={form.depositAmount} onChange={(e) => setForm({ ...form, depositAmount: e.target.value })} />
        </div>

        <button disabled={loading} className="btn-primary w-full justify-center">
          {loading ? "Adding..." : "Add Room"}
        </button>
      </form>
    </div>
  );
}