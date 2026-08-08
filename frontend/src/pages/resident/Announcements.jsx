import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Megaphone, Droplets, IndianRupee, PartyPopper, Sparkles } from "lucide-react";
import { getMyAnnouncements } from "../../services/announcementService";

const TYPE_ICON = { General: Megaphone, "Water Shutdown": Droplets, "Rent Reminder": IndianRupee, Holiday: PartyPopper, Cleaning: Sparkles };

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyAnnouncements().then(setAnnouncements).catch(() => toast.error("Failed to load announcements")).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-slate-900 mb-6">Announcements</h1>
      {loading ? <p className="text-slate-400">Loading...</p> : announcements.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <Megaphone size={32} className="mx-auto mb-3" strokeWidth={1.5} />
          <p className="font-heading font-semibold text-slate-600">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => {
            const Icon = TYPE_ICON[a.type] || Megaphone;
            return (
              <div key={a._id} className="card p-5">
                <p className="font-semibold text-slate-800 flex items-center gap-2"><Icon size={16} className="text-brand-500" /> {a.title}</p>
                <p className="text-sm text-slate-500 mt-1">{a.message}</p>
                <p className="text-xs text-slate-400 mt-2">{new Date(a.createdAt).toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}