import crypto from "crypto";
import QRCode from "qrcode";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";
import { getIO } from "../config/socket.js";

// Tell every open tab (the event's own page, and anyone browsing the list)
// that seats just moved, so they update live instead of on next refresh.
function broadcastSeats(eventId, seatsLeft) {
  try { getIO().emit("seatsUpdated", { eventId: String(eventId), seatsLeft }); } catch { /* sockets not ready yet — safe to skip */ }
}

// Luhn check-digit algorithm, same one real card forms use client-side.
function luhnValid(number) {
  if (!/^\d{16}$/.test(number)) return false;
  let sum = 0, alt = false;
  for (let i = number.length - 1; i >= 0; i--) {
    let d = +number[i];
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    sum += d; alt = !alt;
  }
  return sum % 10 === 0;
}

// Self-contained simulated checkout: validates a card the way a real form would
// (format + Luhn + expiry), then "processes" it with a short realistic delay.
// No external gateway, no account, no API keys — nothing leaves this server.
export const pay = async (req, res) => {
  const { eventId, quantity, tier = "Standard", card = {} } = req.body;
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1 || qty > 6)
    return res.status(400).json({ message: "Choose between 1 and 6 tickets." });

  const number = (card.number || "").replace(/\s/g, "");
  if (!card.name?.trim()) return res.status(400).json({ message: "Enter the name on the card." });
  if (!/^\d{16}$/.test(number)) return res.status(400).json({ message: "Card number must be 16 digits." });
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry || "")) return res.status(400).json({ message: "Expiry must be in MM/YY format." });
  const [mm, yy] = card.expiry.split("/").map(Number);
  if (new Date() >= new Date(2000 + yy, mm, 1)) return res.status(400).json({ message: "This card has expired." });
  if (!/^\d{3,4}$/.test(card.cvv || "")) return res.status(400).json({ message: "CVV must be 3 or 4 digits." });
  if (!luhnValid(number)) return res.status(402).json({ message: "Card declined. Double-check the card number." });

  const event = await Event.findById(eventId).catch(() => null);
  if (!event || event.date < new Date()) return res.status(404).json({ message: "Event not found or already over." });
  if (event.seatsLeft < qty) return res.status(409).json({ message: "Not enough seats left." });

  await new Promise((r) => setTimeout(r, 1100)); // feels like a real payment round-trip

  // Atomic: only decrements if enough seats remain, so two people can't book the last seat.
  const updated = await Event.findOneAndUpdate(
    { _id: eventId, seatsLeft: { $gte: qty } }, { $inc: { seatsLeft: -qty } }, { new: true }
  ).catch(() => null);
  if (!updated) return res.status(409).json({ message: "Seats sold out right as you paid — no charge was made." });
  broadcastSeats(updated._id, updated.seatsLeft);

  const unit = tier === "Premium" ? Math.round(updated.price * 1.5) : updated.price;
  const ticketCode = "EH" + crypto.randomBytes(3).toString("hex").toUpperCase();
  const qrCode = await QRCode.toDataURL(ticketCode, { margin: 1, width: 240 });
  const booking = await Booking.create({
    user: req.user._id, event: updated._id, quantity: qty, tier,
    totalAmount: unit * qty, ticketCode, qrCode,
    transactionId: "TXN" + crypto.randomBytes(5).toString("hex").toUpperCase(),
  });
  res.status(201).json(await booking.populate("event"));
};

export const myBookings = async (req, res) => {
  res.json(await Booking.find({ user: req.user._id }).populate("event").sort("-createdAt"));
};

export const cancelBooking = async (req, res) => {
  const b = await Booking.findOne({ _id: req.params.id, user: req.user._id }).catch(() => null);
  if (!b) return res.status(404).json({ message: "Booking not found." });
  if (b.status === "cancelled") return res.status(400).json({ message: "Already cancelled." });
  b.status = "cancelled";
  b.refundId = "RFD" + crypto.randomBytes(5).toString("hex").toUpperCase();
  await b.save();
  const updated = await Event.findByIdAndUpdate(b.event, { $inc: { seatsLeft: b.quantity } }, { new: true });
  if (updated) broadcastSeats(updated._id, updated.seatsLeft);
  res.json(b);
};

// Organizer / admin door check-in: looks a ticket up by its code (typed or scanned).
export const checkIn = async (req, res) => {
  const code = (req.body.code || "").trim().toUpperCase();
  if (!code) return res.status(400).json({ message: "Enter or scan a ticket code." });
  const b = await Booking.findOne({ ticketCode: code }).populate("event").populate("user", "name email");
  if (!b) return res.status(404).json({ message: "No ticket with that code." });
  if (b.status === "cancelled") return res.status(409).json({ message: "This booking was cancelled.", booking: b });
  if (b.checkedIn) return res.status(409).json({ message: `Already checked in at ${new Date(b.checkedInAt).toLocaleString("en-IN")}.`, booking: b });
  b.checkedIn = true; b.checkedInAt = new Date();
  await b.save();
  res.json({ message: "Checked in.", booking: b });
};
