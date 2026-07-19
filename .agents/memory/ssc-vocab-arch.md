---
name: SSC Vocab App Architecture
description: Key architecture decisions for the SSC Vocabulary Master app
---

## Stack
- Frontend: React + Vite at artifact `ssc-vocab` (preview path `/`)
- Backend: Express + Drizzle ORM at artifact `api-server`
- DB: Replit PostgreSQL, schema in `lib/db/src/schema/index.ts`
- API client: OpenAPI-generated via Orval in `lib/api-client-react`

## Auth
- JWT tokens signed with SESSION_SECRET env var
- Tokens stored in localStorage (not cookies) for mobile compatibility
- `setAuthTokenGetter(() => localStorage.getItem('auth_token'))` called in AuthContext on mount
- Admin panel uses a separate password-based auth (ADMIN_PASSWORD env var, default: sscvocab@admin2024)

## DB Tables
usersTable, vocabularyItemsTable, testsTable, testQuestionsTable, userWordProgressTable
- userWordProgressTable has unique constraint on (userId, vocabItemId) for ON CONFLICT upserts

## Seed data
60 vocabulary words seeded across 9 categories via executeSql in CodeExecution.
