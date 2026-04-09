import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | authed | anon

  async function bootstrap() {
    const tokens = api.tokens.getTokens();
    if (!tokens?.accessToken) {
      setUser(null);
      setStatus("anon");
      return;
    }
    try {
      const me = await api.auth.me();
      setUser(me.user);
      setStatus("authed");
    } catch {
      api.tokens.clearTokens();
      setUser(null);
      setStatus("anon");
    }
  }

  useEffect(() => {
    bootstrap();
  }, []);

  async function login(payload) {
    const out = await api.auth.login(payload);
    api.tokens.setTokens({ accessToken: out.accessToken, refreshToken: out.refreshToken });
    await bootstrap();
  }

  async function signup(payload) {
    const out = await api.auth.signup(payload);
    api.tokens.setTokens({ accessToken: out.accessToken, refreshToken: out.refreshToken });
    await bootstrap();
  }

  function logout() {
    api.tokens.clearTokens();
    setUser(null);
    setStatus("anon");
  }

  const value = useMemo(() => ({ user, status, login, signup, logout }), [user, status]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

