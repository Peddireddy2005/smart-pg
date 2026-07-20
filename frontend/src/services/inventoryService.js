import api from "./api";

export const createInventoryItem = (pgId, payload) => api.post(`/inventory/pg/${pgId}`, payload).then((r) => r.data);
export const getPGInventory = (pgId) => api.get(`/inventory/pg/${pgId}`).then((r) => r.data);
export const getOwnerInventory = () => api.get("/inventory/owner/all").then((r) => r.data);
export const updateInventoryItem = (id, payload) => api.put(`/inventory/${id}`, payload).then((r) => r.data);
export const addRepairRecord = (id, payload) => api.put(`/inventory/${id}/repair`, payload).then((r) => r.data);
export const deleteInventoryItem = (id) => api.delete(`/inventory/${id}`).then((r) => r.data);
