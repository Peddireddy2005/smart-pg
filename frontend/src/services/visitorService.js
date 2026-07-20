import api from "./api";

export const inviteVisitor = (payload) => api.post("/visitors", payload).then((r) => r.data);
export const getMyVisitors = () => api.get("/visitors/my").then((r) => r.data);
export const getOwnerVisitors = () => api.get("/visitors/owner/all").then((r) => r.data);
export const approveVisitor = (id, approve) => api.put(`/visitors/${id}/approve`, { approve }).then((r) => r.data);
export const logVisitorEvent = (token, event) => api.post(`/visitors/${token}/event`, { event }).then((r) => r.data);
