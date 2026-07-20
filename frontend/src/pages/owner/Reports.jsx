import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getReportSummary, downloadReportPDF, downloadReportExcel } from "../../services/reportService";

const MONTHS_LABEL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function Reports() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState("");

  useEffect(() => {
    setLoading(true);
    getReportSummary(month, year).then(setSummary).catch(() => toast.error("Failed to load report")).finally(() => setLoading(false));
  }, [month, year]);

  const handleDownload = async (type) => {
    setDownloading(type);
    try {
      if (type === "pdf") await downloadReportPDF(month, year);
      else await downloadReportExcel(month, year);
      toast.success(`${type.toUpperCase()} downloaded`);
    } catch {
      toast.error("Download failed");
    } finally {
      setDownloading("");
    }
  };

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white mb-6">Reports</h1>

      <div className="flex items-center gap-3 mb-6">
        <select className="input w-auto" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {MONTHS_LABEL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <input className="input w-24" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
      </div>

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : summary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "PGs", value: summary.totalPGs, icon: "🏘️" },
              { label: "Rooms", value: summary.totalRooms, icon: "🚪" },
              { label: "Residents", value: summary.totalResidents, icon: "👥" },
              { label: "Occupancy", value: `${summary.occupancyPct}%`, icon: "📈" },
              { label: "Collected", value: `₹${summary.totalCollected.toLocaleString()}`, icon: "💰" },
              { label: "Pending", value: `₹${summary.totalPending.toLocaleString()}`, icon: "⏳" },
              { label: "Open Complaints", value: summary.openComplaints, icon: "⚑" },
              { label: "Total Complaints", value: summary.totalComplaints, icon: "📋" },
            ].map((s) => (
              <div key={s.label} className="card p-4">
                <p className="text-2xl mb-1">{s.icon}</p>
                <p className="font-heading text-xl font-bold text-slate-800 dark:text-white">{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="card p-6">
            <h2 className="font-heading font-semibold text-slate-800 dark:text-white mb-2">Download Full Report</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Includes payments, residents, complaints, and revenue/occupancy summary for {MONTHS_LABEL[month - 1]} {year}.</p>
            <div className="flex gap-3">
              <button disabled={!!downloading} onClick={() => handleDownload("pdf")} className="btn-primary">
                {downloading === "pdf" ? "Preparing..." : "📄 Download PDF"}
              </button>
              <button disabled={!!downloading} onClick={() => handleDownload("excel")} className="btn-secondary">
                {downloading === "excel" ? "Preparing..." : "📊 Download Excel"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
