import mongoose from "mongoose";
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  category: { type: String, required: true, enum: ["Music", "Tech", "Comedy", "Sports", "Food", "Arts"] },
  city: { type: String, required: true },
  venue: { type: String, required: true },
  date: { type: Date, required: true },
  price: { type: Number, required: true, min: 0 },
  totalSeats: { type: Number, required: true, min: 1 },
  seatsLeft: { type: Number, required: true, min: 0 },
  popularity: { type: Number, default: 5 },
  image: { type: String, default: "" },
  avgRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
}, { timestamps: true });
eventSchema.index({ title: "text", venue: "text", city: "text" });
export default mongoose.model("Event", eventSchema);
