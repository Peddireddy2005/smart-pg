import api from "./api";

export const submitVacateNotice = (plannedDate) => api.post("/rooms/vacate-notice", { plannedDate }).then((r) => r.data);
export const cancelVacateNotice = () => api.delete("/rooms/vacate-notice").then((r) => r.data);
export const getOwnerVacateRequests = () => api.get("/rooms/owner/vacate-requests").then((r) => r.data);
export const getOwnerVacatedResidents = () => api.get("/rooms/owner/vacated").then((r) => r.data);
export const vacateResident = (roomId, residentId) => api.post(`/rooms/${roomId}/vacate`, { residentId }).then((r) => r.data);