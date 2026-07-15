import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { recordOfflinePayment, downloadInvoice } from "../../services/paymentService";

const MONTHS_LABEL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function OwnerPayments() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(null);
  const [offlineMethod, setOfflineMethod] = useState("cash");
  const [offlineNote, setOfflineNote] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data: d } = await api.get(`/payments/owner/summary?month=${month}&year=${year}`);
      setData(d);
    } catch {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month, year]); // eslint-disable-line

  const handleRecordOffline = async (paymentId) => {
    try {
      const updated = await recordOfflinePayment(paymentId, offlineMethod, offlineNote);
      setData((prev) => ({
        ...prev,
        payments: prev.payments.map((p) => (p._id === paymentId ? { ...p, ...updated } : p)),
        totalPaid: prev.totalPaid + updated.amount,
        totalPending: prev.totalPending - updated.amount,
      }));
      toast.success("Payment recorded");
      setRecording(null);
      setOfflineNote("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleDownloadInvoice = async (id) => {
    try {
      await downloadInvoice(id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to download");
    }
  };

  const byRoom = (data?.payments || []).reduce((acc, p) => {
    const key = `${p.pg?.name || ""} — Room ${p.room?.roomNumber || "?"}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-slate-900 mb-6">Payments</h1>

      <div className="flex items-center gap-3 mb-6">
        <select className="input w-auto" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {MONTHS_LABEL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <input className="input w-24" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
      </div>

      {data && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card p-5 bg-emerald-50 border-emerald-200">
            <p className="text-xs text-slate-500 mb-1">Collected</p>
            <p className="font-heading text-2xl font-bold text-emerald-600">₹{data.totalPaid.toLocaleString()}</p>
          </div>
          <div className="card p-5 bg-amber-50 border-amber-200">
            <p className="text-xs text-slate-500 mb-1">Pending</p>
            <p className="font-heading text-2xl font-bold text-amber-600">₹{data.totalPending.toLocaleString()}</p>
          </div>
          <div className="card p-5 bg-slate-50">
            <p className="text-xs text-slate-500 mb-1">Total Records</p>
            <p className="font-heading text-2xl font-bold text-slate-700">{data.payments.length}</p>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : Object.keys(byRoom).length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <p className="text-4xl mb-3">💳</p>
          <p className="font-heading font-semibold text-slate-600">No payment records for this period</p>
          <p className="text-sm mt-1">Go to a PG page and use "Generate Rent Records" to create them.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byRoom).map(([key, payments]) => (
            <div key={key} className="card overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b">
                <h3 className="font-heading font-semibold text-slate-700">{key}</h3>
              </div>
              {payments.map((p) => (
                <div key={p._id} className="px-5 py-3 border-b last:border-0 hover:bg-slate-50 transition">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {p.resident?.photoUrl
                        ? <img src={p.resident.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                        : <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm font-bold">{p.resident?.name?.charAt(0)}</div>
                      }
                      <div>
                        <p className="font-medium text-sm text-slate-800">{p.resident?.name}</p>
                        <p className="text-xs text-slate-400">{p.resident?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-700">₹{p.amount.toLocaleString()}</span>
                      {p.paymentMethod && p.status === "paid" && (
                        <span className="text-xs text-slate-400 capitalize">{p.paymentMethod}</span>
                      )}
                      <span className={p.status === "paid" ? "badge-green" : "badge-yellow"}>
                        {p.status === "paid" ? "✔ Paid" : "✘ Pending"}
                      </span>
                      {p.status === "paid" ? (
                        <button onClick={() => handleDownloadInvoice(p._id)}
                          className="text-xs text-brand-500 hover:underline shrink-0">
                          📄 Receipt
                        </button>
                      ) : (
                        <button onClick={() => setRecording(p._id)}
                          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-lg transition shrink-0">
                          Record
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline offline recording form */}
                  {recording === p._id && (
                    <div className="mt-3 bg-slate-50 rounded-xl p-4 space-y-3">
                      <p className="text-sm font-medium text-slate-700">Record Offline Payment</p>
                      <div className="flex gap-3">
                        <select className="input text-sm" value={offlineMethod} onChange={(e) => setOfflineMethod(e.target.value)}>
                          <option value="cash">Cash</option>
                          <option value="upi">UPI</option>
                          <option value="bank_transfer">Bank Transfer</option>
                        </select>
                        <input className="input text-sm flex-1" placeholder="Note (optional)"
                          value={offlineNote} onChange={(e) => setOfflineNote(e.target.value)} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleRecordOffline(p._id)} className="btn-primary text-sm">Confirm Received</button>
                        <button onClick={() => { setRecording(null); setOfflineNote(""); }} className="btn-secondary text-sm">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
