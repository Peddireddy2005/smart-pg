import api from "./api";

export const getPGReviews = (pgId, page = 1) => api.get(`/reviews/pg/${pgId}`, { params: { page } }).then((r) => r.data);

export const submitReview = (pgId, rating, comment) =>
  api.put(`/reviews/pg/${pgId}`, { rating, comment }).then((r) => r.data);

export const deleteReview = (reviewId) => api.delete(`/reviews/${reviewId}`).then((r) => r.data);

export const replyToReview = (reviewId, reply) => api.put(`/reviews/${reviewId}/reply`, { reply }).then((r) => r.data);