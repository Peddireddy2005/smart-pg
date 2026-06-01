import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function OwnerDashboard() {
  const [pgs, setPGs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        console.log(
          "[OWNER DASHBOARD] Loading for:",
          user?.email
        );

        const [p, s] = await Promise.all([
          api.get("/pg/owner"),
          api.get("/pg/owner/stats"),
        ]);

        setPGs(p.data);
        setStats(s.data);
      } catch (err) {
        console.error(
          "Failed to load owner dashboard:",
          err
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user?.email]);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900">
            Good morning, {user?.name?.split(" ")[0]} 👋
          </h1>

          <p className="text-slate-500 mt-1">
            Here's what's happening with your PGs today
          </p>
        </div>

        <Link
          to="/owner/add-pg"
          className="btn-primary"
        >
          + Add PG
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            {
              label: "My PGs",
              value: stats.totalPGs,
              color: "text-brand-500",
              bg: "bg-brand-50",
              icon: "🏘️",
            },
            {
              label: "Total Rooms",
              value: stats.totalRooms,
              color: "text-blue-600",
              bg: "bg-blue-50",
              icon: "🚪",
            },
            {
              label: "Residents",
              value: stats.totalResidents,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
              icon: "👥",
            },
            {
              label: "Pending Rents",
              value: stats.pendingPayments,
              color: "text-amber-600",
              bg: "bg-amber-50",
              icon: "₹",
            },
            {
              label: "Open Issues",
              value: stats.openComplaints,
              color: "text-red-500",
              bg: "bg-red-50",
              icon: "⚑",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`card p-4 ${s.bg} border-0`}
            >
              <div className="text-2xl mb-2">
                {s.icon}
              </div>

              <p
                className={`font-heading text-2xl font-bold ${s.color}`}
              >
                {s.value}
              </p>

              <p className="text-slate-500 text-xs mt-1">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}

      <h2 className="font-heading font-bold text-xl text-slate-900 mb-4">
        My PGs
      </h2>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="card p-5 h-32 animate-pulse bg-gray-100"
            />
          ))}
        </div>
      ) : pgs.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <p className="text-5xl mb-4">🏘️</p>
          <p className="font-heading font-semibold text-slate-600 text-lg">
            No PGs yet
          </p>
          <p className="text-sm mt-1 mb-6">
            Start by adding your first PG listing
          </p>

          <Link
            to="/owner/add-pg"
            className="btn-primary"
          >
            + Add Your First PG
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {pgs.map((pg) => (
            <Link
              key={pg._id}
              to={`/owner/pg/${pg._id}`}
              className="card p-5 group block hover:border-brand-200"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-heading font-semibold text-slate-900 group-hover:text-brand-500 transition">
                  {pg.name}
                </h3>

                <span
                  className={
                    pg.availableRooms > 0
                      ? "badge-green"
                      : "badge-red"
                  }
                >
                  {pg.availableRooms} vacant
                </span>
              </div>

              <p className="text-slate-500 text-sm mb-3">
                📍 {pg.city}
              </p>

              <div className="flex gap-4 text-sm text-slate-500">
                <span>
                  🚪 {pg.totalRooms} rooms
                </span>

                <span>
                  👥 {pg.totalResidents} residents
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}