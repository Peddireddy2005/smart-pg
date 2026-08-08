import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getActivityLogs } from "../../services/activityLogService";

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getActivityLogs(page)
      .then((data) => { setLogs(data.logs); setTotalPages(data.totalPages); })
      .catch(() => toast.error("Failed to load activity logs"))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-slate-900 mb-6">Activity Logs</h1>

      {loading ? <p className="text-slate-400">Loading...</p> : logs.length === 0 ? (
        <p className="text-slate-400">No activity recorded yet.</p>
      ) : (
        <div className="card overflow-hidden">
          {logs.map((log) => (
            <div key={log._id} className="px-5 py-3 border-b last:border-0 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-slate-800">{log.action}</p>
                {log.details && <p className="text-xs text-slate-500">{log.details}</p>}
                <p className="text-xs text-slate-400 mt-0.5">by {log.actor?.name || "System"} ({log.actor?.role || "-"})</p>
              </div>
              <p className="text-xs text-slate-400 shrink-0 ml-3">{new Date(log.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition ${page === i + 1 ? "bg-brand-500 text-white" : "bg-white border border-gray-200 text-slate-600"}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}