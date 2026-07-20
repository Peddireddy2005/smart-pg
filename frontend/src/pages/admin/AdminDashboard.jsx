import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getPlatformStats } from "../../services/adminService";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlatformStats().then(setStats).catch(() => toast.error("Failed to load stats")).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white mb-2">Platform Overview</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Read-only visibility across every owner and PG on Smart PG.</p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Owners", value: stats.totalOwners, icon: "🔑" },
          { label: "Residents", value: stats.totalResidents, icon: "👥" },
          { label: "PGs", value: stats.totalPGs, icon: "🏘️" },
          { label: "Rooms", value: stats.totalRooms, icon: "🚪" },
          { label: "Total Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, icon: "💰" },
        ].map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-2xl mb-2">{s.icon}</p>
            <p className="font-heading text-2xl font-bold text-slate-800 dark:text-white">{s.value}</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
