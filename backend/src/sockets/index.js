import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { setIo } from "../services/realtimeHub.js";

export function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.clientOrigin, credentials: true }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Missing token"));
      const payload = jwt.verify(token, env.jwtAccessSecret);
      socket.data.auth = payload;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const { sub: userId } = socket.data.auth;
    if (userId) socket.join(`user:${userId}`);

    socket.on("event:join", ({ eventId }) => {
      if (!eventId) return;
      socket.join(`event:${eventId}`);
    });
    socket.on("event:leave", ({ eventId }) => {
      if (!eventId) return;
      socket.leave(`event:${eventId}`);
    });
  });

  setIo(io);
  return io;
}

