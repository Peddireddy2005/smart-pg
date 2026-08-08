import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FileText, FileSpreadsheet } from "lucide-react";
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
      <h1 className="font-heading text-3xl font-bold text-slate-900 mb-6">Reports</h1>

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
          <div className="card p-5 mb-8">
            <div className="divide-y divide-[#EAF6F3]">
              {[
                { label: "PGs", value: summary.totalPGs },
                { label: "Rooms", value: summary.totalRooms },
                { label: "Residents", value: summary.totalResidents },
                { label: "Occupancy", value: `${summary.occupancyPct}%` },
                { label: "Collected", value: `₹${summary.totalCollected.toLocaleString()}` },
                { label: "Pending", value: `₹${summary.totalPending.toLocaleString()}` },
                { label: "Open complaints", value: summary.openComplaints },
                { label: "Total complaints", value: summary.totalComplaints },
              ].map((s) => (
                <div key={s.label} className="ledger-row">
                  <span className="text-sm text-slate-600">{s.label}</span>
                  <span className="amount font-heading font-semibold text-slate-800 text-lg">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-heading font-semibold text-slate-800 mb-2">Download Full Report</h2>
            <p className="text-sm text-slate-500 mb-4">Includes payments, residents, complaints, and revenue/occupancy summary for {MONTHS_LABEL[month - 1]} {year}.</p>
            <div className="flex gap-3">
              <button disabled={!!downloading} onClick={() => handleDownload("pdf")} className="btn-primary inline-flex items-center gap-1.5">
                <FileText size={15} /> {downloading === "pdf" ? "Preparing..." : "Download PDF"}
              </button>
              <button disabled={!!downloading} onClick={() => handleDownload("excel")} className="btn-secondary inline-flex items-center gap-1.5">
                <FileSpreadsheet size={15} /> {downloading === "excel" ? "Preparing..." : "Download Excel"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}