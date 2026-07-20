import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getMyAnnouncements } from "../../services/announcementService";

const TYPE_ICON = { General: "📣", "Water Shutdown": "🚰", "Rent Reminder": "₹", Holiday: "🎉", Cleaning: "🧹" };

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyAnnouncements().then(setAnnouncements).catch(() => toast.error("Failed to load announcements")).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white mb-6">Announcements</h1>
      {loading ? <p className="text-slate-400">Loading...</p> : announcements.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <p className="text-4xl mb-3">📣</p>
          <p className="font-heading font-semibold text-slate-600 dark:text-slate-300">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a._id} className="card p-5">
              <p className="font-semibold text-slate-800 dark:text-white">{TYPE_ICON[a.type] || "📣"} {a.title}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{a.message}</p>
              <p className="text-xs text-slate-400 mt-2">{new Date(a.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
