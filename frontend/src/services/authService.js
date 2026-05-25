import axios from "axios";

const API = "https://smart-pg-backend-9l7f.onrender.com/api/auth";

// Signup
export const signupUser = async (userData) => {
  const response = await axios.post(`${API}/signup`, userData);
  return response.data;
};

// Login
export const loginUser = async (userData) => {
  const response = await axios.post(`${API}/login`, userData);
  return response.data;
};