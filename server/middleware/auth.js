import jwt from "jsonwebtoken";
import User from "../models/User.js";
export const protect = async (req, res, next) => {
  const h = req.headers.authorization || "";
  if (!h.startsWith("Bearer ")) return res.status(401).json({ message: "Please log in first." });
  try {
    const { id } = jwt.verify(h.slice(7), process.env.JWT_SECRET);
    req.user = await User.findById(id).select("-password");
    if (!req.user) throw new Error();
    next();
  } catch { res.status(401).json({ message: "Session expired. Log in again." }); }
};
export const adminOnly = (req, res, next) =>
  req.user?.role === "admin" ? next() : res.status(403).json({ message: "Admins only." });
