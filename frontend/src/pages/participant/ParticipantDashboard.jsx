import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BrandMark } from "../../components/Brand.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card, CardBody, CardHeader } from "../../components/ui/Card.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { useAuth } from "../../state/auth/AuthContext.jsx";
import { api } from "../../services/api.js";
import { useSocket } from "../../state/realtime/SocketContext.jsx";

export function ParticipantDashboard() {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();

  const [eventId, setEventId] = useState("");
  const [myTeam, setMyTeam] = useState(null);
  const [joinCode, setJoinCode] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teammates, setTeammates] = useState([]);
  const [teamSuggestions, setTeamSuggestions] = useState([]);

  const [submission, setSubmission] = useState({
    projectTitle: "",
    projectDescription: "",
    githubUrl: "",
    demoUrl: "",
    presentationUrl: ""
  });

  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  async function loadTeam() {
    if (!eventId) return;
    const d = await api.participant.myTeam(eventId);
    setMyTeam(d.team ?? null);
  }

  async function loadSuggestions() {
    if (!eventId) return;
    // teammate suggestions depend on whether the user has a team;
    // backend enforces it, so we call and gracefully handle errors.
    const a = await api.participant.teammateSuggestions(eventId).catch(() => ({ suggestions: [] }));
    setTeammates(a.suggestions ?? []);

    const b = await api.participant.teamSuggestions(eventId).catch(() => ({ suggestions: [] }));
    setTeamSuggestions(b.suggestions ?? []);
  }

  async function loadMySubmission() {
    if (!eventId) return;
    const d = await api.participant.mySubmission(eventId);
    if (!d.submission) return;
    setSubmission({
      projectTitle: d.submission.projectTitle ?? "",
      projectDescription: d.submission.projectDescription ?? "",
      githubUrl: d.submission.githubUrl ?? "",
      demoUrl: d.submission.demoUrl ?? "",
      presentationUrl: d.submission.presentationUrl ?? ""
    });
  }

  useEffect(() => {
    if (!socket || !eventId) return;
    socket.emit("event:join", { eventId });
    const onNewAnnouncement = () => setNote("New announcement received.");
    const onNotification = async () => {
      const d = await api.announcements.myNotifications().catch(() => ({ notifications: [] }));
      setNotifications(d.notifications ?? []);
    };
    socket.on("announcement:new", onNewAnnouncement);
    socket.on("notification:new", onNotification);
    return () => {
      socket.off("announcement:new", onNewAnnouncement);
      socket.off("notification:new", onNotification);
      socket.emit("event:leave", { eventId });
    };
  }, [socket, eventId]);

  useEffect(() => {
    api.announcements.myNotifications()
      .then((d) => setNotifications(d.notifications ?? []))
      .catch(() => setNotifications([]));
  }, []);

  async function onRegister() {
    setErr("");
    setLoading(true);
    try {
      await api.participant.register(eventId);
      await loadTeam();
      await loadMySubmission();
      setNote("Registered.");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onCreateTeam() {
    setErr("");
    setLoading(true);
    try {
      await api.participant.createTeam({ eventId, teamName });
      await loadTeam();
      await loadSuggestions();
      setNote("Team created.");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onJoinTeam() {
    setErr("");
    setLoading(true);
    try {
      await api.participant.joinTeam({ eventId, joinCode });
      await loadTeam();
      await loadSuggestions();
      setNote("Joined team.");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onSaveSubmission() {
    setErr("");
    setLoading(true);
    try {
      await api.participant.upsertMySubmission(eventId, submission);
      setNote("Submission saved.");
      await loadMySubmission();
    } catch (e) {
      setErr(e.message);
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
            <CardHeader title="Your profile" subtitle={user.email} />
            <CardBody className="text-sm text-forge-muted space-y-2">
              <div className="text-forge-text font-medium">{user.participantProfile?.fullName ?? "Participant"}</div>
              <div>{user.participantProfile?.college ?? ""}</div>
              <div className="flex flex-wrap gap-2">
                {(user.participantProfile?.skills ?? []).slice(0, 8).map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Event workspace" subtitle="Paste Event ID" />
            <CardBody className="space-y-3">
              <Input label="Event ID" value={eventId} onChange={(e) => setEventId(e.target.value)} placeholder="Mongo ObjectId" />
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={onRegister} disabled={!eventId || loading}>
                  Register
                </Button>
                <Button
                  variant="ghost"
                  disabled={!eventId || loading}
                  onClick={async () => {
                    setErr("");
                    try {
                      await loadTeam();
                      await loadMySubmission();
                      await loadSuggestions();
                      setNote("Workspace loaded.");
                    } catch (e) {
                      setErr(e.message);
                    }
                  }}
                >
                  Load
                </Button>
              </div>
              {note ? <div className="text-xs text-forge-muted">{note}</div> : null}
              {err ? <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">{err}</div> : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Team status" subtitle="Solo or team-based" />
            <CardBody>
              {myTeam ? (
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{myTeam.name}</div>
                    <Badge tone="accent">Code: {myTeam.joinCode}</Badge>
                  </div>
                  <div className="mt-2 text-xs text-forge-muted">
                    Members: {myTeam.memberUserIds?.length ?? 0} / {myTeam.maxSize}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-forge-muted">Register, then create or join a team.</div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Notifications" subtitle="Realtime announcements & deadlines" />
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
            <CardHeader
              title="Team formation"
              subtitle="Create team or join with code"
              right={
                <Button variant="ghost" disabled={!eventId || loading} onClick={loadSuggestions}>
                  Refresh
                </Button>
              }
            />
            <CardBody className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="text-sm font-medium">Create team</div>
                <Input label="Team name" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Team Neon" />
                <Button onClick={onCreateTeam} disabled={!eventId || !teamName || loading}>
                  Create
                </Button>
              </div>
              <div className="space-y-3">
                <div className="text-sm font-medium">Join team</div>
                <Input label="Join code" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="AB12CD34" />
                <Button onClick={onJoinTeam} disabled={!eventId || !joinCode || loading}>
                  Join
                </Button>
              </div>
            </CardBody>
          </Card>

          <div className="grid gap-5 md:grid-cols-2">
            <Card>
              <CardHeader title="Suggested teammates" subtitle="Complements your team" />
              <CardBody className="space-y-2">
                {teammates.map((s) => (
                  <div key={s.user.id} className="rounded-xl border border-forge-line bg-forge-panel2/40 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{s.user.fullName || s.user.email}</div>
                      <Badge>{Math.round(s.score * 10) / 10}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-forge-muted">{s.user.college}</div>
                  </div>
                ))}
                {!teammates.length ? <div className="text-sm text-forge-muted">No suggestions yet.</div> : null}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Suggested teams" subtitle="Smart matching based on skills/experience" />
              <CardBody className="space-y-2">
                {teamSuggestions.map((t) => (
                  <div key={t.team.id} className="rounded-xl border border-forge-line bg-forge-panel2/40 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{t.team.name}</div>
                      <Badge>{Math.round(t.score * 10) / 10}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-forge-muted">
                      Size: {t.team.size}/{t.team.maxSize}
                    </div>
                  </div>
                ))}
                {!teamSuggestions.length ? <div className="text-sm text-forge-muted">No team suggestions yet.</div> : null}
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader title="Submission portal" subtitle="Edits allowed until deadline (server enforced)" />
            <CardBody className="space-y-3">
              <Input label="Project title" value={submission.projectTitle} onChange={(e) => setSubmission((p) => ({ ...p, projectTitle: e.target.value }))} />

              <label className="block">
                <div className="mb-1 text-sm text-forge-muted">Project description</div>
                <textarea
                  className="min-h-28 w-full rounded-xl border border-forge-line bg-forge-panel2/60 px-3 py-2 text-sm outline-none focus:border-forge-accent/60 focus:ring-2 focus:ring-forge-accent/20"
                  value={submission.projectDescription}
                  onChange={(e) => setSubmission((p) => ({ ...p, projectDescription: e.target.value }))}
                />
              </label>

              <div className="grid gap-3 md:grid-cols-3">
                <Input label="GitHub URL" value={submission.githubUrl} onChange={(e) => setSubmission((p) => ({ ...p, githubUrl: e.target.value }))} />
                <Input label="Demo URL" value={submission.demoUrl} onChange={(e) => setSubmission((p) => ({ ...p, demoUrl: e.target.value }))} />
                <Input label="PPT URL" value={submission.presentationUrl} onChange={(e) => setSubmission((p) => ({ ...p, presentationUrl: e.target.value }))} />
              </div>

              <div className="flex items-center justify-between gap-3">
                <Link to={eventId ? `/events/${eventId}/leaderboard` : "/events"}>
                  <Button variant="secondary" disabled={!eventId}>
                    View leaderboard
                  </Button>
                </Link>
                <Button onClick={onSaveSubmission} disabled={!eventId || !submission.projectTitle || loading}>
                  Save submission
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

