import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getOwnerVisitors, approveVisitor, logVisitorEvent } from "../../services/visitorService";

const STATUS_STYLES = { pending: "badge-yellow", approved: "badge-blue", rejected: "badge-red", entered: "badge-green", exited: "badge-gray" };

export default function Visitors() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getOwnerVisitors().then(setVisitors).catch(() => toast.error("Failed to load visitors")).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id, approve) => {
    try {
      const updated = await approveVisitor(id, approve);
      setVisitors((prev) => prev.map((v) => (v._id === id ? { ...v, ...updated } : v)));
      toast.success(approve ? "Visitor approved" : "Visitor rejected");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleEvent = async (v, event) => {
    try {
      const updated = await logVisitorEvent(v.qrToken, event);
      setVisitors((prev) => prev.map((x) => (x._id === v._id ? { ...x, ...updated } : x)));
      toast.success(event === "entry" ? "Entry logged" : "Exit logged");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white mb-6">Visitor Management</h1>

      {loading ? <p className="text-slate-400">Loading...</p> : visitors.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <p className="text-4xl mb-3">🚪</p>
          <p className="font-heading font-semibold text-slate-600 dark:text-slate-300">No visitor requests yet</p>
          <p className="text-sm mt-1">Residents can invite visitors from their dashboard.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visitors.map((v) => (
            <div key={v._id} className="card p-5 flex justify-between items-center flex-wrap gap-3">
              <div>
                <p className="font-semibold text-slate-800 dark:text-white">{v.name} <span className={STATUS_STYLES[v.status]}>{v.status}</span></p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{v.purpose || "No purpose given"} · Invited by {v.resident?.name}</p>
                <p className="text-xs text-slate-400 mt-1">{v.pg?.name} · {new Date(v.createdAt).toLocaleString()}</p>
                {v.entryTime && <p className="text-xs text-emerald-600">Entered: {new Date(v.entryTime).toLocaleString()}</p>}
                {v.exitTime && <p className="text-xs text-slate-500">Exited: {new Date(v.exitTime).toLocaleString()}</p>}
              </div>
              <div className="flex gap-2">
                {v.status === "pending" && (
                  <>
                    <button onClick={() => handleApprove(v._id, true)} className="btn-primary text-xs">Approve</button>
                    <button onClick={() => handleApprove(v._id, false)} className="btn-danger text-xs">Reject</button>
                  </>
                )}
                {v.status === "approved" && <button onClick={() => handleEvent(v, "entry")} className="btn-secondary text-xs">Log Entry</button>}
                {v.status === "entered" && <button onClick={() => handleEvent(v, "exit")} className="btn-secondary text-xs">Log Exit</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
