import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { api } from "../../services/api.js";

const SocketContext = createContext(null);
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000";

export function SocketProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const tokens = api.tokens.getTokens();
    if (!tokens?.accessToken) return;

    const socket = io(API_BASE, {
      autoConnect: true,
      transports: ["websocket"],
      auth: { token: tokens.accessToken }
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, []);

  const value = useMemo(() => ({ socket: socketRef.current, connected }), [connected]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
}

