# Running SSC Vocabulary Master on Windows

Follow these steps carefully. Each one matters.

---

## Step 1 — Install the Prerequisites

You need three tools installed. Check if you already have them:

Open **Command Prompt** or **PowerShell** and run:
```
node --version
pnpm --version
psql --version
```

If any of these show "not found", install them:

| Tool | Where to get it | Required version |
|------|----------------|-----------------|
| Node.js | https://nodejs.org → Download **LTS** | 20 or newer |
| pnpm | Run: `npm install -g pnpm` | 9 or newer |
| PostgreSQL | https://www.postgresql.org/download/windows/ | 15 or newer |

> **PostgreSQL tip:** During the installer, remember the password you set for the `postgres` user — you'll need it in Step 3.

---

## Step 2 — Install Dependencies

Open a terminal in the project root folder (where `package.json` is) and run:

```
pnpm install
```

Wait for it to finish (may take a minute or two the first time).

---

## Step 3 — Create Your `.env` File

In the project root folder, copy `.env.example` to `.env`:

**In File Explorer:** duplicate `.env.example`, rename the copy to `.env`

OR in PowerShell:
```
copy .env.example .env
```

Then open `.env` in Notepad (or any text editor) and update the `DATABASE_URL` line with your PostgreSQL password:

```
DATABASE_URL=postgres://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/sscvocab
```

Replace `YOUR_POSTGRES_PASSWORD` with the password you set when installing PostgreSQL.

The other lines can stay as-is for local development.

---

## Step 4 — Create the Database

Open **pgAdmin** (installed with PostgreSQL) or run in PowerShell:

```
psql -U postgres -c "CREATE DATABASE sscvocab;"
```

It will ask for your postgres password.

---

## Step 5 — Set Up the Database Tables

Run this in the project root:

```
pnpm --filter @workspace/db run push
```

This creates all the tables automatically. You should see output ending in something like "All migrations applied".

---

## Step 6 — Start the API Server

Open a **new terminal window** (keep it open), go to the project root, and run:

```
cd artifacts\api-server
pnpm run dev
```

Wait until you see: `Server listening` — that means the API is running on port 8080.

---

## Step 7 — Start the Frontend

Open **another new terminal window** (keep both open), go to the project root, and run:

```
cd artifacts\ssc-vocab
pnpm run dev
```

When you see output like `Local: http://localhost:5173`, open that URL in your browser.

---

## ✅ Done!

The app should be running at **http://localhost:5173**

Admin panel: **http://localhost:5173/admin**  
Default admin password: `sscvocab@admin2024`

---

## Common Errors and Fixes

### ❌ `Error: DATABASE_URL must be set`
→ Your `.env` file is missing or in the wrong folder. Make sure `.env` exists in the **project root** (same folder as `package.json`).

### ❌ `ECONNREFUSED` or `connection refused` when starting the API
→ PostgreSQL isn't running. Open **Services** in Windows (search "Services" in Start menu) and make sure `postgresql-x64-16` (or similar) is started.

### ❌ `database "sscvocab" does not exist`
→ You skipped Step 4. Run: `psql -U postgres -c "CREATE DATABASE sscvocab;"`

### ❌ `pnpm: command not found`
→ Run `npm install -g pnpm` then close and reopen your terminal.

### ❌ `pnpm run push` fails with auth error
→ The password in your `DATABASE_URL` doesn't match your PostgreSQL password. Edit `.env` and fix it.

### ❌ Port 5432 already in use
→ Another app is using the PostgreSQL port. Restart the PostgreSQL service from Windows Services.

### ❌ Port 8080 already in use
→ Change `PORT=8080` to `PORT=8081` in your `.env` file.

---

## Alternative: Docker (Easiest if you have Docker Desktop)

If you have Docker Desktop installed, this is the simplest option — no PostgreSQL setup needed:

```
docker compose up --build
```

Then in a second terminal (first-time only):
```
docker compose exec api pnpm --filter @workspace/db run push
```

App will be at **http://localhost:3000**

Get Docker Desktop at: https://www.docker.com/products/docker-desktop/
