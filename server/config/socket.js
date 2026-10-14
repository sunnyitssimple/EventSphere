import { Server } from "socket.io";

let io;

// Rooms are named "event:<id>". We track viewer counts per room so the
// event detail page can show a live "X people here now" badge, and we
// broadcast seat changes so every open tab (event page or the home list)
// updates without a refresh.
export function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: process.env.CLIENT_URL, methods: ["GET", "POST"] } });

  io.on("connection", (socket) => {
    socket.on("join-event", (eventId) => {
      if (!eventId) return;
      socket.join(`event:${eventId}`);
      const count = io.sockets.adapter.rooms.get(`event:${eventId}`)?.size || 0;
      io.to(`event:${eventId}`).emit("viewerCount", { eventId, count });
    });

    socket.on("leave-event", (eventId) => {
      if (!eventId) return;
      socket.leave(`event:${eventId}`);
      const count = io.sockets.adapter.rooms.get(`event:${eventId}`)?.size || 0;
      io.to(`event:${eventId}`).emit("viewerCount", { eventId, count });
    });

    // "disconnecting" fires BEFORE Socket.io removes the socket from its rooms
    // (unlike "disconnect", which fires after) — so this is the only place we
    // can still see which event rooms the closing tab was part of.
    socket.on("disconnecting", () => {
      for (const room of socket.rooms) {
        if (!room.startsWith("event:")) continue;
        const eventId = room.slice("event:".length);
        const sizeIncludingSelf = io.sockets.adapter.rooms.get(room)?.size || 1;
        io.to(room).emit("viewerCount", { eventId, count: Math.max(0, sizeIncludingSelf - 1) });
      }
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io has not been initialized yet.");
  return io;
}
