import axios from "axios";

// Falls back to a relative "/api" (matches the Vite dev proxy target) if
// VITE_API_URL isn't set, instead of silently building the literal string
// "undefined/api" and failing every request with no useful error.
const API_BASE = `${import.meta.env.VITE_API_URL || ""}/api`;
const api = axios.create({ baseURL: API_BASE });

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user"));
  } catch {
    return null;
  }
};

// Patches a refreshed token/refreshToken back into whichever storage
// (local or session) currently holds the session, without touching
// anything else stored in it.
const patchStoredTokens = (token, refreshToken) => {
  for (const storage of [localStorage, sessionStorage]) {
    const raw = storage.getItem("user");
    if (!raw) continue;
    try {
      const user = JSON.parse(raw);
      storage.setItem("user", JSON.stringify({ ...user, token, refreshToken }));
    } catch {
      // ignore malformed storage
    }
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

let refreshPromise = null;

// Exchanges the stored refresh token for a new access token. Concurrent
// 401s share one in-flight refresh request instead of each firing their own.
const tryRefresh = async () => {
  const user = getStoredUser();
  if (!user?.refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE}/auth/refresh`, { refreshToken: user.refreshToken })
      .then(({ data }) => {
        patchStoredTokens(data.token, data.refreshToken);
        return data.token;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const { config, response } = err;
    const isAuthRoute = config?.url?.includes("/auth/refresh") || config?.url?.includes("/auth/login");

    if (response?.status === 401 && config && !config._retried && !isAuthRoute) {
      config._retried = true;
      const newToken = await tryRefresh();
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
        return api(config);
      }
    }

    if (response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(err);
  }
);

export default api;