import axios from "axios";

const API = import.meta.env.VITE_API_URL;

console.log("ROOM SERVICE API:", API);

export const getRoomsOfPG = async (pgId) => {
  const response = await axios.get(`${API}/api/pgs/${pgId}/rooms`);
  return response.data;
};