import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BrandMark } from "../components/Brand.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Card, CardBody, CardHeader } from "../components/ui/Card.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { api } from "../services/api.js";

export function Events() {
  const [events, setEvents] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.events
      .listPublished()
      .then((d) => setEvents(d.events ?? []))
      .catch((e) => setErr(e.message ?? "Failed to load events"));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <BrandMark />
        <Link to="/login">
          <Button>Login</Button>
        </Link>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold tracking-tight">Active events</h2>
        <p className="mt-1 text-sm text-forge-muted">Browse published hackathons and contests.</p>
      </div>

      {err ? <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{err}</div> : null}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {events.map((e) => (
          <Card key={e._id}>
            <CardHeader title={e.title} subtitle={new Date(e.startAt).toLocaleString()} right={<Badge tone="accent">{e.eventType}</Badge>} />
            <CardBody>
              <div className="line-clamp-3 text-sm text-forge-muted">{e.description}</div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-xs text-forge-muted">Max team size: {e.maxTeamSize}</div>
                <Link to={`/events/${e._id}`}>
                  <Button variant="secondary">View details</Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        ))}
        {!events.length && !err ? (
          <Card>
            <CardHeader title="No events yet" subtitle="Admins create and publish events." />
            <CardBody className="text-sm text-forge-muted">
              When events are created and published, they’ll appear here with registration and leaderboard features.
            </CardBody>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

