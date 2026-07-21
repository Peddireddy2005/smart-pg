import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import {
  getPaymentOptions, payWithRazorpay, submitUpiPayment, submitCashPayment, downloadInvoice,
} from "../../services/paymentService";
import { getSession } from "../../services/authService";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_BADGE = {
  paid: "badge-green", pending: "badge-yellow", pending_approval: "badge-purple", rejected: "badge-red", failed: "badge-red",
};
const STATUS_LABEL = {
  paid: "✔ Paid", pending: "Pending", pending_approval: "Awaiting Owner Approval", rejected: "Rejected — Retry", failed: "Failed",
};

// The payment method picker + method-specific submission form, shown as a
// panel under the selected due payment (spec: "Final Payment System").
function PaymentPanel({ payment, onDone, onCancel }) {
  const [options, setOptions] = useState(null);
  const [method, setMethod] = useState(null); // "razorpay" | "upi" | "cash" | null
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const user = getSession();

  // UPI form state
  const [screenshot, setScreenshot] = useState(null);
  const [transactionId, setTransactionId] = useState("");
  const [upiNotes, setUpiNotes] = useState("");

  // Cash form state
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const [cashAmount, setCashAmount] = useState(payment.amount);
  const [cashDate, setCashDate] = useState(new Date().toISOString().slice(0, 10));
  const [cashNotes, setCashNotes] = useState("");

  useEffect(() => {
    getPaymentOptions(payment._id).then(setOptions).catch(() => toast.error("Failed to load payment options")).finally(() => setLoading(false));
  }, [payment._id]);

  const handleRazorpay = async () => {
    setSubmitting(true);
    try {
      const updated = await payWithRazorpay(payment._id, user);
      toast.success("Payment successful!");
      onDone(updated);
    } catch (err) {
      if (err.message !== "Payment cancelled") toast.error(err.response?.data?.message || err.message || "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpiSubmit = async () => {
    if (!screenshot) { toast.error("Please upload a payment screenshot"); return; }
    setSubmitting(true);
    try {
      const updated = await submitUpiPayment(payment._id, { screenshot, transactionId, notes: upiNotes });
      toast.success("Submitted — waiting for owner approval");
      onDone(updated);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCashSubmit = async () => {
    if (!cashConfirmed) { toast.error("Please confirm you paid the owner"); return; }
    setSubmitting(true);
    try {
      const updated = await submitCashPayment(payment._id, { amount: cashAmount, date: cashDate, notes: cashNotes });
      toast.success("Submitted — waiting for owner approval");
      onDone(updated);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="mt-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl p-4 text-sm text-slate-400">Loading payment options...</div>;
  if (!options) return null;

  return (
    <div className="mt-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl p-4">
      {!method && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Choose Payment Method</p>
          <div className="space-y-2">
            {options.methods.razorpay && (
              <button onClick={() => setMethod("razorpay")} className="w-full text-left border border-gray-200 dark:border-slate-700 rounded-xl p-3 hover:border-brand-400 transition bg-white dark:bg-slate-800">
                <p className="font-medium text-sm text-slate-800 dark:text-white">○ Smart PG (Online)</p>
                <p className="text-xs text-slate-400">+ ₹{options.convenienceFee} convenience fee · Auto-verified instantly</p>
              </button>
            )}
            {options.methods.upi && (
              <button onClick={() => setMethod("upi")} className="w-full text-left border border-gray-200 dark:border-slate-700 rounded-xl p-3 hover:border-brand-400 transition bg-white dark:bg-slate-800">
                <p className="font-medium text-sm text-slate-800 dark:text-white">○ Direct UPI</p>
                <p className="text-xs text-slate-400">Pay owner directly, then upload proof for approval</p>
              </button>
            )}
            {options.methods.cash && (
              <button onClick={() => setMethod("cash")} className="w-full text-left border border-gray-200 dark:border-slate-700 rounded-xl p-3 hover:border-brand-400 transition bg-white dark:bg-slate-800">
                <p className="font-medium text-sm text-slate-800 dark:text-white">○ Cash</p>
                <p className="text-xs text-slate-400">Pay in person, then claim it here for owner approval</p>
              </button>
            )}
          </div>
          <button onClick={onCancel} className="btn-secondary text-sm w-full">Cancel</button>
        </div>
      )}

      {method === "razorpay" && (
        <div className="space-y-3">
          <button onClick={() => setMethod(null)} className="text-xs text-slate-400 hover:text-slate-600">← Change method</button>
          <p className="text-sm text-slate-600 dark:text-slate-300">Total: <strong>₹{(payment.amount + options.convenienceFee).toLocaleString()}</strong> (₹{payment.amount.toLocaleString()} rent + ₹{options.convenienceFee} fee)</p>
          <button disabled={submitting} onClick={handleRazorpay} className="btn-primary w-full justify-center">
            {submitting ? "Opening..." : "Pay with Razorpay →"}
          </button>
        </div>
      )}

      {method === "upi" && (
        <div className="space-y-3">
          <button onClick={() => setMethod(null)} className="text-xs text-slate-400 hover:text-slate-600">← Change method</button>

          {options.upi ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400">Owner Name</p>
              <p className="font-semibold text-slate-800 dark:text-white mb-2">{options.upi.ownerName}</p>
              <img src={options.upi.qrDataUrl} alt="UPI QR" className="w-40 h-40 mx-auto rounded-xl border border-gray-100 dark:border-slate-700 mb-2" />
              <p className="text-xs text-slate-400">UPI ID</p>
              <p className="font-mono text-sm text-slate-700 dark:text-slate-200 mb-2">{options.upi.upiId}</p>
              <button type="button" onClick={() => { navigator.clipboard.writeText(options.upi.upiId); toast.success("UPI ID copied"); }} className="btn-secondary text-xs">Copy UPI ID</button>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/40 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-300">
              Your owner hasn't set up a UPI QR code in Smart PG yet. Pay them directly using whatever UPI ID they've shared with you, then upload proof of the transaction below.
            </div>
          )}

          <div>
            <label className="label">Upload Screenshot *</label>
            <input type="file" accept="image/*" className="input" onChange={(e) => setScreenshot(e.target.files?.[0] || null)} />
          </div>
          <div>
            <label className="label">Transaction ID (Optional)</label>
            <input className="input" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
          </div>
          <div>
            <label className="label">Notes (Optional)</label>
            <input className="input" value={upiNotes} onChange={(e) => setUpiNotes(e.target.value)} />
          </div>
          <button disabled={submitting} onClick={handleUpiSubmit} className="btn-primary w-full justify-center">
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      )}

      {method === "cash" && (
        <div className="space-y-3">
          <button onClick={() => setMethod(null)} className="text-xs text-slate-400 hover:text-slate-600">← Change method</button>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input type="checkbox" checked={cashConfirmed} onChange={(e) => setCashConfirmed(e.target.checked)} />
            Did you pay the owner? Yes, I paid cash.
          </label>
          <div>
            <label className="label">Amount</label>
            <input className="input" type="number" min={0} value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} />
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={cashDate} onChange={(e) => setCashDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Notes (Optional)</label>
            <input className="input" placeholder="e.g. Paid to manager at reception" value={cashNotes} onChange={(e) => setCashNotes(e.target.value)} />
          </div>
          <button disabled={submitting || !cashConfirmed} onClick={handleCashSubmit} className="btn-primary w-full justify-center">
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ResidentPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);

  useEffect(() => {
    api.get("/payments/my")
      .then(({ data }) => setPayments(data))
      .catch(() => toast.error("Failed to load payments"))
      .finally(() => setLoading(false));
  }, []);

  const handleDone = (updated) => {
    setPayments((prev) => prev.map((x) => (x._id === updated._id ? { ...x, ...updated } : x)));
    setPayingId(null);
  };

  const handleDownload = async (id) => {
    try {
      await downloadInvoice(id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to download receipt");
    }
  };

  const due = payments.filter((p) => p.status === "pending" || p.status === "pending_approval" || p.status === "rejected");
  const paid = payments.filter((p) => p.status === "paid");

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white mb-6">Rent & Payments</h1>

      {payments.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <p className="text-4xl mb-3">💳</p>
          <p className="font-heading font-semibold text-slate-600 dark:text-slate-300">No payment records yet</p>
          <p className="text-sm mt-1">Your owner will generate monthly rents for you</p>
        </div>
      ) : (
        <>
          {due.length > 0 && (
            <div className="mb-8">
              <h2 className="font-heading font-semibold text-amber-700 dark:text-amber-400 mb-3">Due ({due.length})</h2>
              <div className="space-y-3">
                {due.map((p) => (
                  <div key={p._id} className="card p-5 border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                      <div>
                        <p className="font-heading font-bold text-slate-900 dark:text-white">{p.pg?.name}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Room {p.room?.roomNumber} · {MONTHS[p.month - 1]} {p.year}</p>
                        {p.dueDate && <p className="text-xs text-amber-600 mt-0.5">Due by {new Date(p.dueDate).toLocaleDateString()}</p>}
                        <p className="font-heading text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">₹{p.amount.toLocaleString()}</p>
                        {p.note && <p className="text-xs text-slate-400 mt-0.5">{p.note}</p>}
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          {p.type && p.type !== "rent" && <span className="badge-purple">{p.type === "deposit" ? "Security Deposit" : p.type}</span>}
                          <span className={STATUS_BADGE[p.status]}>{STATUS_LABEL[p.status]}</span>
                        </div>
                        {p.status === "rejected" && p.rejectionReason && <p className="text-xs text-red-500 mt-1">Reason: {p.rejectionReason}</p>}
                      </div>
                      {p.status !== "pending_approval" && (
                        <button onClick={() => setPayingId(payingId === p._id ? null : p._id)} className="btn-primary shrink-0">
                          {payingId === p._id ? "Close" : "Pay Now →"}
                        </button>
                      )}
                    </div>
                    {payingId === p._id && (
                      <PaymentPanel payment={p} onDone={handleDone} onCancel={() => setPayingId(null)} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {paid.length > 0 && (
            <div>
              <h2 className="font-heading font-semibold text-slate-700 dark:text-slate-300 mb-3">History ({paid.length})</h2>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Month</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">PG</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Room</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Type</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Amount</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Method</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Verified</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Paid On</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paid.map((p) => (
                      <tr key={p._id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{MONTHS[p.month - 1]} {p.year}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{p.pg?.name || "—"}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{p.room?.roomNumber}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 capitalize">{p.type === "deposit" ? "Deposit" : "Rent"}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">₹{p.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 capitalize">{p.paymentMethod || "—"}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{p.verifiedBy === "automatic" ? "Automatic" : "By Owner"}</td>
                        <td className="px-4 py-3 text-slate-400">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleDownload(p._id)} className="text-brand-500 hover:underline text-xs">📄 Download</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}