import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";

export default function PGDetails() {
  const { id } = useParams();
  const [pg, setPG] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get(`/pg/${id}`), api.get(`/rooms/${id}`)])
      .then(([p, r]) => { setPG(p.data); setRooms(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" /></div>;
  if (!pg) return <div className="p-8 text-red-500">PG not found</div>;

  const available = rooms.filter((r) => r.occupancy < r.capacity).length;

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link to="/pgs" className="text-slate-500 hover:text-slate-800 text-sm flex items-center gap-1">← Back</Link>
        <span className="text-slate-300">|</span>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-brand-500 rounded flex items-center justify-center text-white font-bold text-xs">S</div>
          <span className="font-heading font-bold text-slate-900">Smart PG</span>
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="card p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="font-heading text-3xl font-bold text-slate-900">{pg.name}</h1>
              <p className="text-slate-500 mt-1">📍 {pg.locality ? `${pg.locality}, ` : ""}{pg.city}</p>
              <p className="text-slate-400 text-sm">{pg.address}</p>
            </div>
            <span className={available > 0 ? "badge-green" : "badge-red"}>
              {available > 0 ? `${available} Available` : "Full"}
            </span>
          </div>
          {pg.description && <p className="text-slate-600 text-sm leading-relaxed mb-4">{pg.description}</p>}
          {pg.amenities?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {pg.amenities.map((a, i) => <span key={i} className="bg-slate-100 text-slate-600 text-sm px-3 py-1 rounded-xl">{a}</span>)}
            </div>
          )}
          {pg.rentRange?.min > 0 && (
            <p className="font-heading text-xl font-bold text-brand-500">Starting ₹{pg.rentRange.min.toLocaleString()}/month</p>
          )}
          {pg.rules && <p className="text-slate-500 text-sm mt-3 bg-amber-50 rounded-xl p-3">📋 <strong>Rules:</strong> {pg.rules}</p>}
        </div>

        <h2 className="font-heading font-bold text-xl text-slate-900 mb-4">Rooms</h2>
        {rooms.length === 0 ? <p className="text-slate-400">No rooms listed yet.</p> : (
          <div className="grid grid-cols-2 gap-4 mb-8">
            {rooms.map((room) => {
              const avail = room.capacity - room.occupancy;
              return (
                <div key={room._id} className={`card p-4 ${avail === 0 ? "opacity-60" : ""}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-heading font-semibold text-slate-900">Room {room.roomNumber}</span>
                    <span className={avail === 0 ? "badge-red" : "badge-green"}>{avail === 0 ? "Full" : "Open"}</span>
                  </div>
                  {room.type && <p className="text-xs text-slate-400 mb-1">{room.type}</p>}
                  <p className="text-sm text-slate-500">Beds: {room.occupancy}/{room.capacity}</p>
                  <p className="font-heading font-bold text-brand-500 mt-2">₹{room.rent.toLocaleString()}<span className="text-xs font-normal text-slate-400">/mo</span></p>
                </div>
              );
            })}
          </div>
        )}

        <div className="card p-5 bg-gradient-to-r from-brand-500 to-brand-600 border-0 text-white text-center">
          <p className="font-heading font-bold text-lg mb-1">Interested in this PG?</p>
          <p className="text-orange-100 text-sm mb-4">Create an account to connect with the owner and manage your stay.</p>
          <Link to="/signup" className="bg-white text-brand-600 font-semibold px-6 py-2.5 rounded-xl hover:bg-orange-50 transition inline-block">
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  );
}