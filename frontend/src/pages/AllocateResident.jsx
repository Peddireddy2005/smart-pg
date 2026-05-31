import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { allocateResidentToRoom } from "../services/roomService";

function AllocateResident() {
  const { pgId } = useParams();
  const navigate = useNavigate();

  const [residentId, setResidentId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await allocateResidentToRoom(residentId, roomId);

      alert("Resident allocated successfully!");

      setResidentId("");
      setRoomId("");

      navigate(`/owner/pg/${pgId}`);
    } catch (error) {
      console.error("Error allocating resident:", error);

      alert(
        error.response?.data?.message ||
        "Failed to allocate resident"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Allocate Resident</h1>

      <Link to={`/owner/pg/${pgId}`}>
        ← Back to PG Details
      </Link>

      <br />
      <br />

      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            placeholder="Enter Resident ID"
            value={residentId}
            onChange={(e) => setResidentId(e.target.value)}
            required
          />
        </div>

        <br />

        <div>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            required
          />
        </div>

        <br />

        <button
          type="submit"
          disabled={loading}
        >
          {loading ? "Allocating..." : "Allocate Resident"}
        </button>
      </form>
    </div>
  );
}

export default AllocateResident;