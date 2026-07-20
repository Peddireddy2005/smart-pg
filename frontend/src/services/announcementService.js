import api from "./api";

export const createAnnouncement = (pgId, payload) => api.post(`/announcements/pg/${pgId}`, payload).then((r) => r.data);
export const getPGAnnouncements = (pgId) => api.get(`/announcements/pg/${pgId}`).then((r) => r.data);
export const getMyAnnouncements = () => api.get("/announcements/my").then((r) => r.data);
export const getOwnerAnnouncements = () => api.get("/announcements/owner/all").then((r) => r.data);
export const deleteAnnouncement = (id) => api.delete(`/announcements/${id}`).then((r) => r.data);
