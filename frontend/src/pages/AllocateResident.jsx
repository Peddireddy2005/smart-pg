import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { allocateResidentToRoom } from "../services/roomService";

function AllocateResident(){
    const { pgId } = useParams();
    const navigate = useNavigate();

    const [residentId, setResidentId] = useState("");
    const [roomId, setRoomId] = useState("");
    const handleSubmit = async (e) => {
        e.preventDefault();
        try{
            await allocateResidentToRoom(residentId,roomId);
            alert("Resident allocated to room successfully!");
            navigate(`/owner/pg/${pgId}`);
        }catch(error){
            console.error("Error allocating resident to room:", error);
            alert(error.residentId || "Failed to allocate resident to room. Please try again.");
        }
    };
    return(
        <div>
            <h1>Allocate Resident</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <input
                        type="text"
                        placeholder="Resident ID"
                        value={residentId}
                        onChange={(e) => setResidentId(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <input
                        type="text"
                        placeholder="Room ID"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Allocate</button>
            </form>
        </div>
    );
}

export default AllocateResident;