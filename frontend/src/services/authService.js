import api from "./api";

export const signup = (payload) => api.post("/auth/signup", payload).then((r) => r.data);

export const login = (payload) => api.post("/auth/login", payload).then((r) => r.data);

// `credential` is the Google ID token from Google Identity Services.
// `role` is only used when creating a brand new account.
export const googleAuth = (credential, role) =>
  api.post("/auth/google", { credential, role }).then((r) => r.data);

export const forgotPassword = (email) =>
  api.post("/auth/forgot-password", { email }).then((r) => r.data);

export const resetPassword = (token, password) =>
  api.put(`/auth/reset-password/${token}`, { password }).then((r) => r.data);

export const changePassword = (currentPassword, newPassword) =>
  api.put("/auth/change-password", { currentPassword, newPassword }).then((r) => r.data);

export const saveSession = (data) => {
  localStorage.setItem("user", JSON.stringify(data));
  window.dispatchEvent(new Event("storage"));
};

export const clearSession = () => {
  localStorage.removeItem("user");
  window.dispatchEvent(new Event("storage"));
};

export const getSession = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};
