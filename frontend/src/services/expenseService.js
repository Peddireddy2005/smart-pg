import api from "./api";

export const createExpense = (pgId, payload) => api.post(`/expenses/pg/${pgId}`, payload).then((r) => r.data);
export const getPGExpenses = (pgId) => api.get(`/expenses/pg/${pgId}`).then((r) => r.data);
export const getOwnerExpenses = (month, year) =>
  api.get("/expenses/owner/all", { params: { month, year } }).then((r) => r.data);
export const updateExpense = (id, payload) => api.put(`/expenses/${id}`, payload).then((r) => r.data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`).then((r) => r.data);
