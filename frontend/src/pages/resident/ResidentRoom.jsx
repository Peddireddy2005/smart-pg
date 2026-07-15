import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { getSession } from "../../services/authService";

export default function ResidentRoom() {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = getSession();

  useEffect(() => {
    api.get("/rooms/my")
      .then(({ data }) => setRoom(data))
      .catch((err) => setError(err.response?.data?.message || "No room assigned"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900 mb-6">My Room</h1>
        <div className="card p-10 text-center bg-amber-50 border-amber-200">
          <p className="text-4xl mb-3">🏠</p>
          <p className="font-heading font-semibold text-amber-800">No room assigned yet</p>
          <p className="text-amber-600 text-sm mt-1">
            Your PG owner will assign you to a room. Check back later!
          </p>
        </div>
      </div>
    );
  }

  const pg = room.pg;
  const occupancyPct = Math.round((room.occupancy / room.capacity) * 100);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-slate-900 mb-6">My Room</h1>

      {/* PG info card */}
      <div className="card p-5 mb-4">
        <p className="label">PG</p>
        <p className="font-heading font-bold text-xl text-slate-900">{pg?.name}</p>
        <p className="text-slate-500 text-sm mt-0.5">📍 {pg?.address}</p>
        {pg?.contactPhone && (
          <a href={`tel:${pg.contactPhone}`} className="inline-flex items-center gap-1 text-brand-500 text-sm mt-1 hover:underline">
            📞 {pg.contactPhone}
          </a>
        )}

        {/* Amenities */}
        {pg?.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {pg.amenities.map((a, i) => (
              <span key={i} className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-lg">{a}</span>
            ))}
          </div>
        )}

        {/* Rules */}
        {pg?.rules && (
          <div className="mt-3 bg-amber-50 rounded-xl p-3 text-sm text-amber-700">
            📋 {pg.rules}
          </div>
        )}
      </div>

      {/* Room details card */}
      <div className="card p-5 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="label">Room</p>
            <p className="font-heading font-bold text-2xl text-slate-900">Room {room.roomNumber}</p>
            <div className="flex items-center gap-2 mt-1">
              {room.type && <span className="badge-blue">{room.type}</span>}
              {room.floor && <span className="text-slate-400 text-sm">{room.floor}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="font-heading font-bold text-brand-500 text-xl">
              ₹{room.rent?.toLocaleString()}
            </p>
            <p className="text-slate-400 text-xs">per month</p>
          </div>
        </div>

        {/* Occupancy bar */}
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>Occupancy</span>
          <span>{room.occupancy} / {room.capacity} beds</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${occupancyPct >= 90 ? "bg-red-400" : occupancyPct >= 60 ? "bg-amber-400" : "bg-emerald-400"}`}
            style={{ width: `${occupancyPct}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">{room.capacity - room.occupancy} bed(s) vacant</p>
      </div>

      {/* Roommates */}
      <div className="card p-5">
        <p className="label mb-3">Roommates ({room.residents?.length || 0})</p>
        {room.residents?.length > 0 ? (
          <div className="space-y-3">
            {room.residents.map((r) => {
              const isMe = r._id === user?._id;
              return (
                <div
                  key={r._id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${isMe ? "bg-brand-50 border border-brand-200" : "bg-slate-50"}`}
                >
                  {r.photoUrl ? (
                    <img src={r.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 shrink-0">
                      {r.name?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm">
                      {r.name}{" "}
                      {isMe && <span className="text-brand-500 text-xs">(You)</span>}
                    </p>
                    <p className="text-slate-400 text-xs truncate">{r.email}</p>
                    {r.phone && <p className="text-slate-400 text-xs">{r.phone}</p>}
                  </div>
                  {!r.isVerified && <span className="badge-yellow text-xs shrink-0">Guest</span>}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">No roommates yet.</p>
        )}
      </div>

      {/* PG listing link */}
      <div className="mt-4">
        <Link
          to={`/pgs/${pg?._id}`}
          className="text-brand-500 text-sm hover:underline"
        >
          View public PG listing & reviews →
        </Link>
      </div>
    </div>
  );
}
