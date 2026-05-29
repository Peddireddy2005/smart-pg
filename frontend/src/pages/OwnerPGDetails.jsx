import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getRoomsOfPG } from "../services/roomService";

function OwnerPGDetails() {
  const { pgId } = useParams();
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await getRoomsOfPG(pgId);

        console.log("Rooms fetched:", data);

        setRooms(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
    };

    fetchRooms();
  }, [pgId]);

  return (
    <div>
      <h1>PG Details</h1>

      <Link to={`/owner/pg/${pgId}/add-room`}>
        + Add Room
      </Link>

      <div>
        {rooms.length > 0 ? (
          rooms.map((room) => (
            <div
              key={room._id}
              style={{
                border: "1px solid black",
                padding: "10px",
                margin: "10px",
              }}
            >
              <h3>Room {room.roomNumber}</h3>

              <p>Capacity: {room.capacity}</p>
              <p>Occupied: {room.occupancy}</p>
              <p>Vacant: {room.capacity - room.occupancy}</p>
              <p>Rent: ₹{room.rent}</p>

              <h4>Residents:</h4>

              {room.residents && room.residents.length > 0 ? (
                room.residents.map((resident) => (
                  <p key={resident._id}>
                    • {resident.name}
                  </p>
                ))
              ) : (
                <p>No residents assigned</p>
              )}

              <Link to={`/owner/pg/${pgId}/allocate-resident`}>
                + Allocate Resident
              </Link>
            </div>
          ))
        ) : (
          <p>No rooms added yet</p>
        )}
      </div>
    </div>
  );
}

export default OwnerPGDetails;