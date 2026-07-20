import api from "./api";

export const getActivityLogs = (page = 1) => api.get("/activity-logs", { params: { page } }).then((r) => r.data);
