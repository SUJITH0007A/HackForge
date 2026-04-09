import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BrandMark } from "../components/Brand.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Card, CardBody, CardHeader } from "../components/ui/Card.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { api } from "../services/api.js";
import { useAuth } from "../state/auth/AuthContext.jsx";

export function EventDetails() {
  const { eventId } = useParams();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    setErr("");
    api.events
      .getPublic(eventId)
      .then((d) => setEvent(d.event))
      .catch((e) => setErr(e.message ?? "Failed to load event"));
  }, [eventId]);

  async function onRegister() {
    setErr("");
    setLoading(true);
    try {
      await api.participant.register(eventId);
      setRegistered(true);
    } catch (e) {
      setErr(e.message ?? "Failed to register");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <BrandMark />
        <div className="flex items-center gap-3">
          <Link to={`/events/${eventId}/leaderboard`}>
            <Button variant="secondary">Leaderboard</Button>
          </Link>
          {user ? (
            <Link to="/dashboard">
              <Button>Dashboard</Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button>Login</Button>
            </Link>
          )}
        </div>
      </div>

      {err ? <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{err}</div> : null}

      {event ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Card>
              <CardHeader title={event.title} subtitle={`${new Date(event.startAt).toLocaleString()} → ${new Date(event.endAt).toLocaleString()}`} right={<Badge tone="accent">{event.eventType}</Badge>} />
              <CardBody>
                <div className="text-sm text-forge-muted whitespace-pre-wrap">{event.description}</div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-forge-line bg-forge-panel2/40 p-4">
                    <div className="text-xs text-forge-muted">Registration deadline</div>
                    <div className="mt-1 text-sm">{new Date(event.registrationDeadlineAt).toLocaleString()}</div>
                  </div>
                  <div className="rounded-xl border border-forge-line bg-forge-panel2/40 p-4">
                    <div className="text-xs text-forge-muted">Submission deadline</div>
                    <div className="mt-1 text-sm">{new Date(event.submissionDeadlineAt).toLocaleString()}</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <Card>
              <CardHeader title="Registration" subtitle="Solo or team-based participation" />
              <CardBody className="space-y-3">
                <div className="text-sm text-forge-muted">Max team size: {event.maxTeamSize}</div>
                {user?.role === "participant" ? (
                  <Button className="w-full" disabled={loading || registered} onClick={onRegister}>
                    {registered ? "Registered" : loading ? "Registering…" : "Register for this event"}
                  </Button>
                ) : (
                  <div className="text-sm text-forge-muted">
                    {user ? "Only participants can register." : "Login as a participant to register."}
                  </div>
                )}
                <Link to="/events">
                  <Button className="w-full" variant="secondary">
                    Back to events
                  </Button>
                </Link>
              </CardBody>
            </Card>
          </div>
        </div>
      ) : (
        <div className="mt-8 text-sm text-forge-muted">Loading event…</div>
      )}
    </div>
  );
}

