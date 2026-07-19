import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { vocabularyItemsTable, testsTable, userWordProgressTable, usersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { GetLeaderboardQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

// GET /stats/dashboard
router.get("/stats/dashboard", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const [wordStats, testStats, recentTests, revisionDue] = await Promise.all([
      db
        .select({
          status: userWordProgressTable.status,
          count: sql<number>`count(*)::int`,
        })
        .from(userWordProgressTable)
        .where(eq(userWordProgressTable.userId, userId))
        .groupBy(userWordProgressTable.status),

      db
        .select({
          count: sql<number>`count(*)::int`,
          avgScore: sql<number>`COALESCE(AVG(CASE WHEN score IS NOT NULL THEN score::float / total_questions * 100 END), 0)`,
        })
        .from(testsTable)
        .where(and(eq(testsTable.userId, userId), eq(testsTable.status, "completed"))),

      db
        .select()
        .from(testsTable)
        .where(eq(testsTable.userId, userId))
        .orderBy(sql`${testsTable.createdAt} DESC`)
        .limit(5),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(userWordProgressTable)
        .where(
          and(
            eq(userWordProgressTable.userId, userId),
            sql`status IN ('weak', 'learning')`
          )
        ),
    ]);

    const statusMap = Object.fromEntries(wordStats.map((w) => [w.status, w.count]));
    const wordsLearned = statusMap["learned"] ?? 0;
    const weakWordsCount = statusMap["weak"] ?? 0;

    const testData = testStats[0];

    res.json({
      wordsLearned,
      testsAttempted: testData?.count ?? 0,
      currentStreak: 0,
      averageScore: Math.round(testData?.avgScore ?? 0),
      wordsToRevise: revisionDue[0]?.count ?? 0,
      weakWordsCount,
      recentTests: recentTests.map((t) => ({
        id: t.id,
        status: t.status,
        totalQuestions: t.totalQuestions,
        score: t.score,
        timeDurationMinutes: t.timeDurationMinutes,
        timeTakenSeconds: t.timeTakenSeconds,
        config: t.config,
        createdAt: t.createdAt,
        completedAt: t.completedAt?.toISOString() ?? null,
      })),
      dailyGoalProgress: Math.min(wordsLearned % 10, 10),
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
        SELECT user_id, COUNT(*)::int AS count
        FROM user_word_progress
        WHERE status = 'learned'
        GROUP BY user_id
      ) learned ON learned.user_id = u.id
      LEFT JOIN (
        SELECT user_id, COUNT(*)::int AS count,
               COALESCE(AVG(CASE WHEN score IS NOT NULL THEN score::float / total_questions * 100 END), 0) AS avg_score
        FROM tests
        WHERE status = 'completed'
        GROUP BY user_id
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
