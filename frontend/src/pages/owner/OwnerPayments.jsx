import { useEffect, useState } from "react";
import api from "../../services/api";

export default function OwnerPayments() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchPayments = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(
        `/payments/owner/summary?month=${month}&year=${year}`
      );

      setData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  fetchPayments();
}, [month, year]);

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
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString("default", { month: "long" })}</option>
          ))}
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

      {loading ? <p className="text-slate-400">Loading...</p> : Object.keys(byRoom).length === 0 ? (
        <p className="text-slate-400">No payment records for this period.</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(byRoom).map(([key, payments]) => (
            <div key={key} className="card overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b">
                <h3 className="font-heading font-semibold text-slate-700">{key}</h3>
              </div>
              {payments.map((p) => (
                <div key={p._id} className="px-5 py-3 flex justify-between items-center border-b last:border-0 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    {p.resident?.photoUrl ? <img src={p.resident.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover" /> :
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm font-bold">{p.resident?.name?.charAt(0)}</div>}
                    <div>
                      <p className="font-medium text-sm text-slate-800">{p.resident?.name}</p>
                      <p className="text-xs text-slate-400">{p.resident?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-slate-700">₹{p.amount.toLocaleString()}</span>
                    <span className={p.status === "paid" ? "badge-green" : "badge-yellow"}>
                      {p.status === "paid" ? "✔ Paid" : "✘ Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}