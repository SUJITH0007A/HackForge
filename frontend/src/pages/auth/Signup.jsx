import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrandMark } from "../../components/Brand.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card, CardBody, CardHeader } from "../../components/ui/Card.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { useAuth } from "../../state/auth/AuthContext.jsx";

export function Signup() {
  const nav = useNavigate();
  const { signup } = useAuth();

  const [role, setRole] = useState("participant");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [skills, setSkills] = useState("frontend, backend");
  const [experienceLevel, setExperienceLevel] = useState("beginner");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("2");

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const parsedSkills = useMemo(
    () =>
      skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 25),
    [skills]
  );

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await signup({
        role,
        fullName,
        email,
        password,
        skills: role === "participant" ? parsedSkills : undefined,
        experienceLevel: role === "participant" ? experienceLevel : undefined,
        college: role === "participant" ? college : undefined,
        department: role === "participant" ? department : undefined,
        year: role === "participant" ? Number(year) : undefined
      });
      nav("/dashboard");
    } catch (e2) {
      setErr(e2.message ?? "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <BrandMark />
      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Card>
            <CardHeader title="Create account" subtitle="Participant or Judge" />
            <CardBody>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block">
                    <div className="mb-1 text-sm text-forge-muted">Role</div>
                    <select
                      className="w-full rounded-xl border border-forge-line bg-forge-panel2/60 px-3 py-2 text-sm outline-none focus:border-forge-accent/60 focus:ring-2 focus:ring-forge-accent/20"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="participant">Participant</option>
                      <option value="judge">Judge</option>
                    </select>
                  </label>
                  <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" />
                  <Input label="Password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Min 8 characters" />
                </div>

                {role === "participant" ? (
                  <>
                    <div className="grid gap-3 md:grid-cols-3">
                      <Input label="College" value={college} onChange={(e) => setCollege(e.target.value)} placeholder="College name" />
                      <Input label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="CSE / ECE / …" />
                      <Input label="Year" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2" />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input label="Skills (comma separated)" value={skills} onChange={(e) => setSkills(e.target.value)} hint="Example: frontend, backend, ui/ux, ai/ml" />
                      <label className="block">
                        <div className="mb-1 text-sm text-forge-muted">Experience</div>
                        <select
                          className="w-full rounded-xl border border-forge-line bg-forge-panel2/60 px-3 py-2 text-sm outline-none focus:border-forge-accent/60 focus:ring-2 focus:ring-forge-accent/20"
                          value={experienceLevel}
                          onChange={(e) => setExperienceLevel(e.target.value)}
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </label>
                    </div>
                  </>
                ) : null}

                {err ? <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">{err}</div> : null}
                <Button className="w-full" disabled={loading}>
                  {loading ? "Creating…" : "Create account"}
                </Button>
                <div className="text-sm text-forge-muted">
                  Already have an account?{" "}
                  <Link className="text-forge-text underline decoration-forge-accent/60 underline-offset-4" to="/login">
                    Login
                  </Link>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
        <div className="lg:col-span-5">
          <Card>
            <CardHeader title="Premium platform" subtitle="Startup-grade event workflows" />
            <CardBody className="text-sm text-forge-muted">
              After login, choose an event by Event ID and run the full workflow: registration → teams → submissions → judge scoring → realtime leaderboard.
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

