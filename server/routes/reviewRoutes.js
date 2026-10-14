import { Router } from "express";
import * as c from "../controllers/reviewController.js";
import { protect } from "../middleware/auth.js";
const r = Router();
r.get("/event/:eventId", c.listForEvent);
r.post("/", protect, c.createReview);
r.delete("/:id", protect, c.deleteReview);
export default r;
