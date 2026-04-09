const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000";

function getTokens() {
  try {
    const raw = localStorage.getItem("hackforge.tokens");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setTokens(tokens) {
  localStorage.setItem("hackforge.tokens", JSON.stringify(tokens));
}

function clearTokens() {
  localStorage.removeItem("hackforge.tokens");
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const tokens = getTokens();
  const headers = { "Content-Type": "application/json" };
  if (auth && tokens?.accessToken) headers.Authorization = `Bearer ${tokens.accessToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (res.status === 401 && auth && tokens?.refreshToken) {
    const rr = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: tokens.refreshToken })
    });

    if (rr.ok) {
      const refreshed = await rr.json();
      setTokens(refreshed);
      return await request(path, { method, body, auth });
    }
    clearTokens();
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message ?? "Request failed";
    const err = new Error(msg);
    err.details = data?.error?.details;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  tokens: { getTokens, setTokens, clearTokens },

  auth: {
    signup: (payload) => request("/api/auth/signup", { method: "POST", body: payload, auth: false }),
    login: (payload) => request("/api/auth/login", { method: "POST", body: payload, auth: false }),
    me: () => request("/api/auth/me", { method: "GET" })
  },

  events: {
    listPublished: () => request("/api/events", { auth: false }),
    getPublic: (eventId) => request(`/api/events/${eventId}/public`, { auth: false })
  },

  participant: {
    register: (eventId) => request(`/api/events/${eventId}/register`, { method: "POST" }),
    myTeam: (eventId) => request(`/api/events/${eventId}/my-team`),
    createTeam: (payload) => request(`/api/teams/create`, { method: "POST", body: payload }),
    joinTeam: (payload) => request(`/api/teams/join`, { method: "POST", body: payload }),
    teammateSuggestions: (eventId) => request(`/api/events/${eventId}/suggestions/teammates`),
    teamSuggestions: (eventId) => request(`/api/events/${eventId}/suggestions/teams`),
    mySubmission: (eventId) => request(`/api/events/${eventId}/my`),
    upsertMySubmission: (eventId, payload) => request(`/api/events/${eventId}/my`, { method: "PUT", body: payload })
  },

  judge: {
    assignedTeams: (eventId) => request(`/api/judge/events/${eventId}/assigned-teams`),
    submission: (eventId, teamId) => request(`/api/judge/events/${eventId}/teams/${teamId}/submission`),
    criteria: (eventId) => request(`/api/judge/events/${eventId}/criteria`),
    score: (eventId, teamId, payload) => request(`/api/judge/events/${eventId}/teams/${teamId}/score`, { method: "PUT", body: payload })
  },

  leaderboard: {
    get: (eventId) => request(`/api/events/${eventId}/leaderboard`, { auth: false })
  },

  announcements: {
    list: (eventId) => request(`/api/events/${eventId}/announcements`),
    myNotifications: () => request(`/api/me/notifications`)
  },

  admin: {
    overview: (eventId) => request(`/api/admin/events/${eventId}/overview`),
    analytics: (eventId) => request(`/api/admin/events/${eventId}/analytics`),
    assignJudge: (eventId, teamId, payload) => request(`/api/admin/events/${eventId}/teams/${teamId}/assign-judge`, { method: "POST", body: payload })
  }
};

