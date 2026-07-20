import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getAllPGsAdmin } from "../../services/adminService";

export default function AdminPGs() {
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllPGsAdmin().then(setPgs).catch(() => toast.error("Failed to load PGs")).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white mb-6">All PGs</h1>
      {loading ? <p className="text-slate-400">Loading...</p> : (
        <div className="grid md:grid-cols-2 gap-4">
          {pgs.map((pg) => (
            <div key={pg._id} className="card p-5">
              <p className="font-heading font-bold text-slate-900 dark:text-white">{pg.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">📍 {pg.city}</p>
              <p className="text-xs text-slate-400 mt-1">Owner: {pg.owner?.name} ({pg.owner?.email})</p>
              <span className={pg.isActive ? "badge-green mt-2 inline-block" : "badge-gray mt-2 inline-block"}>{pg.isActive ? "Listed" : "Hidden"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
