import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import { getSession } from "../../services/authService";
import { submitVacateNotice, cancelVacateNotice } from "../../services/roomService";

export default function ResidentRoom() {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vacateNotice, setVacateNotice] = useState({ requested: false, plannedDate: null });
  const [plannedDate, setPlannedDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const user = getSession();

  const loadProfile = () => {
    api.get("/auth/me").then(({ data }) => {
      setVacateNotice(data.vacateNotice || { requested: false, plannedDate: null });
    }).catch(() => {});
  };

  useEffect(() => {
    api.get("/rooms/my")
      .then(({ data }) => setRoom(data))
      .catch((err) => setError(err.response?.data?.message || "No room assigned"))
      .finally(() => setLoading(false));
    loadProfile();
  }, []);

  const handleVacateNotice = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await submitVacateNotice(plannedDate);
      setVacateNotice(res.vacateNotice);
      toast.success("Vacate notice submitted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit notice");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelNotice = async () => {
    try {
      await cancelVacateNotice();
      setVacateNotice({ requested: false, plannedDate: null });
      toast.success("Vacate notice cancelled");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" /></div>;

  if (error || !room) {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white mb-6">My Room</h1>
        <div className="card p-10 text-center bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/40">
          <p className="text-4xl mb-3">🏠</p>
          <p className="font-heading font-semibold text-amber-800 dark:text-amber-300">No room assigned yet</p>
          <p className="text-amber-600 dark:text-amber-400 text-sm mt-1">Your PG owner will assign you to a room, or scan a QR invite. Check back later!</p>
        </div>
      </div>
    );
  }

  const pg = room.pg;
  const occupancyPct = Math.round((room.occupancy / room.capacity) * 100);
  const minVacateDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white mb-6">My Room</h1>

      <div className="card p-5 mb-4">
        <p className="label">PG</p>
        <p className="font-heading font-bold text-xl text-slate-900 dark:text-white">{pg?.name}</p>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">📍 {pg?.address}</p>
        {pg?.contactPhone && <a href={`tel:${pg.contactPhone}`} className="inline-flex items-center gap-1 text-brand-500 text-sm mt-1 hover:underline">📞 {pg.contactPhone}</a>}

        {pg?.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {pg.amenities.map((a, i) => <span key={i} className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2.5 py-1 rounded-lg">{a}</span>)}
          </div>
        )}

        {pg?.rules && <div className="mt-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3 text-sm text-amber-700 dark:text-amber-300">📋 {pg.rules}</div>}
      </div>

      <div className="card p-5 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="label">Room</p>
            <p className="font-heading font-bold text-2xl text-slate-900 dark:text-white">Room {room.roomNumber}</p>
            <div className="flex items-center gap-2 mt-1">
              {room.type && <span className="badge-blue">{room.type}</span>}
              {room.floor && <span className="text-slate-400 text-sm">{room.floor}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="font-heading font-bold text-brand-500 text-xl">₹{room.rent?.toLocaleString()}</p>
            <p className="text-slate-400 text-xs">per month</p>
          </div>
        </div>

        <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Occupancy</span>
          <span>{room.occupancy} / {room.capacity} beds</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
          <div className={`h-2 rounded-full transition-all ${occupancyPct >= 90 ? "bg-red-400" : occupancyPct >= 60 ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${occupancyPct}%` }} />
        </div>
        <p className="text-xs text-slate-400 mt-1">{room.capacity - room.occupancy} bed(s) vacant</p>
      </div>

      <div className="card p-5 mb-4">
        <p className="label mb-3">Roommates ({room.residents?.length || 0})</p>
        {room.residents?.length > 0 ? (
          <div className="space-y-3">
            {room.residents.map((r) => {
              const isMe = r._id === user?._id;
              return (
                <div key={r._id} className={`flex items-center gap-3 p-3 rounded-xl ${isMe ? "bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800" : "bg-slate-50 dark:bg-slate-900/40"}`}>
                  {r.photoUrl
                    ? <img src={r.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                    : <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 shrink-0">{r.name?.charAt(0)}</div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 dark:text-white text-sm">
                      {r.name} {isMe && <span className="text-brand-500 text-xs">(You)</span>}
                    </p>
                    <p className="text-slate-400 text-xs truncate">{r.email}</p>
                    {r.phone && <p className="text-slate-400 text-xs">{r.phone}</p>}
                  </div>
                  {!r.isVerified && <span className="badge-yellow text-xs shrink-0">Guest</span>}
                </div>
              );
            })}
          </div>
        ) : <p className="text-slate-400 text-sm">No roommates yet.</p>}
      </div>

      <div className="card p-5 mb-4">
        <p className="label mb-2">Moving Out?</p>
        {vacateNotice?.requested ? (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/40 rounded-xl p-4">
            <p className="text-amber-800 dark:text-amber-300 text-sm font-medium">
              Vacate notice submitted for {new Date(vacateNotice.plannedDate).toLocaleDateString()}
            </p>
            <p className="text-amber-600 dark:text-amber-400 text-xs mt-1">Your owner has been notified and will process this closer to the date.</p>
            <button onClick={handleCancelNotice} className="btn-secondary text-xs mt-3">Cancel Notice</button>
          </div>
        ) : (
          <form onSubmit={handleVacateNotice} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="label">Planned move-out date</label>
              <input type="date" className="input w-auto" required value={plannedDate}
                min={minVacateDate}
                onChange={(e) => setPlannedDate(e.target.value)} />
            </div>
            <button disabled={submitting} className="btn-primary">{submitting ? "Submitting..." : "Notify Owner"}</button>
            <p className="text-xs text-slate-400 w-full">Must be given at least 30 days before your planned move-out date.</p>
          </form>
        )}
      </div>

      <div className="mt-4">
        <Link to={`/resident/pg-listings/${pg?._id}`} className="text-brand-500 text-sm hover:underline">View public PG listing & reviews →</Link>
      </div>
    </div>
  );
}