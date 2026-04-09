import { Registration } from "../models/Registration.js";
import { Team } from "../models/Team.js";
import { User } from "../models/User.js";

function toSkillSet(arr) {
  return new Set((arr ?? []).map((s) => String(s).toLowerCase().trim()).filter(Boolean));
}

function overlapCount(a, b) {
  let c = 0;
  for (const x of a) if (b.has(x)) c++;
  return c;
}

function expValue(level) {
  if (level === "advanced") return 3;
  if (level === "intermediate") return 2;
  return 1;
}

function skillGapScore(teamSkills, candidateSkills) {
  // Prefer adding NEW skills to the team
  let newSkills = 0;
  for (const s of candidateSkills) if (!teamSkills.has(s)) newSkills++;
  return newSkills;
}

export async function suggestTeammates({ eventId, teamId, limit = 8 }) {
  const team = await Team.findOne({ _id: teamId, eventId }).lean();
  if (!team) return [];

  const regs = await Registration.find({ eventId, status: "registered" }).lean();
  const registeredUserIds = regs.map((r) => String(r.userId));
  const alreadyInTeam = new Set(team.memberUserIds.map((id) => String(id)));
  const usersInAnyTeam = new Set(regs.filter((r) => r.teamId).map((r) => String(r.userId)));

  const candidates = await User.find({ _id: { $in: registeredUserIds }, role: "participant", isActive: true }).lean();
  const teamMembers = await User.find({ _id: { $in: team.memberUserIds } }).lean();

  const teamSkillSet = new Set();
  let teamExpAvg = 0;
  for (const m of teamMembers) {
    const skills = toSkillSet(m.participantProfile?.skills);
    for (const s of skills) teamSkillSet.add(s);
    teamExpAvg += expValue(m.participantProfile?.experienceLevel);
  }
  teamExpAvg = teamMembers.length ? teamExpAvg / teamMembers.length : 1;

  const scored = [];
  for (const u of candidates) {
    const id = String(u._id);
    if (alreadyInTeam.has(id)) continue;
    if (usersInAnyTeam.has(id)) continue;

    const candSkills = toSkillSet(u.participantProfile?.skills);
    const adds = skillGapScore(teamSkillSet, candSkills);
    const redundant = overlapCount(teamSkillSet, candSkills);

    const exp = expValue(u.participantProfile?.experienceLevel);
    const expBalance = 1 - Math.min(1, Math.abs(exp - teamExpAvg) / 3);

    const score = adds * 3 + expBalance * 2 - redundant * 0.5;
    scored.push({
      user: {
        id,
        email: u.email,
        fullName: u.participantProfile?.fullName ?? "",
        college: u.participantProfile?.college ?? "",
        department: u.participantProfile?.department ?? "",
        year: u.participantProfile?.year ?? null,
        skills: u.participantProfile?.skills ?? [],
        experienceLevel: u.participantProfile?.experienceLevel ?? "beginner",
        links: u.participantProfile?.links ?? {}
      },
      score
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

export async function suggestTeamsForUser({ eventId, userId, limit = 6 }) {
  const user = await User.findById(userId).lean();
  if (!user?.participantProfile) return [];

  const reg = await Registration.findOne({ eventId, userId, status: "registered" }).lean();
  if (!reg || reg.teamId) return [];

  const userSkills = toSkillSet(user.participantProfile.skills);
  const exp = expValue(user.participantProfile.experienceLevel);

  const teams = await Team.find({ eventId, isLocked: false }).lean();

  // Build quick index for user data in teams
  const memberIds = [...new Set(teams.flatMap((t) => t.memberUserIds.map((id) => String(id))))];
  const members = await User.find({ _id: { $in: memberIds } }).lean();
  const usersById = new Map(members.map((m) => [String(m._id), m]));

  const alreadyMemberIds = new Set(teams.flatMap((t) => t.memberUserIds.map((id) => String(id))));
  if (alreadyMemberIds.has(String(userId))) return [];

  const out = [];
  for (const t of teams) {
    if ((t.memberUserIds?.length ?? 0) >= t.maxSize) continue;

    const teamSkillSet = new Set();
    let teamExpAvg = 0;
    for (const mid of t.memberUserIds) {
      const mu = usersById.get(String(mid));
      const skills = toSkillSet(mu?.participantProfile?.skills);
      for (const s of skills) teamSkillSet.add(s);
      teamExpAvg += expValue(mu?.participantProfile?.experienceLevel);
    }
    teamExpAvg = t.memberUserIds.length ? teamExpAvg / t.memberUserIds.length : 1;

    const adds = skillGapScore(teamSkillSet, userSkills);
    const redundant = overlapCount(teamSkillSet, userSkills);
    const expBalance = 1 - Math.min(1, Math.abs(exp - teamExpAvg) / 3);

    const score = adds * 3 + expBalance * 2 - redundant * 0.5 + (t.maxSize - t.memberUserIds.length) * 0.15;
    out.push({
      team: {
        id: String(t._id),
        name: t.name,
        size: t.memberUserIds.length,
        maxSize: t.maxSize
      },
      score
    });
  }

  out.sort((a, b) => b.score - a.score);
  return out.slice(0, limit);
}

