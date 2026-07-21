import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getOwnerVacatedResidents } from "../../services/roomService";

export default function VacatedResidents() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOwnerVacatedResidents().then(setResidents).catch(() => toast.error("Failed to load")).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white mb-2">Vacated Residents</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Residents who've moved out — their details are kept for reference.</p>

      {loading ? <p className="text-slate-400">Loading...</p> : residents.length === 0 ? (
        <p className="text-slate-400">No one has vacated yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {residents.map((r) => (
            <div key={r._id} className="card p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <Link to={`/owner/resident/${r._id}`} className="flex items-center gap-3 min-w-0 group">
                  {r.photoUrl
                    ? <img src={r.photoUrl} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
                    : <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 shrink-0">{r.name?.charAt(0)}</div>}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-slate-800 dark:text-white group-hover:text-brand-500 transition truncate">{r.name}</p>
                    <p className="text-xs text-slate-400 truncate">{r.email} {r.phone && `· ${r.phone}`}</p>
                  </div>
                </Link>
                <span className="badge-gray shrink-0">Vacated</span>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                <p>{r.lastPG?.name} {r.lastRoom?.roomNumber ? `· Room ${r.lastRoom.roomNumber}` : ""} {r.lastPG?.city ? `· ${r.lastPG.city}` : ""}</p>
                <p>Moved in {r.moveInDate ? new Date(r.moveInDate).toLocaleDateString() : "—"} → Vacated {new Date(r.moveOutDate).toLocaleDateString()}</p>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border-t border-gray-100 dark:border-slate-700 pt-3">
                <div>
                  <p className="text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Emergency Contact</p>
                  <p className="text-slate-700 dark:text-slate-300">{r.emergencyContact || "—"} {r.emergencyPhone ? `(${r.emergencyPhone})` : ""}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase tracking-wide font-semibold mb-0.5">ID Proof</p>
                  <p className="text-slate-700 dark:text-slate-300">{r.idProofType ? `${r.idProofType} · ${r.idProofNumber || "—"}` : "Not provided"}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Address</p>
                  <p className="text-slate-700 dark:text-slate-300">{r.address || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Occupation</p>
                  <p className="text-slate-700 dark:text-slate-300">{r.occupation || r.company || r.college || "—"}</p>
                </div>
              </div>

              <Link to={`/owner/resident/${r._id}`} className="text-brand-500 text-xs mt-3 inline-block hover:underline">
                View full profile →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}