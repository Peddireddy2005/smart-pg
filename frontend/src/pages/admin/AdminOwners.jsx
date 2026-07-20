import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getAllOwners, setAccountActive } from "../../services/adminService";

export default function AdminOwners() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllOwners().then(setOwners).catch(() => toast.error("Failed to load owners")).finally(() => setLoading(false));
  }, []);

  const toggleActive = async (o) => {
    try {
      const updated = await setAccountActive(o._id, !o.isActive);
      setOwners((prev) => prev.map((x) => (x._id === o._id ? { ...x, isActive: updated.isActive } : x)));
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white mb-6">Owners</h1>
      {loading ? <p className="text-slate-400">Loading...</p> : (
        <div className="card overflow-hidden">
          {owners.map((o) => (
            <div key={o._id} className="px-5 py-3 border-b dark:border-slate-700 last:border-0 flex justify-between items-center">
              <div>
                <p className="font-medium text-sm text-slate-800 dark:text-white">{o.name} {o.businessName ? `— ${o.businessName}` : ""}</p>
                <p className="text-xs text-slate-400">{o.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={o.isActive ? "badge-green" : "badge-red"}>{o.isActive ? "Active" : "Suspended"}</span>
                <button onClick={() => toggleActive(o)} className="btn-secondary text-xs">{o.isActive ? "Suspend" : "Reactivate"}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
