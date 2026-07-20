import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import {
  recordOfflinePayment, downloadInvoice, getOwnerPaymentRequests,
  approvePaymentRequest, rejectPaymentRequest,
} from "../../services/paymentService";

const MONTHS_LABEL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function OwnerPayments() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(null);
  const [offlineMethod, setOfflineMethod] = useState("cash");
  const [offlineNote, setOfflineNote] = useState("");
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: d }, reqs] = await Promise.all([
        api.get(`/payments/owner/summary?month=${month}&year=${year}`),
        getOwnerPaymentRequests(),
      ]);
      setData(d);
      setRequests(reqs);
    } catch {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month, year]); // eslint-disable-line

  const handleApprove = async (id) => {
    try {
      await approvePaymentRequest(id);
      setRequests((prev) => prev.filter((r) => r._id !== id));
      toast.success("Payment approved");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleReject = async () => {
    try {
      await rejectPaymentRequest(rejecting, rejectReason);
      setRequests((prev) => prev.filter((r) => r._id !== rejecting));
      toast.success("Payment rejected");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setRejecting(null);
      setRejectReason("");
    }
  };

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
      <div className="flex justify-between items-center flex-wrap gap-3 mb-6">
        <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">Payments</h1>
        <Link to="/owner/settings" className="btn-secondary text-sm">⚙️ Payment Settings</Link>
      </div>

      {/* Payment Requests — UPI/cash claims awaiting approval */}
      {requests.length > 0 && (
        <div className="card p-5 mb-6 border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-900/10">
          <h2 className="font-heading font-bold text-lg text-slate-900 dark:text-white mb-4">Payment Requests ({requests.length})</h2>
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r._id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    {r.resident?.photoUrl
                      ? <img src={r.resident.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                      : <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-sm text-slate-500">{r.resident?.name?.charAt(0)}</div>
                    }
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white text-sm">{r.resident?.name}</p>
                      <p className="text-xs text-slate-400">{r.pg?.name} · Room {r.room?.roomNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge-purple uppercase">{r.paymentMethod}</span>
                    <span className="font-heading font-bold text-slate-800 dark:text-white">₹{(r.paymentMethod === "cash" ? r.cashAmount : r.amount)?.toLocaleString()}</span>
                  </div>
                </div>

                {r.paymentMethod === "upi" && (
                  <div className="mt-3 flex items-center gap-3">
                    <a href={r.upiScreenshotUrl} target="_blank" rel="noopener noreferrer">
                      <img src={r.upiScreenshotUrl} alt="Screenshot" className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-slate-700" />
                    </a>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {r.upiTransactionId ? <p>Txn ID: <span className="font-mono">{r.upiTransactionId}</span></p> : <p>No transaction ID provided</p>}
                      <p className="text-brand-500">Screenshot attached ↗</p>
                    </div>
                  </div>
                )}
                {r.paymentMethod === "cash" && (
                  <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    <p>Claimed paid on {r.cashPaymentDate ? new Date(r.cashPaymentDate).toLocaleDateString() : "-"}</p>
                    {r.cashNote && <p>Note: {r.cashNote}</p>}
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleApprove(r._id)} className="btn-primary text-sm">✓ Approve</button>
                  <button onClick={() => setRejecting(r._id)} className="btn-danger text-sm">✕ Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <select className="input w-auto" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {MONTHS_LABEL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <input className="input w-24" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
      </div>

      {data && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card p-5 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/40">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Collected</p>
            <p className="font-heading text-2xl font-bold text-emerald-600">₹{data.totalPaid.toLocaleString()}</p>
          </div>
          <div className="card p-5 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/40">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Pending</p>
            <p className="font-heading text-2xl font-bold text-amber-600">₹{data.totalPending.toLocaleString()}</p>
          </div>
          <div className="card p-5 bg-slate-50 dark:bg-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Records</p>
            <p className="font-heading text-2xl font-bold text-slate-700 dark:text-slate-200">{data.payments.length}</p>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : Object.keys(byRoom).length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <p className="text-4xl mb-3">💳</p>
          <p className="font-heading font-semibold text-slate-600 dark:text-slate-300">No payment records for this period</p>
          <p className="text-sm mt-1">Go to a PG page and use "Generate Rent Records" to create them.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byRoom).map(([key, payments]) => (
            <div key={key} className="card overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-800 px-5 py-3 border-b dark:border-slate-700">
                <h3 className="font-heading font-semibold text-slate-700 dark:text-slate-200">{key}</h3>
              </div>
              {payments.map((p) => (
                <div key={p._id} className="px-5 py-3 border-b dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      {p.resident?.photoUrl
                        ? <img src={p.resident.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                        : <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 text-sm font-bold">{p.resident?.name?.charAt(0)}</div>
                      }
                      <div>
                        <p className="font-medium text-sm text-slate-800 dark:text-white">{p.resident?.name}</p>
                        <p className="text-xs text-slate-400">{p.resident?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">₹{p.amount.toLocaleString()}</span>
                      {p.paymentMethod && p.status === "paid" && <span className="text-xs text-slate-400 capitalize">{p.paymentMethod}</span>}
                      <span className={p.status === "paid" ? "badge-green" : p.status === "pending_approval" ? "badge-purple" : p.status === "rejected" ? "badge-red" : "badge-yellow"}>
                        {p.status === "paid" ? "✔ Paid" : p.status === "pending_approval" ? "Awaiting Approval" : p.status === "rejected" ? "Rejected" : "✘ Pending"}
                      </span>
                      {p.status === "paid" ? (
                        <button onClick={() => handleDownloadInvoice(p._id)} className="text-xs text-brand-500 hover:underline shrink-0">📄 Receipt</button>
                      ) : p.status === "pending" ? (
                        <button onClick={() => setRecording(p._id)} className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg transition shrink-0">Record</button>
                      ) : null}
                    </div>
                  </div>

                  {recording === p._id && (
                    <div className="mt-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl p-4 space-y-3">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Record Offline Payment</p>
                      <div className="flex gap-3">
                        <select className="input text-sm" value={offlineMethod} onChange={(e) => setOfflineMethod(e.target.value)}>
                          <option value="cash">Cash</option>
                          <option value="upi">UPI</option>
                          <option value="bank_transfer">Bank Transfer</option>
                        </select>
                        <input className="input text-sm flex-1" placeholder="Note (optional)" value={offlineNote} onChange={(e) => setOfflineNote(e.target.value)} />
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

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setRejecting(null)}>
          <div className="card p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white mb-3">Reject this claim?</h3>
            <textarea className="input mb-4" rows={3} placeholder="Reason (optional)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRejecting(null)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={handleReject} className="btn-danger text-sm">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
