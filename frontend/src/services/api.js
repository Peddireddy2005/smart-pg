import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL + "/api" });

api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

api.interceptors.response.use(
  (res) => { console.log(`[API ✓] ${res.status} ${res.config.url}`); return res; },
  (err) => {
    console.error(`[API ✗] ${err.response?.status} ${err.config?.url}`, err.response?.data);
    return Promise.reject(err);
  }
);

export default api;