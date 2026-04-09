import React, { useEffect, useMemo, useState } from "react";
import { BrandMark } from "../../components/Brand.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card, CardBody, CardHeader } from "../../components/ui/Card.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { useAuth } from "../../state/auth/AuthContext.jsx";
import { api } from "../../services/api.js";
import { useSocket } from "../../state/realtime/SocketContext.jsx";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();

  const [eventId, setEventId] = useState("");
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadAll() {
    if (!eventId) return;
    setErr("");
    setLoading(true);
    try {
      const [o, a] = await Promise.all([api.admin.overview(eventId), api.admin.analytics(eventId)]);
      setOverview(o);
      setAnalytics(a);
      setNote("Dashboard updated.");
    } catch (e) {
      setErr(e.message ?? "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!socket || !eventId) return;
    socket.emit("event:join", { eventId });

    const onAny = () => loadAll();
    socket.on("registration:counter", onAny);
    socket.on("team:created", onAny);
    socket.on("team:updated", onAny);
    socket.on("submission:updated", onAny);
    socket.on("leaderboard:dirty", onAny);

    return () => {
      socket.off("registration:counter", onAny);
      socket.off("team:created", onAny);
      socket.off("team:updated", onAny);
      socket.off("submission:updated", onAny);
      socket.off("leaderboard:dirty", onAny);
      socket.emit("event:leave", { eventId });
    };
  }, [socket, eventId]);

  const byCollege = useMemo(() => analytics?.byCollege ?? [], [analytics]);
  const byDepartment = useMemo(() => analytics?.byDepartment ?? [], [analytics]);
  const byYear = useMemo(() => analytics?.byYear ?? [], [analytics]);
  const skills = useMemo(() => analytics?.skillDistribution ?? [], [analytics]);
  const trend = useMemo(() => analytics?.registrationTrend ?? [], [analytics]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <BrandMark />
        <div className="flex items-center gap-3">
          <Badge tone={connected ? "good" : "warn"}>{connected ? "Realtime connected" : "Realtime offline"}</Badge>
          <Button variant="secondary" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-5">
          <Card>
            <CardHeader title="Admin" subtitle={user.email} />
            <CardBody className="text-sm text-forge-muted">
              Operational dashboard with live counters and analytics derived from registrations and submissions.
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Event workspace" subtitle="Paste Event ID" />
            <CardBody className="space-y-3">
              <Input label="Event ID" value={eventId} onChange={(e) => setEventId(e.target.value)} placeholder="Mongo ObjectId" />
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={loadAll} disabled={!eventId || loading}>
                  Load
                </Button>
                <Button variant="ghost" onClick={loadAll} disabled={!eventId || loading}>
                  Refresh
                </Button>
              </div>
              {note ? <div className="text-xs text-forge-muted">{note}</div> : null}
              {err ? <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">{err}</div> : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Live counters" subtitle="Registrations • Teams • Submissions" />
            <CardBody className="grid grid-cols-3 gap-3">
              {["registrations", "teams", "submissions"].map((k) => (
                <div key={k} className="rounded-xl border border-forge-line bg-forge-panel2/40 p-3">
                  <div className="text-xs text-forge-muted">{k}</div>
                  <div className="mt-1 text-lg font-semibold">{overview?.counters?.[k] ?? "—"}</div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-5">
          <Card>
            <CardHeader title="Registration trend" subtitle="Daily registrations" />
            <CardBody className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="rgba(234,240,255,0.55)" tick={{ fontSize: 11 }} interval={0} />
                  <YAxis stroke="rgba(234,240,255,0.55)" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#0B1020", border: "1px solid rgba(255,255,255,0.08)" }} />
                  <Line type="monotone" dataKey="count" stroke="#6D5EF3" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <div className="grid gap-5 md:grid-cols-2">
            <Card>
              <CardHeader title="Top colleges" subtitle="Participation distribution" />
              <CardBody className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCollege}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="key" stroke="rgba(234,240,255,0.55)" tick={{ fontSize: 11 }} interval={0} angle={-18} height={60} />
                    <YAxis stroke="rgba(234,240,255,0.55)" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#0B1020", border: "1px solid rgba(255,255,255,0.08)" }} />
                    <Bar dataKey="value" fill="#22D3EE" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Top skills" subtitle="Self-reported distribution" />
              <CardBody className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skills}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="key" stroke="rgba(234,240,255,0.55)" tick={{ fontSize: 11 }} interval={0} angle={-18} height={60} />
                    <YAxis stroke="rgba(234,240,255,0.55)" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#0B1020", border: "1px solid rgba(255,255,255,0.08)" }} />
                    <Bar dataKey="value" fill="#6D5EF3" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Card>
              <CardHeader title="Departments" subtitle="Distribution" />
              <CardBody className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byDepartment}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="key" stroke="rgba(234,240,255,0.55)" tick={{ fontSize: 11 }} interval={0} angle={-18} height={60} />
                    <YAxis stroke="rgba(234,240,255,0.55)" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#0B1020", border: "1px solid rgba(255,255,255,0.08)" }} />
                    <Bar dataKey="value" fill="#A78BFA" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Year-wise" subtitle="Distribution" />
              <CardBody className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byYear}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="key" stroke="rgba(234,240,255,0.55)" tick={{ fontSize: 11 }} interval={0} />
                    <YAxis stroke="rgba(234,240,255,0.55)" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#0B1020", border: "1px solid rgba(255,255,255,0.08)" }} />
                    <Bar dataKey="value" fill="#34D399" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

