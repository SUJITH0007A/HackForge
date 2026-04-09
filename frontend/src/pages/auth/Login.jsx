import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrandMark } from "../../components/Brand.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card, CardBody, CardHeader } from "../../components/ui/Card.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { useAuth } from "../../state/auth/AuthContext.jsx";

export function Login() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login({ email, password });
      // navigation depends on role, using user context is handled by RoleRedirect or explicit nav later
      nav("/dashboard");
    } catch (e2) {
      setErr(e2.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <BrandMark />
      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Card>
            <CardHeader title="Login" subtitle="Access your dashboard" />
            <CardBody>
              <form className="space-y-4" onSubmit={onSubmit}>
                <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" />
                <Input label="Password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" />
                {err ? <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">{err}</div> : null}
                <Button className="w-full" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
                <div className="text-sm text-forge-muted">
                  New here?{" "}
                  <Link className="text-forge-text underline decoration-forge-accent/60 underline-offset-4" to="/signup">
                    Create account
                  </Link>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
        <div className="lg:col-span-7">
          <Card>
            <CardHeader title="HackForge" subtitle="Realtime workflows for participants, judges, and admins" />
            <CardBody className="text-sm text-forge-muted">
              Login is JWT-based. After you sign in, use the event workspace (Event ID) to register, submit, score, and monitor
              the live leaderboard.
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

