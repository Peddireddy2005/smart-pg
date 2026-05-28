import axios from "axios";
const API = "https://smart-pg-backend-9l7f.onrender.com/api/pgs";

export const getMyPGs = async () => {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API}/my-pgs`,{
        headers:{
            Authorization:`Bearer ${token}`,
        },
    });
    return response.data;
};

export const createPG = async(pgData)=>{
    const token = localStorage.getItem("token");
    const response = await axios.post(API,pgData,{
        headers:{
            Authorization:`Bearer ${token}`,
        }
    });
    return response.data;
};