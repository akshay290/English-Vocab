import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { vocabularyItemsTable, userWordProgressTable, testsTable, testQuestionsTable } from "@workspace/db";
import { eq, and, sql, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { UpdateWordProgressBody, UpdateWordProgressParams, GetWordProgressQueryParams } from "@workspace/api-zod";
import { formatVocabItem } from "./vocabulary.js";

const router: IRouter = Router();

// GET /progress
router.get("/progress", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;

    // All stats are based on test results only (not manual word-status updates)
    const [testCountStats, wordsLearnedResult, wordsAttemptedResult, wordsCorrectOnceResult, avgAccuracyResult, categoryStats] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(testsTable)
        .where(and(eq(testsTable.userId, userId), eq(testsTable.status, "completed"))),

      // Words mastered = distinct vocab items answered correctly 2+ times across completed tests
      db.execute(sql`
        SELECT COUNT(DISTINCT vocab_item_id)::int AS count
        FROM (
          SELECT tq.vocab_item_id
          FROM test_questions tq
          JOIN tests t ON tq.test_id = t.id
          WHERE t.user_id = ${userId} AND t.status = 'completed' AND tq.is_correct = true
          GROUP BY tq.vocab_item_id
          HAVING COUNT(*) >= 2
        ) mastered
      `),

      // Words attempted = distinct vocab items seen in any completed test
      db.execute(sql`
        SELECT COUNT(DISTINCT tq.vocab_item_id)::int AS count
        FROM test_questions tq
        JOIN tests t ON tq.test_id = t.id
        WHERE t.user_id = ${userId} AND t.status = 'completed'
      `),

      // Words correct at least once = distinct vocab items answered correctly at least once
      db.execute(sql`
        SELECT COUNT(DISTINCT tq.vocab_item_id)::int AS count
        FROM test_questions tq
        JOIN tests t ON tq.test_id = t.id
        WHERE t.user_id = ${userId} AND t.status = 'completed' AND tq.is_correct = true
      `),

      // Average accuracy = total correct / total questions in completed tests (2 decimal places)
      db.execute(sql`
        SELECT ROUND(
          COALESCE(
            COUNT(*) FILTER (WHERE tq.is_correct = true)::numeric /
            NULLIF(COUNT(*), 0) * 100,
            0
          ), 2
        ) AS accuracy
        FROM test_questions tq
        JOIN tests t ON tq.test_id = t.id
        WHERE t.user_id = ${userId} AND t.status = 'completed'
      `),

      // Category progress: learned = distinct words correct in tests; total = all active in category
      db.execute(sql`
        SELECT
          v.category,
          COUNT(DISTINCT tq.vocab_item_id) FILTER (
            WHERE tq.is_correct = true AND t.user_id = ${userId} AND t.status = 'completed'
          )::int AS learned,
          COUNT(DISTINCT v.id)::int AS total
        FROM vocabulary_items v
        LEFT JOIN test_questions tq ON tq.vocab_item_id = v.id
        LEFT JOIN tests t ON tq.test_id = t.id
        WHERE v.is_active = true
        GROUP BY v.category
        ORDER BY v.category
      `),
    ]);

    type Row = { count: string | number };
    const wordsLearned = Number((wordsLearnedResult.rows as Row[])[0]?.count ?? 0);
    const wordsAttempted = Number((wordsAttemptedResult.rows as Row[])[0]?.count ?? 0);
    const wordsCorrectOnce = Number((wordsCorrectOnceResult.rows as Row[])[0]?.count ?? 0);
    // Words in progress = attempted but not yet mastered (correct 2+ times)
    const wordsInProgress = Math.max(0, wordsAttempted - wordsLearned);
    const averageAccuracy = Number((avgAccuracyResult.rows as Array<{ accuracy: string | number }>)[0]?.accuracy ?? 0);

    res.json({
      wordsLearned,
      wordsAttempted,
      wordsCorrectOnce,
      wordsInProgress,
      weakWords: 0, // deprecated — using test-based stats now
      totalWordsAvailable: wordsAttempted, // mastery is over attempted words
      testsAttempted: testCountStats[0]?.count ?? 0,
      averageScore: averageAccuracy,
      streakDays: 0,
      lastActive: null,
      categoryProgress: (categoryStats.rows as Array<{ category: string; learned: string | number; total: string | number }>).map((r) => ({
        category: r.category,
        learned: Number(r.learned) || 0,
        total: Number(r.total) || 0,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting user progress");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /progress/words/:wordId — single word status (must come before generic /words route)
router.get("/progress/words/:wordId", requireAuth, async (req, res) => {
  try {
    const wordId = Number(req.params.wordId);
    if (isNaN(wordId)) {
      res.status(400).json({ error: "Invalid wordId" });
      return;
    }

    const userId = req.user!.userId;
    const [progress] = await db
      .select()
      .from(userWordProgressTable)
      .where(and(eq(userWordProgressTable.userId, userId), eq(userWordProgressTable.vocabItemId, wordId)))
      .limit(1);

    if (!progress) {
      res.json({ status: "new", vocabItemId: wordId, timesSeen: 0, timesCorrect: 0, lastSeen: null, nextReview: null });
      return;
    }

    res.json({
      id: progress.id,
      vocabItemId: progress.vocabItemId,
      status: progress.status,
      timesSeen: progress.timesSeen,
      timesCorrect: progress.timesCorrect,
      lastSeen: progress.lastSeen?.toISOString() ?? null,
      nextReview: progress.nextReview?.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Error getting word progress");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /progress/weak-words — must come before /words/:wordId
router.get("/progress/weak-words", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const weakProgress = await db
      .select({ vocabItemId: userWordProgressTable.vocabItemId })
      .from(userWordProgressTable)
      .where(and(eq(userWordProgressTable.userId, userId), eq(userWordProgressTable.status, "weak")))
      .limit(50);

    if (weakProgress.length === 0) {
      res.json([]);
      return;
    }

    const vocabIds = weakProgress.map((p) => p.vocabItemId);
    const items = await db
      .select()
      .from(vocabularyItemsTable)
      .where(inArray(vocabularyItemsTable.id, vocabIds));

    res.json(items.map(formatVocabItem));
  } catch (err) {
    req.log.error({ err }, "Error getting weak words");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /progress/words
router.get("/progress/words", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const parsed = GetWordProgressQueryParams.safeParse(req.query);
    const page = parsed.success ? (parsed.data.page ?? 1) : 1;
    const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
    const status = parsed.success ? parsed.data.status : undefined;
    const offset = (page - 1) * limit;

    const conditions = [eq(userWordProgressTable.userId, userId)];
    if (status) {
      conditions.push(eq(userWordProgressTable.status, status) as ReturnType<typeof eq>);
    }

    const [items, [{ total }]] = await Promise.all([
      db
        .select()
        .from(userWordProgressTable)
        .where(and(...conditions))
        .orderBy(sql`${userWordProgressTable.lastSeen} DESC NULLS LAST`)
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(userWordProgressTable)
        .where(and(...conditions)),
    ]);

    const vocabIds = items.map((p) => p.vocabItemId);
    const vocabItems =
      vocabIds.length > 0
        ? await db
            .select()
            .from(vocabularyItemsTable)
            .where(inArray(vocabularyItemsTable.id, vocabIds))
        : [];
    const vocabMap = new Map(vocabItems.map((v) => [v.id, v]));

    res.json({
      items: items.map((p) => ({
        id: p.id,
        vocabItemId: p.vocabItemId,
        status: p.status,
        timesSeen: p.timesSeen,
        timesCorrect: p.timesCorrect,
        lastSeen: p.lastSeen?.toISOString() ?? null,
        nextReview: p.nextReview?.toISOString() ?? null,
        vocabItem: vocabMap.has(p.vocabItemId) ? formatVocabItem(vocabMap.get(p.vocabItemId)!) : null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting word progress");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /progress/words/:wordId
router.put("/progress/words/:wordId", requireAuth, async (req, res) => {
  try {
    const wordId = Number(req.params.wordId);
    if (isNaN(wordId)) {
      res.status(400).json({ error: "Invalid wordId" });
      return;
    }

    const parsed = UpdateWordProgressBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }

    const userId = req.user!.userId;
    const { status } = parsed.data;

    await db.execute(sql`
      INSERT INTO user_word_progress (user_id, vocab_item_id, status, times_seen, last_seen)
      VALUES (${userId}, ${wordId}, ${status}, 1, NOW())
      ON CONFLICT (user_id, vocab_item_id) DO UPDATE
      SET status = ${status}, times_seen = user_word_progress.times_seen + 1, last_seen = NOW()
    `);

    const [progress] = await db
      .select()
      .from(userWordProgressTable)
      .where(
        and(eq(userWordProgressTable.userId, userId), eq(userWordProgressTable.vocabItemId, wordId))
      )
      .limit(1);

    res.json({
      id: progress.id,
      vocabItemId: progress.vocabItemId,
      status: progress.status,
      timesSeen: progress.timesSeen,
      timesCorrect: progress.timesCorrect,
      lastSeen: progress.lastSeen?.toISOString() ?? null,
      nextReview: progress.nextReview?.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Error updating word progress");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
