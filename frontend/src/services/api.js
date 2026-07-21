import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL + "/api" });

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user"));
  } catch {
    return null;
  }
};

api.interceptors.request.use((config) => {
  const user = getStoredUser();
  if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});

let onUnauthorized = null;
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