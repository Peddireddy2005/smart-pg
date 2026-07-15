import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL + "/api" });

api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});

let onUnauthorized = null;
// Allows App.jsx to register a callback (e.g. clear storage + redirect to
// /login) without this module needing to import react-router directly.
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(err);
  }
);

export default api;
