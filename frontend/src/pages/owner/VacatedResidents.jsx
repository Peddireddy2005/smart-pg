import { useEffect, useState } from "react";
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
        <div className="card overflow-hidden">
          {residents.map((r) => (
            <div key={r._id} className="px-5 py-3 border-b dark:border-slate-700 last:border-0 flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-3">
                {r.photoUrl
                  ? <img src={r.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                  : <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500">{r.name?.charAt(0)}</div>}
                <div>
                  <p className="font-medium text-sm text-slate-800 dark:text-white">{r.name}</p>
                  <p className="text-xs text-slate-400">{r.email} {r.phone && `· ${r.phone}`}</p>
                </div>
              </div>
              <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                <p>{r.lastPG?.name} {r.lastRoom?.roomNumber ? `· Room ${r.lastRoom.roomNumber}` : ""}</p>
                <p>Moved in {r.moveInDate ? new Date(r.moveInDate).toLocaleDateString() : "—"} → Vacated {new Date(r.moveOutDate).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}