import api from "./api";

export const signup = (payload) => api.post("/auth/signup", payload).then((r) => r.data);

export const login = (payload) => api.post("/auth/login", payload).then((r) => r.data);

export const googleAuth = (credential, role) =>
  api.post("/auth/google", { credential, role }).then((r) => r.data);

export const forgotPassword = (email) =>
  api.post("/auth/forgot-password", { email }).then((r) => r.data);

export const resetPassword = (token, password) =>
  api.put(`/auth/reset-password/${token}`, { password }).then((r) => r.data);

export const changePassword = (currentPassword, newPassword) =>
  api.put("/auth/change-password", { currentPassword, newPassword }).then((r) => r.data);

// `remember` controls where the session lives: localStorage persists across
// browser restarts, sessionStorage clears once the tab/browser closes.
export const saveSession = (data, remember = true) => {
  const storage = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  other.removeItem("user");
  storage.setItem("user", JSON.stringify(data));
  window.dispatchEvent(new Event("storage"));
};

export const clearSession = () => {
  localStorage.removeItem("user");
  sessionStorage.removeItem("user");
  window.dispatchEvent(new Event("storage"));
};

export const getSession = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user"));
  } catch {
    return null;
  }
};

// Revokes the refresh token on the server (best-effort — logout still
// proceeds locally even if the network call fails) then clears the session.
export const logout = async () => {
  const session = getSession();
  if (session?.refreshToken) {
    try {
      await api.post("/auth/logout", { refreshToken: session.refreshToken });
    } catch {
      // ignore — local session is cleared regardless
    }
  }
  clearSession();
};