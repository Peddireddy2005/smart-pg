import api from "./api";

export const getPlatformStats = () => api.get("/admin/stats").then((r) => r.data);
export const getAllOwners = () => api.get("/admin/owners").then((r) => r.data);
export const getAllPGsAdmin = () => api.get("/admin/pgs").then((r) => r.data);
export const setAccountActive = (id, isActive) => api.put(`/admin/users/${id}/active`, { isActive }).then((r) => r.data);
