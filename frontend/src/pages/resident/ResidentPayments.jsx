import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { payWithRazorpay, downloadInvoice } from "../../services/paymentService";
import { getSession } from "../../services/authService";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function ResidentPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const user = getSession();

  useEffect(() => {
    api.get("/payments/my")
      .then(({ data }) => setPayments(data))
      .catch(() => toast.error("Failed to load payments"))
      .finally(() => setLoading(false));
  }, []);

  const handlePay = async (p) => {
    setPaying(p._id);
    try {
      const updated = await payWithRazorpay(p._id, user);
      setPayments((prev) => prev.map((x) => (x._id === p._id ? { ...x, ...updated } : x)));
      toast.success("Payment successful!");
    } catch (err) {
      if (err.message !== "Payment cancelled") {
        toast.error(err.response?.data?.message || err.message || "Payment failed");
      }
    } finally {
      setPaying(null);
    }
  };

  const handleDownload = async (id) => {
    try {
      await downloadInvoice(id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to download receipt");
    }
  };

  const pending = payments.filter((p) => p.status === "pending");
  const paid = payments.filter((p) => p.status === "paid");

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-slate-900 mb-6">Rent & Payments</h1>

      {payments.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <p className="text-4xl mb-3">💳</p>
          <p className="font-heading font-semibold text-slate-600">No payment records yet</p>
          <p className="text-sm mt-1">Your owner will generate monthly rents for you</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-8">
              <h2 className="font-heading font-semibold text-amber-700 mb-3">Due ({pending.length})</h2>
              <div className="space-y-3">
                {pending.map((p) => (
                  <div key={p._id} className="card p-5 border-amber-200 bg-amber-50">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                      <div>
                        <p className="font-heading font-bold text-slate-900">{p.pg?.name}</p>
                        <p className="text-slate-500 text-sm">Room {p.room?.roomNumber} · {MONTHS[p.month - 1]} {p.year}</p>
                        {p.dueDate && <p className="text-xs text-amber-600 mt-0.5">Due by {new Date(p.dueDate).toLocaleDateString()}</p>}
                        <p className="font-heading text-2xl font-bold text-amber-700 mt-1">₹{p.amount.toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => handlePay(p)}
                        disabled={paying === p._id}
                        className="btn-primary shrink-0"
                      >
                        {paying === p._id ? "Opening..." : "Pay Now →"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {paid.length > 0 && (
            <div>
              <h2 className="font-heading font-semibold text-slate-700 mb-3">History ({paid.length})</h2>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Month</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Room</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Amount</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Method</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Paid On</th>
                      <th className="text-left px-4 py-3 font-semibold text-slate-600">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paid.map((p) => (
                      <tr key={p._id} className="border-b hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-medium text-slate-700">{MONTHS[p.month - 1]} {p.year}</td>
                        <td className="px-4 py-3 text-slate-500">{p.room?.roomNumber}</td>
                        <td className="px-4 py-3 font-semibold">₹{p.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-500 capitalize">{p.paymentMethod || "—"}</td>
                        <td className="px-4 py-3 text-slate-400">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleDownload(p._id)}
                            className="text-brand-500 hover:underline text-xs">📄 Download</button>
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
