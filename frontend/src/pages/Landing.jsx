import React from "react";
import { Link } from "react-router-dom";
import { BrandMark } from "../components/Brand.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Card, CardBody, CardHeader } from "../components/ui/Card.jsx";
import { Badge } from "../components/ui/Badge.jsx";

export function Landing() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <BrandMark />
        <div className="flex items-center gap-3">
          <Link to="/events">
            <Button variant="secondary">Browse events</Button>
          </Link>
          <Link to="/login">
            <Button>Login</Button>
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-forge-line bg-white/5 px-3 py-1 text-xs text-forge-muted">
            <span className="h-2 w-2 rounded-full bg-forge-accent2" />
            Real-time event operations for college tech clubs
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            Run hackathons like a product team — not a spreadsheet.
          </h1>
          <p className="mt-4 max-w-xl text-base text-forge-muted">
            HackForge is an end-to-end event operating system: registrations, smart team formation, submissions, judge workflows,
            announcements, and live leaderboards.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/signup">
              <Button className="px-5">Create your account</Button>
            </Link>
            <Link to="/events">
              <Button variant="ghost">Explore events</Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            <Badge tone="accent">JWT + RBAC</Badge>
            <Badge tone="neutral">Socket.io realtime</Badge>
            <Badge tone="neutral">Judge scoring</Badge>
            <Badge tone="neutral">Analytics</Badge>
            <Badge tone="neutral">Team matcher</Badge>
          </div>
        </div>

        <div className="lg:col-span-5">
          <Card>
            <CardHeader title="Role-based dashboards" subtitle="Admin • Participant • Judge" />
            <CardBody className="space-y-4">
              <div className="rounded-xl border border-forge-line bg-forge-panel2/50 p-4">
                <div className="text-sm font-medium">Admin</div>
                <div className="mt-1 text-sm text-forge-muted">Live counters, skill distribution, judge assignments, analytics, announcements.</div>
              </div>
              <div className="rounded-xl border border-forge-line bg-forge-panel2/50 p-4">
                <div className="text-sm font-medium">Participant</div>
                <div className="mt-1 text-sm text-forge-muted">Register, form teams with join codes, submit before deadlines.</div>
              </div>
              <div className="rounded-xl border border-forge-line bg-forge-panel2/50 p-4">
                <div className="text-sm font-medium">Judge</div>
                <div className="mt-1 text-sm text-forge-muted">Assigned teams only, rubric-weighted scoring, remarks, live leaderboard.</div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

