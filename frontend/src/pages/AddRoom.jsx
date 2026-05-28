import {useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import axios from "axios";

function AddRoom(){
    const {pgId} = useParams();
    const navigate = useNavigate();
    const [roomNumber,setRoomNumber] = useState("");
    const [capacity,setCapacity] = useState("");
    const [rent,setRent] = useState("");

    const handleSubmit = async (e) =>{
        e.preventDefault();
        try{
            const token = localStorage.getItem("token");
            console.log(import.meta.env.VITE_API_URL);
            console.log("API URL:", import.meta.env.VITE_API_URL);
            await axios.post(`${import.meta.env.VITE_API_URL}/api/rooms`,{
                roomNumber,
                capacity,
                rent,
                pgId,
            },{
                headers:{
                    "Authorization": `Bearer ${token}`
                },
            });
            navigate(`/owner/pg/${pgId}`);
        } catch (error) {
            console.error("Error adding room:", error);
        }
    };

     return (
    <div>
      <h1>Add Room</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Room Number"
          value={roomNumber}
          onChange={(e) =>
            setRoomNumber(e.target.value)
          }
        />

        <input
          type="number"
          placeholder="Capacity"
          value={capacity}
          onChange={(e) =>
            setCapacity(e.target.value)
          }
        />

        <input
          type="number"
          placeholder="Rent"
          value={rent}
          onChange={(e) =>
            setRent(e.target.value)
          }
        />

        <button type="submit">
          Add Room
        </button>
      </form>
    </div>
  );
}

export default AddRoom;