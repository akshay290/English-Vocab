# SSC Vocabulary Master — Setup Guide

A full-stack vocabulary preparation web app for SSC CGL, CHSL, CPO, MTS, and Banking exam aspirants.

---

## Quick Start (Replit)

The app is fully pre-configured in Replit. Just open the workspace — both workflows start automatically:

- **API Server** (`artifacts/api-server: API Server`) — Express + Drizzle ORM on port 8080
- **Frontend** (`artifacts/ssc-vocab: web`) — React + Vite on the assigned PORT

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `SESSION_SECRET` | ✅ | — | Secret key for signing JWT tokens (min 32 chars) |
| `ADMIN_PASSWORD` | ❌ | `sscvocab@admin2024` | Password for the admin panel (`/admin`) |
| `PORT` | ✅ | — | Port for the API server |
| `NODE_ENV` | ❌ | `development` | Set to `production` in production |

---

## Manual Local Setup

### Prerequisites

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- PostgreSQL 15+

### Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd <repo-dir>

# 2. Install all dependencies
pnpm install

# 3. Create a .env file in the project root
cat > .env << 'EOF'
DATABASE_URL=postgres://postgres:password@localhost:5432/sscvocab
SESSION_SECRET=your-super-secret-jwt-key-minimum-32-chars
ADMIN_PASSWORD=sscvocab@admin2024
EOF

# 4. Create the database
createdb sscvocab

# 5. Push the schema (creates all tables)
pnpm --filter @workspace/db run push

# 6. Seed vocabulary data
pnpm --filter @workspace/db run seed

# 7. Start the API server (in one terminal)
cd artifacts/api-server
PORT=8080 pnpm run dev

# 8. Start the frontend (in another terminal)
cd artifacts/ssc-vocab
PORT=5173 BASE_PATH=/ pnpm run dev
```

The app will be available at `http://localhost:5173`

---

## Docker Compose Setup

```bash
# 1. Clone and enter the directory
git clone <your-repo-url>
cd <repo-dir>

# 2. (Optional) Edit docker-compose.yml to change passwords

# 3. Build and start everything
docker compose up --build

# 4. Push schema & seed data (first time only)
docker compose exec api pnpm --filter @workspace/db run push
docker compose exec api pnpm --filter @workspace/db run seed
```

The app will be available at:
- Frontend: `http://localhost:3000`
- API: `http://localhost:8080`

---

## Admin Panel

Access the admin panel at `/admin`:

- **Default password:** `sscvocab@admin2024`
- Change it by setting the `ADMIN_PASSWORD` environment variable
- Admin features: manage vocabulary words, view users, bulk import words, see stats

---

## Features

| Feature | Description |
|---|---|
| 🔐 JWT Authentication | Secure register/login, token stored in localStorage (mobile-ready) |
| 📚 9 Vocabulary Categories | Synonyms, Antonyms, One-Word Substitution, Idioms & Phrases, Important Vocabulary, Phrasal Verbs, Root Words, Confusing Words, Spellings |
| 🎯 Custom MCQ Tests | Generate tests by category, difficulty, or alphabet |
| 🧠 Spaced Repetition | Smart revision scheduling based on word performance |
| 📊 Progress Tracking | Per-word status (new/learning/learned/weak), accuracy stats |
| 🏆 Leaderboard | Compare progress with other learners |
| 🔊 Text-to-Speech | Hear pronunciation of any word |
| 👤 Admin Panel | Add/manage vocabulary, view users, bulk import |

---

## Converting to Mobile App

This app is designed for easy mobile conversion:

1. The API uses JWT tokens (not session cookies) — works natively in React Native
2. `setAuthTokenGetter` and `setBaseUrl` in `@workspace/api-client-react` are the only mobile-specific setup needed
3. Replace Wouter with React Navigation
4. The `@workspace/api-client-react` package works in Expo/React Native without changes

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS v4, shadcn/ui, Framer Motion, Wouter |
| API Client | Auto-generated from OpenAPI spec via Orval + TanStack Query |
| Backend | Node.js, Express, Drizzle ORM |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| ORM | Drizzle ORM with drizzle-kit migrations |
