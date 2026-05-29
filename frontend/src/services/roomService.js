import axios from "axios";

const API = import.meta.env.VITE_API_URL;

console.log("ROOM SERVICE API:", API);

export const getRoomsOfPG = async (pgId) => {
  const response = await axios.get(`${API}/api/pgs/${pgId}/rooms`);
  return response.data;
};

export const allocateResidentToRoom = async (residentId,roomId) => {
    const response = await axios.post(`${API}/api/rooms/allocate-room`,{
        residentId,
        roomId,
    },
    {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });
    return response.data;
};