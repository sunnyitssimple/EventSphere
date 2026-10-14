import mongoose from "mongoose";
const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "", trim: true, maxlength: 500 },
}, { timestamps: true });
reviewSchema.index({ user: 1, event: 1 }, { unique: true }); // one review per user per event
export default mongoose.model("Review", reviewSchema);
