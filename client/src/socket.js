import { io } from "socket.io-client";

// Socket.io rides on the same server as the REST API, just without the
// "/api" prefix — so we derive its address from the same env var instead
// of needing a second one.
const base = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const socket = io(base, { autoConnect: true });
export default socket;
