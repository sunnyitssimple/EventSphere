import Review from "../models/Review.js";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";

async function recalc(eventId) {
  const agg = await Review.aggregate([
    { $match: { event: eventId } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = agg[0] || {};
  await Event.findByIdAndUpdate(eventId, { avgRating: Math.round(avg * 10) / 10, reviewCount: count });
}

export const listForEvent = async (req, res) => {
  res.json(await Review.find({ event: req.params.eventId }).populate("user", "name").sort("-createdAt"));
};

// One review per user per event — booking a confirmed ticket is required first
// (like a "verified booking" badge), and resubmitting updates your existing review.
export const createReview = async (req, res) => {
  const { eventId, rating, comment = "" } = req.body;
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) return res.status(400).json({ message: "Pick a rating from 1 to 5 stars." });
  const booked = await Booking.findOne({ user: req.user._id, event: eventId, status: "confirmed" });
  if (!booked) return res.status(403).json({ message: "Book this event first to leave a review." });

  const existing = await Review.findOne({ user: req.user._id, event: eventId });
  if (existing) { existing.rating = r; existing.comment = comment.trim(); await existing.save(); }
  else await Review.create({ user: req.user._id, event: eventId, rating: r, comment: comment.trim() });

  await recalc(eventId);
  res.status(201).json(await Review.findOne({ user: req.user._id, event: eventId }).populate("user", "name"));
};

export const deleteReview = async (req, res) => {
  const r = await Review.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!r) return res.status(404).json({ message: "Review not found." });
  await recalc(r.event);
  res.json({ message: "Review deleted." });
};
