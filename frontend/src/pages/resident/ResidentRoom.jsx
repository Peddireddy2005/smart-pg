import { useEffect, useState } from "react";
import api from "../../services/api";

export default function ResidentRoom() {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    api.get("/rooms/my")
      .then(({ data }) => { setRoom(data); setLoading(false); })
      .catch((err) => { setError(err.response?.data?.message || "No room assigned"); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" /></div>;

  if (error || !room) {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900 mb-6">My Room</h1>
        <div className="card p-8 text-center bg-amber-50 border-amber-200">
          <p className="text-4xl mb-3">🏠</p>
          <p className="font-heading font-semibold text-amber-800">No room assigned yet</p>
          <p className="text-amber-600 text-sm mt-1">Contact your PG owner to get assigned to a room.</p>
        </div>
      </div>
    );
  }

  const pg = room.pg;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-slate-900 mb-6">My Room</h1>

      {/* PG info */}
      <div className="card p-5 mb-4">
        <p className="label">PG</p>
        <p className="font-heading font-bold text-xl text-slate-900">{pg?.name}</p>
        <p className="text-slate-500 text-sm">{pg?.address}</p>
        {pg?.contactPhone && <p className="text-slate-500 text-sm mt-1">📞 {pg.contactPhone}</p>}
        {pg?.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {pg.amenities.map((a, i) => <span key={i} className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-lg">{a}</span>)}
          </div>
        )}
        {pg?.rules && <div className="mt-3 bg-amber-50 rounded-xl p-3 text-sm text-amber-700">📋 {pg.rules}</div>}
      </div>

      {/* Room info */}
      <div className="card p-5 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="label">Room</p>
            <p className="font-heading font-bold text-2xl text-slate-900">Room {room.roomNumber}</p>
            {room.type && <span className="badge-blue">{room.type}</span>}
            {room.floor && <span className="text-slate-400 text-sm ml-2">{room.floor}</span>}
          </div>
          <p className="font-heading font-bold text-brand-500 text-xl">₹{room.rent?.toLocaleString()}<span className="text-sm font-normal text-slate-400">/mo</span></p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="label">Capacity</p><p className="font-medium text-slate-700">{room.capacity} beds</p></div>
          <div><p className="label">Occupied</p><p className="font-medium text-slate-700">{room.occupancy} / {room.capacity}</p></div>
        </div>
      </div>

      {/* Roommates */}
      <div className="card p-5">
        <p className="label mb-3">Roommates ({room.residents?.length || 0})</p>
        {room.residents?.length > 0 ? (
          <div className="space-y-3">
            {room.residents.map((r) => {
              const isMe = r._id === user?._id;
              return (
                <div key={r._id} className={`flex items-center gap-3 p-3 rounded-xl ${isMe ? "bg-brand-50 border border-brand-200" : "bg-slate-50"}`}>
                  {r.photoUrl ? (
                    <img src={r.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                      {r.name?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-slate-800 text-sm">{r.name} {isMe && <span className="text-brand-500 text-xs">(You)</span>}</p>
                    <p className="text-slate-400 text-xs">{r.email}</p>
                  </div>
                  {!r.isVerified && <span className="badge-yellow">Guest</span>}
                </div>
              );
            })}
          </div>
        ) : <p className="text-slate-400 text-sm">No roommates yet.</p>}
      </div>
    </div>
  );
}