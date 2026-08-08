import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { KeyRound, Users, Building2, DoorOpen, IndianRupee } from "lucide-react";
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
      <h1 className="font-heading text-3xl font-bold text-slate-900 mb-2">Platform Overview</h1>
      <p className="text-slate-500 mb-6 text-sm">Read-only visibility across every owner and PG on Smart PG.</p>

      <div className="card p-5">
        <div className="divide-y divide-[#EAF6F3]">
          {[
            { label: "Owners", value: stats.totalOwners, icon: KeyRound },
            { label: "Residents", value: stats.totalResidents, icon: Users },
            { label: "PGs", value: stats.totalPGs, icon: Building2 },
            { label: "Rooms", value: stats.totalRooms, icon: DoorOpen },
            { label: "Total Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee },
          ].map((s) => (
            <div key={s.label} className="ledger-row">
              <span className="flex items-center gap-2.5 text-sm text-slate-600"><s.icon size={17} className="text-slate-400" /> {s.label}</span>
              <span className="amount font-heading font-semibold text-slate-800 text-lg">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}