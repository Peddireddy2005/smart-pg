import api from "./api";

export const createInvite = (roomId) => api.post(`/invites/room/${roomId}`).then((r) => r.data);
export const getInvite = (token) => api.get(`/invites/${token}`).then((r) => r.data);
export const claimInvite = (token) => api.post(`/invites/${token}/claim`).then((r) => r.data);
