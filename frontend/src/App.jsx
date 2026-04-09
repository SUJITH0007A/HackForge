import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Landing } from "./pages/Landing.jsx";
import { Login } from "./pages/auth/Login.jsx";
import { Signup } from "./pages/auth/Signup.jsx";
import { Events } from "./pages/Events.jsx";
import { EventDetails } from "./pages/EventDetails.jsx";
import { Leaderboard } from "./pages/Leaderboard.jsx";
import { ParticipantDashboard } from "./pages/participant/ParticipantDashboard.jsx";
import { JudgeDashboard } from "./pages/judge/JudgeDashboard.jsx";
import { AdminDashboard } from "./pages/admin/AdminDashboard.jsx";
import { RequireAuth } from "./pages/shared/RequireAuth.jsx";
import { RoleRedirect } from "./pages/shared/RoleRedirect.jsx";
import { NotFound } from "./pages/shared/NotFound.jsx";

export default function App() {
  return (
    <div className="min-h-screen noise">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:eventId" element={<EventDetails />} />
        <Route path="/events/:eventId/leaderboard" element={<Leaderboard />} />

        <Route path="/dashboard" element={<RoleRedirect />} />

        <Route
          path="/participant"
          element={
            <RequireAuth role="participant">
              <ParticipantDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/judge"
          element={
            <RequireAuth role="judge">
              <JudgeDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth role="admin">
              <AdminDashboard />
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

