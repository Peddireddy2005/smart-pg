import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import { getPGReviews, submitReview, deleteReview } from "../services/reviewService";
import { getSession } from "../services/authService";
import StarRating from "../components/StarRating";

export default function PGDetails() {
  const { id } = useParams();
  const location = useLocation();
  const embedded = location.pathname.startsWith("/owner") || location.pathname.startsWith("/resident");
  const backTo = location.pathname.startsWith("/owner/pg-listings")
    ? "/owner/pg-listings"
    : location.pathname.startsWith("/resident/pg-listings")
    ? "/resident/pg-listings"
    : "/pgs";

  const [pg, setPG] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const user = getSession();

  useEffect(() => {
    Promise.all([
      api.get(`/pg/${id}`),
      api.get(`/rooms/${id}`),
      getPGReviews(id),
    ]).then(([p, r, rev]) => {
      setPG(p.data);
      setRooms(r.data);
      setReviews(rev.reviews);
      setReviewPage(rev.page);
      setReviewTotalPages(rev.totalPages);
      if (user) {
        const mine = rev.reviews.find((r2) => r2.resident?._id === user._id);
        if (mine) { setMyRating(mine.rating); setMyComment(mine.comment || ""); }
      }
    }).finally(() => setLoading(false));
  }, [id]); // eslint-disable-line

  const loadMoreReviews = async () => {
    setLoadingMoreReviews(true);
    try {
      const next = await getPGReviews(id, reviewPage + 1);
      setReviews((prev) => [...prev, ...next.reviews]);
      setReviewPage(next.page);
      setReviewTotalPages(next.totalPages);
    } catch {
      toast.error("Failed to load more reviews");
    } finally {
      setLoadingMoreReviews(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!myRating) { toast.error("Please select a rating"); return; }
    setSubmittingReview(true);
    try {
      const updated = await submitReview(id, myRating, myComment);
      setReviews((prev) => {
        const existing = prev.find((r) => r.resident?._id === user._id);
        return existing
          ? prev.map((r) => r.resident?._id === user._id ? { ...r, ...updated } : r)
          : [{ ...updated, resident: { _id: user._id, name: user.name, photoUrl: user.photoUrl } }, ...prev];
      });
      toast.success("Review submitted!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      setMyRating(0); setMyComment("");
      toast.success("Review deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#f8f7f4] dark:bg-slate-900 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" /></div>;
  if (!pg) return <div className="p-8 text-red-500">PG not found</div>;

  const available = rooms.filter((r) => r.occupancy < r.capacity).length;
  const images = pg.images || [];

  return (
    <div className={embedded ? "" : "min-h-screen bg-[#f8f7f4] dark:bg-slate-900"}>
      {!embedded && (
        <div className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 px-6 py-4 flex items-center gap-4">
          <Link to={backTo} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 text-sm">← Back</Link>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-500 rounded flex items-center justify-center text-white font-bold text-xs">S</div>
            <span className="font-heading font-bold text-slate-900 dark:text-white">Smart PG</span>
          </Link>
        </div>
      )}
      {embedded && (
        <div className="mb-4">
          <Link to={backTo} className="text-slate-400 hover:text-slate-600 text-sm">← Back to Browse PGs</Link>
        </div>
      )}

      <div className={embedded ? "" : "max-w-3xl mx-auto px-6 py-8"}>
        {images.length > 0 ? (
          <div className="mb-6">
            <img src={images[imgIdx].url} alt={pg.name} className="w-full h-72 object-cover rounded-2xl border border-gray-100 dark:border-slate-700 mb-2" />
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button key={img._id} onClick={() => setImgIdx(i)}
                    className={`shrink-0 w-16 h-12 rounded-xl overflow-hidden border-2 transition ${i === imgIdx ? "border-brand-500" : "border-transparent"}`}>
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-2xl flex items-center justify-center text-6xl mb-6">🏠</div>
        )}

        <div className="card p-6 mb-6">
          <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
            <div>
              <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">{pg.name}</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">📍 {pg.locality ? `${pg.locality}, ` : ""}{pg.city}</p>
              <p className="text-slate-400 text-sm">{pg.address}</p>
              {pg.ratingsCount > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <StarRating value={Math.round(pg.ratingsAverage)} readOnly />
                  <span className="text-sm text-slate-500 dark:text-slate-400">{pg.ratingsAverage} ({pg.ratingsCount} reviews)</span>
                </div>
              )}
            </div>
            <span className={available > 0 ? "badge-green" : "badge-red"}>
              {available > 0 ? `${available} Available` : "Full"}
            </span>
          </div>

          {pg.description && <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">{pg.description}</p>}

          {pg.amenities?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {pg.amenities.map((a, i) => <span key={i} className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm px-3 py-1 rounded-xl">{a}</span>)}
            </div>
          )}

          {pg.rentRange?.min > 0 && (
            <p className="font-heading text-xl font-bold text-brand-500">Starting ₹{pg.rentRange.min.toLocaleString()}/month</p>
          )}

          {pg.contactPhone && <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">📞 {pg.contactPhone}</p>}

          {pg.rules && (
            <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-sm text-amber-700 dark:text-amber-300">
              📋 <strong>Rules:</strong> {pg.rules}
            </div>
          )}
        </div>

        <h2 className="font-heading font-bold text-xl text-slate-900 dark:text-white mb-4">Rooms</h2>
        {rooms.length === 0 ? (
          <p className="text-slate-400 mb-8">No rooms listed yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 mb-8">
            {rooms.map((room) => {
              const avail = room.capacity - room.occupancy;
              return (
                <div key={room._id} className={`card p-4 ${avail === 0 ? "opacity-60" : ""}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-heading font-semibold text-slate-900 dark:text-white">Room {room.roomNumber}</span>
                    <span className={avail === 0 ? "badge-red" : "badge-green"}>{avail === 0 ? "Full" : "Open"}</span>
                  </div>
                  {room.type && <p className="text-xs text-slate-400 mb-1">{room.type}</p>}
                  <p className="text-sm text-slate-500 dark:text-slate-400">Beds: {room.occupancy}/{room.capacity}</p>
                  <p className="font-heading font-bold text-brand-500 mt-2">
                    ₹{room.rent.toLocaleString()}<span className="text-xs font-normal text-slate-400">/mo</span>
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {!user && (
          <div className="card p-5 bg-gradient-to-r from-brand-500 to-brand-600 border-0 text-white text-center mb-8">
            <p className="font-heading font-bold text-lg mb-1">Interested in this PG?</p>
            <p className="text-orange-100 text-sm mb-4">Create an account to connect with the owner.</p>
            <Link to="/signup" className="bg-white text-brand-600 font-semibold px-6 py-2.5 rounded-xl hover:bg-orange-50 transition inline-block">
              Get Started Free
            </Link>
          </div>
        )}

        <h2 className="font-heading font-bold text-xl text-slate-900 dark:text-white mb-4">Reviews</h2>

        {user && user.role === "resident" && (
          <form onSubmit={handleSubmitReview} className="card p-5 mb-5">
            <p className="font-heading font-semibold text-slate-800 dark:text-white mb-3">
              {reviews.find((r) => r.resident?._id === user._id) ? "Update your review" : "Write a review"}
            </p>
            <div className="mb-3">
              <StarRating value={myRating} onChange={setMyRating} size="text-2xl" />
            </div>
            <textarea className="input mb-3" rows={3} placeholder="Share your experience (optional)..."
              value={myComment} onChange={(e) => setMyComment(e.target.value)} />
            <button disabled={submittingReview} className="btn-primary text-sm">
              {submittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        )}

        {reviews.length === 0 ? (
          <p className="text-slate-400 mb-8">No reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-4 mb-4">
            {reviews.map((rev) => (
              <div key={rev._id} className="card p-4">
                <div className="flex items-start gap-3">
                  {rev.resident?.photoUrl
                    ? <img src={rev.resident.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                    : <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">{rev.resident?.name?.charAt(0)}</div>
                  }
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-800 dark:text-white text-sm">{rev.resident?.name || "Anonymous"}</p>
                      <div className="flex items-center gap-2">
                        <StarRating value={rev.rating} readOnly size="text-sm" />
                        {user && rev.resident?._id === user._id && (
                          <button onClick={() => handleDeleteReview(rev._id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                        )}
                      </div>
                    </div>
                    {rev.comment && <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{rev.comment}</p>}
                    {rev.ownerReply && (
                      <div className="mt-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-300">
                        <span className="font-semibold">Owner reply:</span> {rev.ownerReply}
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-1">{new Date(rev.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {reviewPage < reviewTotalPages && (
          <div className="text-center mb-8">
            <button onClick={loadMoreReviews} disabled={loadingMoreReviews} className="btn-secondary text-sm">
              {loadingMoreReviews ? "Loading..." : "Load more reviews"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}