import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../state/auth/AuthContext.jsx";

export function RequireAuth({ role, children }) {
  const { status, user } = useAuth();
  if (status === "loading")
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 text-forge-muted">
        <div className="rounded-2xl border border-forge-line bg-forge-panel/70 px-6 py-8">Loading…</div>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

