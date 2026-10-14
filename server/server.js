import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import { initSocket } from "./config/socket.js";
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.get("/api/health", (_, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use((req, res) => res.status(404).json({ message: "Route not found." }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.name === "ValidationError" ? 400 : 500).json({ message: err.message || "Server error." });
});

// Socket.io rides on the same HTTP server as Express (same host + port),
// so the frontend needs no extra URL or port to talk to it.
const httpServer = http.createServer(app);
initSocket(httpServer);

connectDB().then(() => httpServer.listen(process.env.PORT || 5000, () => console.log("API + sockets on port " + (process.env.PORT || 5000))))
  .catch((e) => { console.error("DB connection failed:", e.message); process.exit(1); });
