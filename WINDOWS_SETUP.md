# Run SSC Vocab Master on Windows

## Complete app with Docker Desktop

Install Docker Desktop and start it. In PowerShell:

```powershell
git clone https://github.com/akshay290/English-Vocab.git
cd English-Vocab
docker compose up --build
```

Open **http://localhost:3000**. This starts PostgreSQL, imports the OWS and idiom records, starts the API, and serves the original home page plus the illustrated collections. Login, tests, progress, revision, leaderboard, and admin pages use the API. The first build may take time because it includes 3,308 images. Docker keeps the database in a volume across restarts.

The example credentials in `docker-compose.yml` are for local development. Change them before exposing the app publicly.

## Complete app with a local PostgreSQL installation

Install Node.js 22.12 or newer and PostgreSQL 15 or newer. Start PostgreSQL, then run from the repository root:

```powershell
npm ci
Copy-Item .env.example .env
```

Edit `.env`: replace `YOUR_POSTGRES_PASSWORD` with your PostgreSQL password, and set your own `SESSION_SECRET` and `ADMIN_PASSWORD`. Create the database, then create the tables and import the 2027 collection:

```powershell
psql -U postgres -c "CREATE DATABASE sscvocab;"
npm --workspace=@workspace/db run push
npm --workspace=@workspace/db run seed
```

Start the API in one PowerShell window:

```powershell
npm run dev:api
```

Start the frontend in another window:

```powershell
npm run dev
```

Open **http://localhost:3000**. The frontend proxies `/api` requests to the API on port 8080.

## Illustrated library without PostgreSQL

If you only want to browse the new images and meanings, run `npm ci` and `npm run dev`, then open **http://localhost:3000/collections**. The original account and test features require the complete app setup above.
