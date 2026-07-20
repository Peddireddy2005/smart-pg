import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";

export default function AllocateResident() {
  const { pgId } = useParams();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [form, setForm] = useState({ residentEmail: "", residentName: "" });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [roomsLoaded, setRoomsLoaded] = useState(false);

  useEffect(() => {
    api.get(`/rooms/${pgId}`)
      .then(({ data }) => setRooms(data.filter((r) => r.occupancy < r.capacity)))
      .catch(() => toast.error("Failed to load rooms"))
      .finally(() => setRoomsLoaded(true));
  }, [pgId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!selectedRoom) { setMsg({ type: "error", text: "Please select a room" }); return; }
    setLoading(true); setMsg(null);

    try {
      await api.post(`/rooms/${selectedRoom}/allocate`, form);
      setMsg({ type: "success", text: `✓ ${form.residentEmail} has been assigned successfully!` });
      setForm({ residentEmail: "", residentName: "" });
      setSelectedRoom("");
      const { data } = await api.get(`/rooms/${pgId}`);
      setRooms(data.filter((r) => r.occupancy < r.capacity));
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to assign resident" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-8">
        <Link to={`/owner/pg/${pgId}`} className="text-slate-400 hover:text-slate-600 text-sm">← Back to PG</Link>
        <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">Allocate Resident</h1>
      </div>

      <div className="card p-4 mb-5 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/40">
        <p className="text-amber-800 dark:text-amber-300 text-sm font-medium">💡 Tip</p>
        <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">
          If the resident hasn't signed up yet, provide their email and name to
          create a guest account. They can sign up later with the same email to
          claim their account. Prefer a self-service option? Generate a{" "}
          <Link to={`/owner/pg/${pgId}`} className="underline font-medium">QR invite</Link> from the room card instead.
        </p>
      </div>

      <form onSubmit={submit} className="card p-6 space-y-4">
        {msg && (
          <div className={`text-sm rounded-xl px-4 py-3 ${msg.type === "success" ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300" : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"}`}>
            {msg.text}
          </div>
        )}

        <div>
          <label className="label">Select Room *</label>
          <select className="input" value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)}>
            <option value="">-- Select available room --</option>
            {rooms.map((r) => (
              <option key={r._id} value={r._id}>
                Room {r.roomNumber} ({r.type || "Standard"}) — {r.occupancy}/{r.capacity} occupied — ₹{r.rent.toLocaleString()}/mo
              </option>
            ))}
          </select>
          {roomsLoaded && rooms.length === 0 && (
            <p className="text-amber-600 text-xs mt-1">
              No available rooms in this PG.{" "}
              <Link to={`/owner/pg/${pgId}/add-room`} className="underline">Add a room first.</Link>
            </p>
          )}
        </div>

        <div>
          <label className="label">Resident Email *</label>
          <input className="input" type="email" required placeholder="resident@email.com"
            value={form.residentEmail} onChange={(e) => setForm({ ...form, residentEmail: e.target.value })} />
        </div>

        <div>
          <label className="label">Resident Name <span className="text-slate-400 normal-case font-normal">(required for new guests)</span></label>
          <input className="input" placeholder="Full name" value={form.residentName} onChange={(e) => setForm({ ...form, residentName: e.target.value })} />
        </div>

        <button disabled={loading || rooms.length === 0} className="btn-primary w-full justify-center">
          {loading ? "Assigning..." : "Assign Resident"}
        </button>
      </form>
    </div>
  );
}
