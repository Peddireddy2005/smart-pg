import api from "./api";

export const createStaff = (pgId, payload) => api.post(`/staff/pg/${pgId}`, payload).then((r) => r.data);
export const getPGStaff = (pgId) => api.get(`/staff/pg/${pgId}`).then((r) => r.data);
export const getOwnerStaff = ({ page = 1, limit = 40 } = {}) =>
  api.get("/staff/owner/all", { params: { page, limit } }).then((r) => r.data);
export const updateStaff = (id, payload) => api.put(`/staff/${id}`, payload).then((r) => r.data);
export const markAttendance = (id, present, date) => api.put(`/staff/${id}/attendance`, { present, date }).then((r) => r.data);
export const deleteStaff = (id) => api.delete(`/staff/${id}`).then((r) => r.data);