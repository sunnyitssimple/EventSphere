import mongoose from "mongoose";
const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  quantity: { type: Number, required: true, min: 1, max: 6 },
  tier: { type: String, enum: ["Standard", "Premium"], default: "Standard" },
  totalAmount: { type: Number, required: true },
  ticketCode: { type: String, required: true, unique: true },
  qrCode: { type: String, required: true },         // data:image/png;base64 QR of the ticket code
  transactionId: { type: String, required: true },  // self-generated reference for the simulated payment
  refundId: { type: String, default: null },
  status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" },
  checkedIn: { type: Boolean, default: false },
  checkedInAt: { type: Date, default: null },
}, { timestamps: true });
export default mongoose.model("Booking", bookingSchema);
