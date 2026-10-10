# SSC Vocabulary Master

A full-stack vocabulary preparation web app for SSC CGL, CHSL, CPO, MTS, and Banking exam aspirants. Features MCQ tests, progress tracking, spaced repetition revision, leaderboard, and admin panel.

## Run & Operate

- **Frontend** — `npm --workspace=@workspace/ssc-vocab run dev` (Vite, Replit workflow: `artifacts/ssc-vocab: web`)
- **API Server** — `npm --workspace=@workspace/api-server run dev` (Express, Replit workflow: `artifacts/api-server: API Server`)
- `npm --workspace=@workspace/db run push` — push DB schema changes (dev only, run after schema edits)
- `npm --workspace=@workspace/db run seed` — seed vocabulary data
- `npm --workspace=@workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `npm run typecheck` — full typecheck across all packages
- `npm run build` — typecheck + build all packages

## Stack

- npm workspaces, Node.js 22.12+, TypeScript 5
- **Frontend**: React 18, Vite, TailwindCSS v4, shadcn/ui, Framer Motion, Wouter v3
- **API**: Express 5, PORT injected by workflow (`PORT=8080`)
- **DB**: PostgreSQL (Replit-managed) + Drizzle ORM
- **Auth**: JWT (jsonwebtoken + bcryptjs), SESSION_SECRET as Replit Secret
- **Codegen**: Orval (from OpenAPI spec) → TanStack Query hooks

## Where things live

- `artifacts/ssc-vocab/src/` — React frontend pages and components
- `artifacts/api-server/src/routes/` — Express route handlers
- `lib/db/src/schema/index.ts` — single source of truth for DB schema
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source for codegen)
- `lib/api-client-react/` — generated hooks (do not edit manually)

## Architecture decisions

- **Score formula**: +2 correct, −0.5 incorrect, 0 unattempted. Stored as `real` in `tests.score`. Max score = `totalQuestions × 2`.
- **Progress & mastery**: All stats (wordsLearned, averageAccuracy, categoryBreakdown) computed from `test_questions` results, not from `user_word_progress` manual status. This ensures stats update immediately after any test.
- **Overall Mastery**: words answered correctly at least once ÷ words attempted in tests × 100.
- **Average Accuracy**: total correct answers ÷ total attempted (non-null) answers × 100, to 2 decimal places.
- **Back navigation**: Completed-test redirects use `{ replace: true }` so the browser back button skips the in-progress test URL.
- Replit injects `DATABASE_URL` and `SESSION_SECRET` at runtime; the API exits at startup if `SESSION_SECRET` is missing. Do not commit local `.env` files.
- **Delete bug fix**: `test_questions` has no `onDelete cascade` on `vocab_item_id`. The delete route explicitly removes orphan test_questions before deleting the word.
- **Delete All Words** endpoint: `DELETE /api/admin/vocabulary` — clears test_questions + user_word_progress + vocabulary_items in that order.

## Gotchas

- After any schema change, run `npm --workspace=@workspace/db run push` before restarting the API.
- The `score` column in `tests` table is `real` (not integer) to support +2/−0.5 scoring.
- Wouter v3: use flat routes, avoid nested `Switch` with `/:rest*` (causes blank render).
- The `api-client-react` package uses a `custom-fetch` subpath export — must be in `package.json` exports.

## User preferences

- Keep all changes minimal — don't restructure or alter anything beyond what's explicitly requested.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
