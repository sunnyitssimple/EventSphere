import { Router } from "express";
import * as c from "../controllers/eventController.js";
import { protect, adminOnly } from "../middleware/auth.js";
const r = Router();
r.get("/", c.listEvents);
r.get("/recommended", protect, c.recommended);   // keep above "/:id"
r.get("/:id", c.getEvent);
r.post("/", protect, adminOnly, c.createEvent);
r.put("/:id", protect, adminOnly, c.updateEvent);
r.delete("/:id", protect, adminOnly, c.deleteEvent);
export default r;
