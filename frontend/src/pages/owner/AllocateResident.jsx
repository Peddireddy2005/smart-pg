import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";

export default function AllocateResident() {
  const { pgId } = useParams();

  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [form, setForm] = useState({
    residentEmail: "",
    residentName: "",
  });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [roomsLoaded, setRoomsLoaded] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        console.log("[ALLOCATE] Loading rooms for PG:", pgId);

        const { data } = await api.get(`/rooms/${pgId}`);

        setRooms(
          data.filter((r) => r.occupancy < r.capacity)
        );
      } catch (err) {
        console.error("Failed to load rooms:", err);
      } finally {
        setRoomsLoaded(true);
      }
    };

    fetchRooms();
  }, [pgId]);

  const submit = async (e) => {
    e.preventDefault();

    if (!selectedRoom) {
      setMsg({
        type: "error",
        text: "Please select a room",
      });
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      await api.post(
        `/rooms/${selectedRoom}/allocate`,
        form
      );

      setMsg({
        type: "success",
        text: `✓ ${form.residentEmail} has been assigned successfully!`,
      });

      setForm({
        residentEmail: "",
        residentName: "",
      });

      // Refresh room list after allocation
      const { data } = await api.get(`/rooms/${pgId}`);
      setRooms(
        data.filter((r) => r.occupancy < r.capacity)
      );
    } catch (err) {
      setMsg({
        type: "error",
        text:
          err.response?.data?.message || "Failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-8">
        <Link
          to={`/owner/pg/${pgId}`}
          className="text-slate-400 hover:text-slate-600 text-sm"
        >
          ← Back to PG
        </Link>

        <h1 className="font-heading text-2xl font-bold text-slate-900">
          Allocate Resident
        </h1>
      </div>

      <div className="card p-6 mb-4 bg-amber-50 border-amber-200">
        <p className="text-amber-800 text-sm font-medium">
          💡 Tip
        </p>
        <p className="text-amber-700 text-sm mt-1">
          If the resident is not registered yet,
          enter their email and name to add them
          as a guest.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="card p-6 space-y-4"
      >
        {msg && (
          <div
            className={`text-sm rounded-xl px-4 py-3 ${
              msg.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {msg.text}
          </div>
        )}

        <div>
          <label className="label">
            Select Room *
          </label>

          <select
            className="input"
            value={selectedRoom}
            onChange={(e) =>
              setSelectedRoom(e.target.value)
            }
          >
            <option value="">
              -- Select available room --
            </option>

            {rooms.map((r) => (
              <option key={r._id} value={r._id}>
                Room {r.roomNumber} (
                {r.type || "Standard"}) —{" "}
                {r.occupancy}/{r.capacity} occupied — ₹
                {r.rent}/mo
              </option>
            ))}
          </select>

          {roomsLoaded && rooms.length === 0 && (
            <p className="text-amber-600 text-xs mt-1">
              No available rooms in this PG.
            </p>
          )}
        </div>

        <div>
          <label className="label">
            Resident Email *
          </label>
          <input
            className="input"
            type="email"
            required
            placeholder="resident@email.com"
            value={form.residentEmail}
            onChange={(e) =>
              setForm({
                ...form,
                residentEmail:
                  e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className="label">
            Resident Name
          </label>
          <input
            className="input"
            placeholder="Full name"
            value={form.residentName}
            onChange={(e) =>
              setForm({
                ...form,
                residentName:
                  e.target.value,
              })
            }
          />
        </div>

        <button
          disabled={loading}
          className="btn-primary w-full justify-center"
        >
          {loading
            ? "Assigning..."
            : "Assign Resident"}
        </button>
      </form>
    </div>
  );
}