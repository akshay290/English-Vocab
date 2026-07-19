import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { vocabularyItemsTable, testsTable, testQuestionsTable, userWordProgressTable, usersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { GetLeaderboardQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

// GET /stats/dashboard
router.get("/stats/dashboard", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const [testCountStats, wordsLearnedResult, avgAccuracyResult, weakWordsResult, recentTests, todayCorrectResult] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(testsTable)
        .where(and(eq(testsTable.userId, userId), eq(testsTable.status, "completed"))),

      // Words learned = distinct vocab answered correctly at least once in any completed test
      db.execute(sql`
        SELECT COUNT(DISTINCT tq.vocab_item_id)::int AS count
        FROM test_questions tq
        JOIN tests t ON tq.test_id = t.id
        WHERE t.user_id = ${userId} AND t.status = 'completed' AND tq.is_correct = true
      `),

      // Average accuracy = total correct / total attempted (2 decimal places)
      db.execute(sql`
        SELECT ROUND(
          COALESCE(
            COUNT(*) FILTER (WHERE tq.is_correct = true)::numeric /
            NULLIF(COUNT(*) FILTER (WHERE tq.user_answer IS NOT NULL), 0) * 100,
            0
          ), 2
        ) AS accuracy
        FROM test_questions tq
        JOIN tests t ON tq.test_id = t.id
        WHERE t.user_id = ${userId} AND t.status = 'completed'
      `),

      // Weak words = words attempted in tests but never answered correctly
      db.execute(sql`
        SELECT COUNT(DISTINCT tq.vocab_item_id)::int AS count
        FROM test_questions tq
        JOIN tests t ON tq.test_id = t.id
        WHERE t.user_id = ${userId} AND t.status = 'completed'
          AND tq.vocab_item_id NOT IN (
            SELECT DISTINCT tq2.vocab_item_id
            FROM test_questions tq2
            JOIN tests t2 ON tq2.test_id = t2.id
            WHERE t2.user_id = ${userId} AND t2.status = 'completed' AND tq2.is_correct = true
          )
      `),

      db
        .select()
        .from(testsTable)
        .where(eq(testsTable.userId, userId))
        .orderBy(sql`${testsTable.createdAt} DESC`)
        .limit(5),

      // Today's correct answers for daily goal (goal = 10 correct answers per day)
      db.execute(sql`
        SELECT COUNT(*)::int AS count
        FROM test_questions tq
        JOIN tests t ON tq.test_id = t.id
        WHERE t.user_id = ${userId} AND t.status = 'completed'
          AND tq.is_correct = true
          AND t.completed_at >= CURRENT_DATE
      `),
    ]);

    type Row = { count: string | number };
    const wordsLearned = Number((wordsLearnedResult.rows as Row[])[0]?.count ?? 0);
    const averageAccuracy = Number((avgAccuracyResult.rows as Array<{ accuracy: string | number }>)[0]?.accuracy ?? 0);
    const weakWordsCount = Number((weakWordsResult.rows as Row[])[0]?.count ?? 0);
    const todayCorrect = Number((todayCorrectResult.rows as Row[])[0]?.count ?? 0);
    const dailyGoalProgress = Math.min(Math.round((todayCorrect / 10) * 100), 100);

    res.json({
      wordsLearned,
      testsAttempted: testCountStats[0]?.count ?? 0,
      currentStreak: 0,
      averageScore: averageAccuracy,
      wordsToRevise: weakWordsCount,
      weakWordsCount,
      recentTests: recentTests.map((t) => {
        const maxScore = t.totalQuestions * 2;
        const percentage = t.score != null && maxScore > 0 ? Math.round((t.score / maxScore) * 100) : null;
        return {
          id: t.id,
          status: t.status,
          totalQuestions: t.totalQuestions,
          score: t.score,
          percentage,
          timeDurationMinutes: t.timeDurationMinutes,
          timeTakenSeconds: t.timeTakenSeconds,
          config: t.config,
          createdAt: t.createdAt,
          completedAt: t.completedAt?.toISOString() ?? null,
        };
      }),
      dailyGoalProgress,
    });
  } catch (err) {
    req.log.error({ err }, "Error getting dashboard stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /stats/leaderboard
router.get("/stats/leaderboard", async (req, res) => {
  try {
    const parsed = GetLeaderboardQueryParams.safeParse(req.query);
    const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;

    const result = await db.execute(sql`
      SELECT
        u.id AS user_id,
        u.name,
        COALESCE(learned.count, 0) AS words_learned,
        COALESCE(tests.count, 0) AS tests_attempted,
        COALESCE(tests.avg_score, 0) AS average_score,
        ROW_NUMBER() OVER (ORDER BY COALESCE(learned.count, 0) DESC, COALESCE(tests.avg_score, 0) DESC) AS rank
      FROM users u
      LEFT JOIN (
        SELECT t.user_id, COUNT(DISTINCT tq.vocab_item_id)::int AS count
        FROM test_questions tq
        JOIN tests t ON tq.test_id = t.id
        WHERE t.status = 'completed' AND tq.is_correct = true
        GROUP BY t.user_id
      ) learned ON learned.user_id = u.id
      LEFT JOIN (
        SELECT t.user_id, COUNT(DISTINCT t.id)::int AS count,
          ROUND(
            COALESCE(
              COUNT(*) FILTER (WHERE tq.is_correct = true)::numeric /
              NULLIF(COUNT(*) FILTER (WHERE tq.user_answer IS NOT NULL), 0) * 100,
              0
            ), 2
          ) AS avg_score
        FROM test_questions tq
        JOIN tests t ON tq.test_id = t.id
        WHERE t.status = 'completed'
        GROUP BY t.user_id
      ) tests ON tests.user_id = u.id
      WHERE u.role = 'user' AND u.is_active = true
      ORDER BY rank
      LIMIT ${limit}
    `);

    res.json(
      (result.rows as Array<{
        user_id: number;
        name: string;
        words_learned: number;
        tests_attempted: number;
        average_score: number;
        rank: number;
      }>).map((r) => ({
        rank: Number(r.rank),
        userId: r.user_id,
        name: r.name,
        wordsLearned: Number(r.words_learned),
        testsAttempted: Number(r.tests_attempted),
        averageScore: Math.round(Number(r.average_score)),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Error getting leaderboard");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /stats/category-breakdown
router.get("/stats/category-breakdown", async (req, res) => {
  try {
    const rows = await db
      .select({
        category: vocabularyItemsTable.category,
        count: sql<number>`count(*)::int`,
      })
      .from(vocabularyItemsTable)
      .where(eq(vocabularyItemsTable.isActive, true))
      .groupBy(vocabularyItemsTable.category)
      .orderBy(vocabularyItemsTable.category);

    res.json(rows.map((r) => ({ category: r.category, count: r.count })));
  } catch (err) {
    req.log.error({ err }, "Error getting category breakdown");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
