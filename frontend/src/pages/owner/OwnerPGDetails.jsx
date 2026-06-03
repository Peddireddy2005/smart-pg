import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../services/api";

export default function OwnerPGDetails() {
  const { id } = useParams();

  const [pg, setPG] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [tab, setTab] = useState("rooms");

  const loadRooms = useCallback(async () => {
    try {
      const { data } = await api.get(`/rooms/${id}`);
      console.log("[PG DETAILS] Rooms:", data.length);
      setRooms(data);
    } catch (err) {
      console.error("Failed to load rooms:", err);
    }
  }, [id]);

  useEffect(() => {
    const fetchPG = async () => {
      try {
        console.log("[PG DETAILS] Loading:", id);

        const { data } = await api.get(`/pg/${id}`);
        setPG(data);

        await loadRooms();
      } catch (err) {
        console.error("Failed to load PG:", err);
      }
    };

    fetchPG();
  }, [id, loadRooms]);

  const removeResident = async (roomId, residentId) => {
    if (!window.confirm("Remove this resident?")) return;

    try {
      const { data } = await api.post(`/rooms/${roomId}/remove`, {
        residentId,
      });

      setRooms((prev) =>
        prev.map((room) =>
          room._id === roomId ? data : room
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    }
  };
  const deleteRoom = async (roomId) => {
  if (!window.confirm("Delete room?")) return;

  try {
    await api.delete(`/rooms/${roomId}`);

    setRooms((prev) =>
      prev.filter((room) => room._id !== roomId)
    );
  } catch (err) {
    alert(
      err.response?.data?.message ||
      "Failed to delete room"
    );
  }
 };

  if (!pg) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const totalResidents = rooms.reduce(
    (sum, room) => sum + room.occupancy,
    0
  );

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link
            to="/owner/dashboard"
            className="text-slate-400 hover:text-slate-600 text-sm block mb-2"
          >
            ← All PGs
          </Link>

          <h1 className="font-heading text-3xl font-bold text-slate-900">
            {pg.name}
          </h1>

          <p className="text-slate-500">
            📍 {pg.locality ? `${pg.locality}, ` : ""}
            {pg.city}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            to={`/owner/pg/${id}/add-room`}
            className="btn-secondary text-sm"
          >
            + Add Room
          </Link>

          <Link
            to={`/owner/pg/${id}/allocate`}
            className="btn-primary text-sm"
          >
            + Add Resident
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {rooms.length}
          </p>
          <p className="text-xs text-slate-500">Rooms</p>
        </div>

        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {totalResidents}
          </p>
          <p className="text-xs text-slate-500">
            Residents
          </p>
        </div>

        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">
            {
              rooms.filter(
                (r) => r.occupancy < r.capacity
              ).length
            }
          </p>
          <p className="text-xs text-slate-500">
            Vacant
          </p>
        </div>

        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-red-500">
            {
              rooms.filter(
                (r) => r.occupancy >= r.capacity
              ).length
            }
          </p>
          <p className="text-xs text-slate-500">
            Full Rooms
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("rooms")}
          className={`px-4 py-2 rounded-xl ${
            tab === "rooms"
              ? "bg-brand-500 text-white"
              : "bg-slate-100"
          }`}
        >
          Rooms
        </button>

        <button
          onClick={() => setTab("payments")}
          className={`px-4 py-2 rounded-xl ${
            tab === "payments"
              ? "bg-brand-500 text-white"
              : "bg-slate-100"
          }`}
        >
          Payments
        </button>

        <button
          onClick={() => setTab("complaints")}
          className={`px-4 py-2 rounded-xl ${
            tab === "complaints"
              ? "bg-brand-500 text-white"
              : "bg-slate-100"
          }`}
        >
          Complaints
        </button>
      </div>

      {tab === "rooms" && (
        <RoomsTab
          rooms={rooms}
          pgId={id}
          removeResident={removeResident}
          deleteRoom={deleteRoom}
        />
      )}

      {tab === "payments" && <PaymentsTab pgId={id} />}

      {tab === "complaints" && (
        <ComplaintsTab pgId={id} />
      )}
    </div>
  );
}

function RoomsTab({ rooms, pgId, removeResident, deleteRoom }) {
  if (rooms.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-slate-400 mb-4">
          No rooms added yet
        </p>

        <Link
          to={`/owner/pg/${pgId}/add-room`}
          className="btn-primary"
        >
          Add First Room
        </Link>
      </div>
    );
  }

  return (
  <div className="grid md:grid-cols-2 gap-4">
    {rooms.map((room) => (
      <div key={room._id} className="card p-5">
        <div className="flex justify-between mb-3">
          <h3 className="font-bold">
            Room {room.roomNumber}
          </h3>

          <div className="text-right">
            <p className="font-medium">
              {room.occupancy}/{room.capacity}
            </p>

            <p className="text-xs text-green-600">
              {room.capacity - room.occupancy} vacant
            </p>
          </div>
        </div>

        <p className="text-brand-500 font-semibold mb-3">
          ₹{room.rent}/mo
        </p>

        {room.residents?.length > 0 ? (
          <div className="space-y-2">
            {room.residents.map((resident) => (
              <div
                key={resident._id}
                className="flex justify-between items-center bg-slate-50 rounded-xl px-3 py-2"
              >
                <Link
                  to={`/owner/resident/${resident._id}`}
                  className="flex-1"
                >
                  <p className="font-medium hover:text-orange-500 transition">
                    {resident.name}
                  </p>

                  <p className="text-xs text-slate-400">
                    {resident.email}
                  </p>
                </Link>

                <button
                  onClick={() =>
                    removeResident(
                      room._id,
                      resident._id
                    )
                  }
                  className="btn-danger text-xs"
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              onClick={() => deleteRoom(room._id)}
              className="btn-danger text-xs mt-3"
            >
              Delete Room
            </button>
          </div>
        ) : (
          <div>
            <p className="text-slate-400 text-sm mb-3">
              No residents assigned
            </p>

            <button
              onClick={() => deleteRoom(room._id)}
              className="btn-danger text-xs"
            >
              Delete Room
            </button>
          </div>
        )}
      </div>
    ))}
  </div>
 );
}

function PaymentsTab() {
  return (
    <div className="card p-6">
      <p className="text-slate-500">
        Payments section coming soon.
      </p>
    </div>
  );
}

function ComplaintsTab() {
  return (
    <div className="card p-6">
      <p className="text-slate-500">
        Complaints section coming soon.
      </p>
    </div>
  );
}