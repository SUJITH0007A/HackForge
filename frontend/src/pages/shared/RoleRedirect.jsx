import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../state/auth/AuthContext.jsx";

export function RoleRedirect() {
  const { status, user } = useAuth();
  if (status === "loading") return null;
  if (!user) return <Navigate to="/" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  if (user.role === "judge") return <Navigate to="/judge" replace />;
  return <Navigate to="/participant" replace />;
}

