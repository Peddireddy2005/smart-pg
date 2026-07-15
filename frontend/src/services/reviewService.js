import api from "./api";

export const getPGReviews = (pgId) => api.get(`/reviews/pg/${pgId}`).then((r) => r.data);

export const submitReview = (pgId, rating, comment) =>
  api.put(`/reviews/pg/${pgId}`, { rating, comment }).then((r) => r.data);

export const deleteReview = (reviewId) => api.delete(`/reviews/${reviewId}`).then((r) => r.data);
