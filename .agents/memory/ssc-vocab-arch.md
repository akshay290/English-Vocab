---
name: SSC Vocab App Architecture
description: Key architecture decisions for the SSC Vocabulary Master app — scoring, stats source of truth, routing, env vars.
---

## Scoring formula
+2 correct, −0.5 incorrect, 0 unattempted. Score stored as `real` (not integer) in `tests.score`. Max score = `totalQuestions × 2`. Percentage = `score / maxScore * 100`.

**Why:** User requested SSC-exam-style negative marking. Decimal scores require `real` column type.

**How to apply:** All score calculations in `artifacts/api-server/src/routes/tests.ts` submit handler. After any schema change, run `pnpm --filter @workspace/db run push`.

## Stats source of truth
All progress stats (wordsLearned, averageAccuracy, categoryBreakdown, leaderboard) are computed from `test_questions` table results, NOT from `user_word_progress` status field. This was changed because manual status updates were unreliable and didn't reflect test performance.

**Why:** `user_word_progress.status = 'learned'` required 3 correct answers and never updated properly. Stats now update after every test.

**How to apply:** `artifacts/api-server/src/routes/progress.ts` and `stats.ts` both use raw SQL joining `test_questions` + `tests`.

## Overall Mastery definition
= distinct words correct in tests / distinct words attempted in tests × 100. NOT relative to total vocab in DB.

## Average Accuracy definition
= total correct answers / total non-null (attempted) answers × 100, to 2 decimal places.

## Back navigation fix
Redirects to result page after test submission use `{ replace: true }` in wouter's `setLocation`. Prevents back-button loop (user presses back → lands on active test URL → immediately redirects to result again).

## API server env vars
DATABASE_URL and SESSION_SECRET are Replit-managed runtime vars. Do NOT use `--env-file` flag in the start script. PORT must be explicitly set in the workflow command: `PORT=8080 pnpm --filter @workspace/api-server run dev`.

## RadioGroup answer carry-over fix
Added `key={currentQuestion.id}` to the RadioGroup in ActiveTest.tsx. Forces React to unmount/remount the component on question change, clearing any lingering selection state.
