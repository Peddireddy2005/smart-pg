import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import api from "../../services/api";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function OwnerAnalytics() {
  const [trend, setTrend] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/pg/owner/revenue-trend"), api.get("/pg/owner/stats")])
      .then(([t, s]) => {
        setTrend(t.data.map((d) => ({ ...d, label: `${MONTHS[d.month - 1]} '${String(d.year).slice(2)}` })));
        setStats(s.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalCollected = trend.reduce((s, t) => s + t.collected, 0);
  const totalPending = trend.reduce((s, t) => s + t.pending, 0);
  const collectionRate = totalCollected + totalPending > 0
    ? Math.round((totalCollected / (totalCollected + totalPending)) * 100)
    : 0;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-slate-900 mb-6">Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4 bg-emerald-50 border-0">
          <p className="text-2xl mb-1">💰</p>
          <p className="font-heading text-xl font-bold text-emerald-600">₹{totalCollected.toLocaleString()}</p>
          <p className="text-slate-500 text-xs mt-1">Collected (6 mo)</p>
        </div>
        <div className="card p-4 bg-amber-50 border-0">
          <p className="text-2xl mb-1">⏳</p>
          <p className="font-heading text-xl font-bold text-amber-600">₹{totalPending.toLocaleString()}</p>
          <p className="text-slate-500 text-xs mt-1">Pending (6 mo)</p>
        </div>
        <div className="card p-4 bg-blue-50 border-0">
          <p className="text-2xl mb-1">📈</p>
          <p className="font-heading text-xl font-bold text-blue-600">{collectionRate}%</p>
          <p className="text-slate-500 text-xs mt-1">Collection Rate</p>
        </div>
        <div className="card p-4 bg-brand-50 border-0">
          <p className="text-2xl mb-1">🏘️</p>
          <p className="font-heading text-xl font-bold text-brand-600">{stats?.totalResidents ?? 0}</p>
          <p className="text-slate-500 text-xs mt-1">Active Residents</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-heading font-semibold text-slate-800 mb-4">Revenue — Last 6 Months</h2>
        {trend.every((t) => t.collected === 0 && t.pending === 0) ? (
          <p className="text-slate-400 text-sm py-12 text-center">No payment data yet. Generate rent for a month to see trends here.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="collected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="pending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
              <Legend />
              <Area type="monotone" dataKey="collected" name="Collected" stroke="#16a34a" fill="url(#collected)" strokeWidth={2} />
              <Area type="monotone" dataKey="pending" name="Pending" stroke="#f59e0b" fill="url(#pending)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
