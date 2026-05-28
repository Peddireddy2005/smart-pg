import {useParams,Link} from "react-router-dom";
import {useEffect,useState} from "react";
import {getRoomsOfPG} from "../services/roomService";

function OwnerPGDetails(){
    const {pgId}=useParams();
    const [rooms,setRooms] = useState([]);
    useEffect(()=>{
        const fetchRooms = async()=>{
            try{
                const data = await getRoomsOfPG(pgId);
                setRooms(data.rooms);
            } catch (error) {
                console.error("Error fetching rooms:", error);
            }
        }
        fetchRooms();
    }, [pgId]);
    return(
        <div>
            <h1>PG Details</h1>
            <Link to={`/owner/pg/${pgId}/add-room`}>
                + Add Room
            </Link>
            <div >
                {rooms.map((room) => (
                    <div key={room._id}>
                        <h3>{room.roomNumber}</h3>
                        <p>Capacity:{room.capacity}</p>
                        <p>Occupied:{room.occupancy}</p>
                        <p>Vacant:{room.capacity - room.occupancy}</p>
                        <p>Rent: ₹{room.rent}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default OwnerPGDetails;