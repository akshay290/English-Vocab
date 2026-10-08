# SSC Vocab Master

A vocabulary study app with accounts, tests, progress tracking, a Strong Words list, revision, leaderboard, and an illustrated 2027 collection of **2,027 one-word substitutions** and **1,281 idioms**. The original home page and vocabulary browser remain in place; the illustrated collection is available at `/collections`.

## Run the complete app

Install Docker Desktop, then run:

```bash
git clone https://github.com/akshay290/English-Vocab.git
cd English-Vocab
docker compose up --build
```

Open **http://localhost:3000**. Compose starts PostgreSQL, creates the schema, imports the bundled vocabulary, starts the API, and serves the frontend. Account, test, mastery, revision, and admin features use this API. The first build can take time because the repository includes 3,308 images. The database is kept in a Docker volume when the app stops. Change the example database, session, and admin credentials in `docker-compose.yml` before making the app public.

## Browse the illustrated collection without Docker

With Node.js 22.12 or newer:

```bash
npm ci
npm run dev
```

Open **http://localhost:3000/collections**. The illustrated OWS and idiom pages work from bundled JSON and images without the API. Account, test, vocabulary browser, progress, and revision pages require the complete app above or a manually configured PostgreSQL and API server; see [SETUP.md](SETUP.md).

## Data

The datasets are in `artifacts/ssc-vocab/public/data`. Each JSON `entries` array contains the word or idiom, English meaning, Hindi meaning, source metadata, and an `image` path to a matching local JPG. The database import uses stable source keys, so restarting the stack does not duplicate records or reset user progress. The data QA report flags 696 OWS entries for proofreading against their source cards. See the [data notes](artifacts/ssc-vocab/public/data/README.md).
