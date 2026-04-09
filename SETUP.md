# HackForge setup & deployment

## Prerequisites
- Node.js 18+
- MongoDB (local `mongodb://127.0.0.1:27017` or a remote URI)

## 1) Install
From repo root:

```bash
npm install
```

## 2) Environment variables
Backend:
```bash
cd backend
copy .env.example .env
```
Frontend:
```bash
cd ../frontend
copy .env.example .env
```

Minimum required backend env:
- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

## 3) Run locally
In one terminal:
```bash
npm run dev:backend
```
In another:
```bash
npm run dev:frontend
```

- Backend: `http://localhost:4000`
- Frontend: `http://localhost:5173`

## 4) Verify core workflow (smoke test)
Use the API in order:
1. `POST /api/auth/signup` (create `admin`, `judge`, and a `participant`)
2. Admin: `POST /api/events` then set `isPublished=true`
3. Participant: `POST /api/events/:eventId/register`
4. Participant: `POST /api/teams/create` (or `/teams/join`)
5. Participant: `PUT /api/events/:eventId/my` (submission)
6. Admin: `POST /api/admin/events/:eventId/teams/:teamId/assign-judge`
7. Judge: `PUT /api/judge/events/:eventId/teams/:teamId/score`
8. Anyone: `GET /api/events/:eventId/leaderboard`

## Deployment guidance
### Frontend (Vercel)
Deploy the `frontend/` folder.
- Build: `npm run build`
- Output: `dist`
- Env: set `VITE_API_BASE=https://<your-backend-domain>`

### Backend (Render or Railway)
Deploy the `backend/` folder.
- Start: `npm start`
- Env: copy from `backend/.env.example`
- Ensure `CLIENT_ORIGIN` matches the deployed frontend URL.

