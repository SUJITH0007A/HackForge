import React, { useEffect, useState } from "react";
import { BrandMark } from "../../components/Brand.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card, CardBody, CardHeader } from "../../components/ui/Card.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { useAuth } from "../../state/auth/AuthContext.jsx";
import { api } from "../../services/api.js";
import { useSocket } from "../../state/realtime/SocketContext.jsx";

export function JudgeDashboard() {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();

  const [eventId, setEventId] = useState("");
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [submission, setSubmission] = useState(null);

  const [criteria, setCriteria] = useState([]);
  const [scores, setScores] = useState({});
  const [remarks, setRemarks] = useState("");

  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!socket || !eventId) return;
    socket.emit("event:join", { eventId });
    const onScore = () => setNote("Score submitted. Leaderboard updates.");
    const onNotification = async () => {
      const d = await api.announcements.myNotifications().catch(() => ({ notifications: [] }));
      setNotifications(d.notifications ?? []);
    };
    socket.on("judge:score:submitted", onScore);
    socket.on("notification:new", onNotification);
    return () => {
      socket.off("judge:score:submitted", onScore);
      socket.off("notification:new", onNotification);
      socket.emit("event:leave", { eventId });
    };
  }, [socket, eventId]);

  useEffect(() => {
    api.announcements.myNotifications()
      .then((d) => setNotifications(d.notifications ?? []))
      .catch(() => setNotifications([]));
  }, []);

  async function loadRubric() {
    if (!eventId) return;
    const d = await api.judge.criteria(eventId);
    const c = d.judgingCriteria ?? [];
    setCriteria(c);
    const initial = {};
    for (const item of c) initial[item.key] = 7;
    setScores(initial);
  }

  async function loadAssigned() {
    if (!eventId) return;
    setErr("");
    setLoading(true);
    try {
      const d = await api.judge.assignedTeams(eventId);
      setTeams(d.teams ?? []);
      setSelectedTeamId("");
      setSubmission(null);
      await loadRubric();
      setNote("Loaded assigned teams.");
    } catch (e) {
      setErr(e.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function loadSubmission(teamId) {
    setErr("");
    try {
      const d = await api.judge.submission(eventId, teamId);
      setSubmission(d.submission ?? null);
    } catch (e) {
      setErr(e.message ?? "Failed to load submission");
    }
  }

  async function submitScore() {
    setErr("");
    setLoading(true);
    try {
      const payload = { scores, remarks };
      const res = await api.judge.score(eventId, selectedTeamId, payload);
      setNote(`Score saved (total: ${res.evaluation?.totalScore ?? "—"}).`);
    } catch (e) {
      setErr(e.message ?? "Failed to submit score");
    } finally {
      setLoading(false);
    }
  }

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
            <CardHeader title="Judge" subtitle={user.email} />
            <CardBody className="text-sm text-forge-muted">
              <div className="text-forge-text font-medium">{user.judgeProfile?.fullName ?? "Judge"}</div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Event workspace" subtitle="Paste Event ID to load assignments" />
            <CardBody className="space-y-3">
              <Input label="Event ID" value={eventId} onChange={(e) => setEventId(e.target.value)} placeholder="Mongo ObjectId" />
              <Button className="w-full" variant="secondary" onClick={loadAssigned} disabled={!eventId || loading}>
                Load assigned teams
              </Button>
              {note ? <div className="text-xs text-forge-muted">{note}</div> : null}
              {err ? <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">{err}</div> : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Assigned teams" subtitle="You can only score these" />
            <CardBody className="space-y-2">
              {teams.map((t) => (
                <button
                  key={t._id}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                    selectedTeamId === t._id ? "border-forge-accent/50 bg-forge-accent/10" : "border-forge-line bg-white/5 hover:bg-white/7"
                  }`}
                  onClick={async () => {
                    setSelectedTeamId(t._id);
                    setRemarks("");
                    await loadSubmission(t._id);
                  }}
                >
                  <div className="font-medium">{t.name}</div>
                  <div className="mt-1 text-xs text-forge-muted">Members: {t.memberUserIds?.length ?? 0}</div>
                </button>
              ))}
              {!teams.length ? <div className="text-sm text-forge-muted">No assignments yet.</div> : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Notifications" subtitle="Realtime updates" />
            <CardBody className="space-y-2">
              {notifications.slice(0, 6).map((n) => (
                <div key={n._id} className="rounded-xl border border-forge-line bg-forge-panel2/40 p-3">
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="mt-1 text-xs text-forge-muted">{n.message}</div>
                </div>
              ))}
              {!notifications.length ? <div className="text-sm text-forge-muted">No notifications yet.</div> : null}
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-5">
          <Card>
            <CardHeader title="Submission" subtitle={selectedTeamId ? "Scoring workspace" : "Select a team"} />
            <CardBody>
              {submission ? (
                <div className="space-y-3 text-sm">
                  <div className="text-lg font-semibold">{submission.projectTitle}</div>
                  <div className="text-forge-muted whitespace-pre-wrap">{submission.projectDescription}</div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {submission.githubUrl ? (
                      <a className="rounded-xl border border-forge-line bg-white/5 px-3 py-2 text-xs hover:bg-white/10" href={submission.githubUrl} target="_blank" rel="noreferrer">
                        GitHub
                      </a>
                    ) : null}
                    {submission.demoUrl ? (
                      <a className="rounded-xl border border-forge-line bg-white/5 px-3 py-2 text-xs hover:bg-white/10" href={submission.demoUrl} target="_blank" rel="noreferrer">
                        Demo
                      </a>
                    ) : null}
                    {submission.presentationUrl ? (
                      <a className="rounded-xl border border-forge-line bg-white/5 px-3 py-2 text-xs hover:bg-white/10" href={submission.presentationUrl} target="_blank" rel="noreferrer">
                        PPT
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-forge-muted">No submission loaded.</div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Rubric scoring" subtitle="Enter 0–10 per criterion (total is weighted)" />
            <CardBody className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                {criteria.map((c) => (
                  <label key={c.key} className="block">
                    <div className="mb-1 text-sm text-forge-muted">{c.label}</div>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={scores[c.key] ?? 0}
                      onChange={(e) => setScores((prev) => ({ ...prev, [c.key]: Number(e.target.value) }))}
                      className="w-full rounded-xl border border-forge-line bg-forge-panel2/60 px-3 py-2 text-sm outline-none focus:border-forge-accent/60 focus:ring-2 focus:ring-forge-accent/20"
                    />
                  </label>
                ))}
              </div>

              <label className="block">
                <div className="mb-1 text-sm text-forge-muted">Remarks</div>
                <textarea
                  className="min-h-24 w-full rounded-xl border border-forge-line bg-forge-panel2/60 px-3 py-2 text-sm outline-none focus:border-forge-accent/60 focus:ring-2 focus:ring-forge-accent/20"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </label>

              <div className="flex items-center justify-end">
                <Button onClick={submitScore} disabled={!eventId || !selectedTeamId || loading}>
                  Submit score
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

