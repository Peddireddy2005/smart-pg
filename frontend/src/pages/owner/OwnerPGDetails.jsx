import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import { generateMonthlyRents } from "../../services/paymentService";
import ConfirmModal from "../../components/ConfirmModal";

export default function OwnerPGDetails() {
  const { id } = useParams();
  const now = new Date();

  const [pg, setPG] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [tab, setTab] = useState("rooms");
  const [genMonth, setGenMonth] = useState(now.getMonth() + 1);
  const [genYear, setGenYear] = useState(now.getFullYear());
  const [generating, setGenerating] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null); // { roomId, residentId }
  const [confirmDeleteRoom, setConfirmDeleteRoom] = useState(null);

  const loadRooms = useCallback(async () => {
    const { data } = await api.get(`/rooms/${id}`);
    setRooms(data);
  }, [id]);

  useEffect(() => {
    api.get(`/pg/${id}`).then(({ data }) => setPG(data)).catch(() => {});
    loadRooms().catch(() => {});
  }, [id, loadRooms]);

  const handleRemoveResident = async () => {
    const { roomId, residentId } = confirmRemove;
    try {
      const { data } = await api.post(`/rooms/${roomId}/remove`, { residentId });
      setRooms((prev) => prev.map((r) => (r._id === roomId ? data : r)));
      toast.success("Resident removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setConfirmRemove(null);
    }
  };

  const handleDeleteRoom = async () => {
    try {
      await api.delete(`/rooms/${confirmDeleteRoom}`);
      setRooms((prev) => prev.filter((r) => r._id !== confirmDeleteRoom));
      toast.success("Room deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Remove residents first");
    } finally {
      setConfirmDeleteRoom(null);
    }
  };

  const handleGenerateRent = async () => {
    setGenerating(true);
    try {
      const result = await generateMonthlyRents(id, genMonth, genYear);
      toast.success(`Generated ${result.count} rent record${result.count !== 1 ? "s" : ""}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate rents");
    } finally {
      setGenerating(false);
    }
  };

  if (!pg) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const totalResidents = rooms.reduce((s, r) => s + r.occupancy, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link to="/owner/dashboard" className="text-slate-400 hover:text-slate-600 text-sm block mb-2">← All PGs</Link>
          <h1 className="font-heading text-3xl font-bold text-slate-900">{pg.name}</h1>
          <p className="text-slate-500">📍 {pg.locality ? `${pg.locality}, ` : ""}{pg.city}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Link to={`/owner/pg/${id}/edit`} className="btn-secondary text-sm">Edit PG</Link>
          <Link to={`/owner/pg/${id}/add-room`} className="btn-secondary text-sm">+ Add Room</Link>
          <Link to={`/owner/pg/${id}/allocate`} className="btn-primary text-sm">+ Add Resident</Link>
        </div>
      </div>

      {/* PG images */}
      {pg.images?.length > 0 && (
        <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
          {pg.images.map((img) => (
            <img key={img._id} src={img.url} alt=""
              className="h-36 w-56 object-cover rounded-xl border border-gray-100 shrink-0" />
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Rooms", value: rooms.length, color: "text-blue-600" },
          { label: "Residents", value: totalResidents, color: "text-emerald-600" },
          { label: "Vacant", value: rooms.filter((r) => r.occupancy < r.capacity).length, color: "text-amber-600" },
          { label: "Full Rooms", value: rooms.filter((r) => r.occupancy >= r.capacity).length, color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold font-heading ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Generate rent */}
      <div className="card p-5 mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Month</label>
          <select className="input w-auto" value={genMonth} onChange={(e) => setGenMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Year</label>
          <input className="input w-24" type="number" value={genYear} onChange={(e) => setGenYear(Number(e.target.value))} />
        </div>
        <button disabled={generating} onClick={handleGenerateRent} className="btn-primary text-sm">
          {generating ? "Generating..." : "⚡ Generate Rent Records"}
        </button>
        <p className="text-xs text-slate-400 self-center">Creates pending payment records for all current residents.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {["rooms", "amenities", "rules"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl capitalize text-sm font-medium transition ${tab === t ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "rooms" && (
        rooms.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-slate-400 mb-4">No rooms added yet</p>
            <Link to={`/owner/pg/${id}/add-room`} className="btn-primary">Add First Room</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {rooms.map((room) => (
              <div key={room._id} className="card p-5">
                <div className="flex justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900">Room {room.roomNumber}</h3>
                    {room.type && <span className="badge-blue text-xs">{room.type}</span>}
                    {room.floor && <span className="text-slate-400 text-xs ml-2">{room.floor}</span>}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-700">{room.occupancy}/{room.capacity}</p>
                    <p className="text-xs text-emerald-600">{room.capacity - room.occupancy} vacant</p>
                  </div>
                </div>
                <p className="text-brand-500 font-semibold mb-3">₹{room.rent.toLocaleString()}/mo</p>

                {room.residents?.length > 0 ? (
                  <div className="space-y-2">
                    {room.residents.map((resident) => (
                      <div key={resident._id} className="flex justify-between items-center bg-slate-50 rounded-xl px-3 py-2">
                        <Link to={`/owner/resident/${resident._id}`} className="flex items-center gap-2 flex-1 min-w-0">
                          {resident.photoUrl
                            ? <img src={resident.photoUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                            : <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">{resident.name?.charAt(0)}</div>
                          }
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-slate-800 hover:text-brand-500 transition truncate">{resident.name}</p>
                            <p className="text-xs text-slate-400 truncate">{resident.email}</p>
                          </div>
                        </Link>
                        <button onClick={() => setConfirmRemove({ roomId: room._id, residentId: resident._id })}
                          className="btn-danger text-xs shrink-0 ml-2">Remove</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm mb-2">No residents assigned</p>
                )}

                <div className="flex gap-2 mt-3">
                  <Link to={`/owner/pg/${id}/room/${room._id}/edit`} className="btn-secondary text-xs">Edit</Link>
                  <button onClick={() => setConfirmDeleteRoom(room._id)} className="btn-danger text-xs">Delete Room</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === "amenities" && (
        <div className="card p-6">
          {pg.amenities?.length > 0
            ? <div className="flex flex-wrap gap-2">{pg.amenities.map((a, i) => <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-sm">{a}</span>)}</div>
            : <p className="text-slate-400">No amenities listed.</p>}
        </div>
      )}

      {tab === "rules" && (
        <div className="card p-6">
          {pg.rules ? <p className="text-slate-700 leading-relaxed">{pg.rules}</p> : <p className="text-slate-400">No rules listed.</p>}
        </div>
      )}

      <ConfirmModal
        open={!!confirmRemove}
        title="Remove this resident?"
        description="They will be unassigned from this room and PG."
        confirmLabel="Remove"
        onCancel={() => setConfirmRemove(null)}
        onConfirm={handleRemoveResident}
      />
      <ConfirmModal
        open={!!confirmDeleteRoom}
        title="Delete this room?"
        description="All residents must be removed first."
        confirmLabel="Delete Room"
        onCancel={() => setConfirmDeleteRoom(null)}
        onConfirm={handleDeleteRoom}
      />
    </div>
  );
}
