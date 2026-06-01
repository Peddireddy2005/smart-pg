import { useEffect, useState } from "react";
import api from "../../services/api";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function ResidentPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/payments/my")
      .then(({ data }) => { setPayments(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const payRent = async (id) => {
    console.log("[PAYMENTS] Pay clicked:", id);
    try {
      const { data } = await api.put(`/payments/pay/${id}`);
      setPayments((prev) => prev.map((p) => (p._id === id ? data : p)));
    } catch (err) { alert(err.response?.data?.message || "Failed"); }
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
                  <div key={p._id} className="card p-5 border-amber-200 bg-amber-50 flex justify-between items-center">
                    <div>
                      <p className="font-heading font-bold text-slate-900">{p.pg?.name}</p>
                      <p className="text-slate-500 text-sm">Room {p.room?.roomNumber} · {MONTHS[p.month - 1]} {p.year}</p>
                      <p className="font-heading text-2xl font-bold text-amber-700 mt-1">₹{p.amount.toLocaleString()}</p>
                    </div>
                    <button onClick={() => payRent(p._id)} className="btn-primary">Pay Now</button>
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
                  <thead><tr className="bg-slate-50 border-b">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Month</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Room</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Amount</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Paid On</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  </tr></thead>
                  <tbody>
                    {paid.map((p) => (
                      <tr key={p._id} className="border-b hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-medium text-slate-700">{MONTHS[p.month - 1]} {p.year}</td>
                        <td className="px-4 py-3 text-slate-500">{p.room?.roomNumber}</td>
                        <td className="px-4 py-3 font-semibold">₹{p.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-400">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"}</td>
                        <td className="px-4 py-3"><span className="badge-green">Paid ✓</span></td>
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