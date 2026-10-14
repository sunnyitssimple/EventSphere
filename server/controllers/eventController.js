import Event from "../models/Event.js";
import Booking from "../models/Booking.js";

export const listEvents = async (req, res) => {
  const { q, category, city, sort = "date", page = 1, limit = 12 } = req.query;
  const filter = { date: { $gte: new Date() } };
  if (category) filter.category = category;
  if (city) filter.city = city;
  if (q) filter.$text = { $search: q };
  const sorts = { date: { date: 1 }, price: { price: 1 }, popular: { popularity: -1 }, rating: { avgRating: -1 } };
  const [items, total] = await Promise.all([
    Event.find(filter).sort(sorts[sort] || sorts.date).skip((page - 1) * limit).limit(+limit),
    Event.countDocuments(filter),
  ]);
  res.json({ items, total, pages: Math.ceil(total / limit) });
};

// Smart recommendations: interests + past bookings + popularity + urgency
export const recommended = async (req, res) => {
  const past = await Booking.find({ user: req.user._id }).populate("event", "category");
  const weight = {};
  req.user.interests.forEach((c) => (weight[c] = (weight[c] || 0) + 10));
  past.forEach((b) => b.event && (weight[b.event.category] = (weight[b.event.category] || 0) + 4));
  const events = await Event.find({ date: { $gte: new Date() }, seatsLeft: { $gt: 0 } });
  const now = Date.now();
  const scored = events.map((e) => {
    const days = (e.date - now) / 864e5;
    const score = (weight[e.category] || 0) + e.popularity + (days < 21 ? 2 : 0) + (e.seatsLeft / e.totalSeats < 0.2 ? 1 : 0);
    return { event: e, score };
  }).sort((a, b) => b.score - a.score).slice(0, 6);
  res.json(scored.map((s) => s.event));
};

export const getEvent = async (req, res) => {
  const e = await Event.findById(req.params.id).catch(() => null);
  e ? res.json(e) : res.status(404).json({ message: "Event not found." });
};
export const createEvent = async (req, res) => {
  const b = req.body;
  res.status(201).json(await Event.create({ ...b, seatsLeft: b.totalSeats }));
};
export const updateEvent = async (req, res) => {
  const e = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  e ? res.json(e) : res.status(404).json({ message: "Event not found." });
};
export const deleteEvent = async (req, res) => {
  const e = await Event.findByIdAndDelete(req.params.id);
  e ? res.json({ message: "Event deleted." }) : res.status(404).json({ message: "Event not found." });
};
