import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";

export default function EditRoom() {
  const { pgId, roomId } = useParams();
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/rooms/${pgId}`).then(({ data }) => {
      const room = data.find((r) => r._id === roomId);
      if (room) {
        setForm({
          roomNumber: room.roomNumber, capacity: room.capacity, rent: room.rent,
          floor: room.floor || "", type: room.type || "", status: room.status || "available",
          occupancy: room.occupancy,
        });
      }
    });
  }, [pgId, roomId]);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await api.put(`/rooms/${roomId}`, form);
      toast.success("Room updated");
      navigate(`/owner/pg/${pgId}`);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update room";
      setError(message);
      toast.error(message);
    } finally { setLoading(false); }
  };

  if (!form) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-8">
        <Link to={`/owner/pg/${pgId}`} className="text-slate-400 hover:text-slate-600 text-sm">← Back</Link>
        <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">Edit Room</h1>
      </div>
      {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}
      <form onSubmit={submit} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Room Number *</label>
            <input className="input" required value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} />
          </div>
          <div>
            <label className="label">Floor</label>
            <input className="input" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Room Type</label>
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="">Select type</option>
            {["Single", "Double", "Triple", "Dormitory"].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Capacity *</label>
            <input className="input" type="number" required min={form.occupancy || 1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            {form.occupancy > 0 && <p className="text-xs text-slate-400 mt-1">Can't go below {form.occupancy} (current occupancy)</p>}
          </div>
          <div>
            <label className="label">Monthly Rent (₹) *</label>
            <input className="input" type="number" required min={0} value={form.rent} onChange={(e) => setForm({ ...form, rent: e.target.value })} />
          </div>
        </div>
        <button disabled={loading} className="btn-primary w-full justify-center">
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
