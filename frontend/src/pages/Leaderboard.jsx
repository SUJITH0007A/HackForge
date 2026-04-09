import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BrandMark } from "../components/Brand.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Card, CardBody, CardHeader } from "../components/ui/Card.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { api } from "../services/api.js";
import { useSocket } from "../state/realtime/SocketContext.jsx";

export function Leaderboard() {
  const { eventId } = useParams();
  const { socket } = useSocket();
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const d = await api.leaderboard.get(eventId);
      setRows(d.leaderboard ?? []);
    } catch (e) {
      setErr(e.message ?? "Failed to load leaderboard");
    }
  }

  useEffect(() => {
    load();
  }, [eventId]);

  useEffect(() => {
    if (!socket) return;
    socket.emit("event:join", { eventId });
    const onDirty = (p) => {
      if (p?.eventId !== eventId) return;
      load();
    };
    socket.on("leaderboard:dirty", onDirty);
    return () => {
      socket.off("leaderboard:dirty", onDirty);
      socket.emit("event:leave", { eventId });
    };
  }, [socket, eventId]);

  const top3 = useMemo(() => rows.slice(0, 3), [rows]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <BrandMark />
        <div className="flex items-center gap-3">
          <Link to={`/events/${eventId}`}>
            <Button variant="secondary">Event</Button>
          </Link>
          <Link to="/events">
            <Button>All events</Button>
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Card>
            <CardHeader title="Top teams" subtitle="Updates when judges submit scores" />
            <CardBody className="space-y-3">
              {top3.map((r) => (
                <div key={r.team.id} className="rounded-xl border border-forge-line bg-forge-panel2/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">
                      #{r.rank} {r.team.name}
                    </div>
                    <Badge tone="accent">{r.avgScore}</Badge>
                  </div>
                  <div className="mt-2 text-xs text-forge-muted">Judges scored: {r.judgeCount}</div>
                </div>
              ))}
              {!rows.length ? <div className="text-sm text-forge-muted">No scores yet.</div> : null}
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card>
            <CardHeader
              title="Leaderboard"
              subtitle="Ranked by average weighted score"
              right={
                <Button variant="ghost" onClick={load}>
                  Refresh
                </Button>
              }
            />
            <CardBody>
              {err ? <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">{err}</div> : null}
              <div className="overflow-hidden rounded-xl border border-forge-line">
                <table className="w-full text-sm">
                  <thead className="bg-white/5 text-forge-muted">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Rank</th>
                      <th className="px-4 py-3 text-left font-medium">Team</th>
                      <th className="px-4 py-3 text-left font-medium">Avg score</th>
                      <th className="px-4 py-3 text-left font-medium">Judges</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.team.id} className="border-t border-forge-line">
                        <td className="px-4 py-3">{r.rank}</td>
                        <td className="px-4 py-3">{r.team.name}</td>
                        <td className="px-4 py-3">{r.avgScore}</td>
                        <td className="px-4 py-3 text-forge-muted">{r.judgeCount}</td>
                      </tr>
                    ))}
                    {!rows.length ? (
                      <tr>
                        <td className="px-4 py-8 text-forge-muted" colSpan={4}>
                          Waiting for judge evaluations…
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

