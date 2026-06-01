import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../../services/api";

export default function AddRoom() {
  const { pgId } = useParams();
  const [form, setForm] = useState({ roomNumber: "", capacity: "", rent: "", floor: "", type: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    console.log("[ADD ROOM] PG:", pgId, "Form:", form);
    try {
      await api.post(`/rooms/${pgId}`, form);
      navigate(`/owner/pg/${pgId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-8">
        <Link to={`/owner/pg/${pgId}`} className="text-slate-400 hover:text-slate-600 text-sm">← Back</Link>
        <h1 className="font-heading text-2xl font-bold text-slate-900">Add Room</h1>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}
      <form onSubmit={submit} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Room Number *</label>
            <input className="input" placeholder="101" required
              value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} />
          </div>
          <div>
            <label className="label">Floor</label>
            <input className="input" placeholder="1st Floor"
              value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Room Type</label>
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="">Select type</option>
            {["Single", "Double", "Triple", "Dormitory"].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Capacity *</label>
            <input className="input" type="number" placeholder="3" required min={1}
              value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          </div>
          <div>
            <label className="label">Monthly Rent (₹) *</label>
            <input className="input" type="number" placeholder="8500" required min={0}
              value={form.rent} onChange={(e) => setForm({ ...form, rent: e.target.value })} />
          </div>
        </div>
        <button disabled={loading} className="btn-primary w-full justify-center">
          {loading ? "Adding..." : "Add Room"}
        </button>
      </form>
    </div>
  );
}