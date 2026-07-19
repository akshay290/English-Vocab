import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { vocabularyItemsTable, userWordProgressTable, testsTable } from "@workspace/db";
import { eq, and, sql, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { UpdateWordProgressBody, UpdateWordProgressParams, GetWordProgressQueryParams } from "@workspace/api-zod";
import { formatVocabItem } from "./vocabulary.js";

const router: IRouter = Router();

// GET /progress
router.get("/progress", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const [wordStats, testStats, totalWords, categoryStats] = await Promise.all([
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
        .select({ total: sql<number>`count(*)::int` })
        .from(vocabularyItemsTable)
        .where(eq(vocabularyItemsTable.isActive, true)),

      // Category progress: join progress with vocab
      db.execute(sql`
        SELECT v.category,
               COUNT(DISTINCT uwp.vocab_item_id) FILTER (WHERE uwp.status = 'learned') AS learned,
               COUNT(DISTINCT v.id) AS total
        FROM vocabulary_items v
        LEFT JOIN user_word_progress uwp ON uwp.vocab_item_id = v.id AND uwp.user_id = ${userId}
        WHERE v.is_active = true
        GROUP BY v.category
        ORDER BY v.category
      `),
    ]);

    const statusMap = Object.fromEntries(wordStats.map((w) => [w.status, w.count]));
    const wordsLearned = statusMap["learned"] ?? 0;
    const wordsInProgress = (statusMap["learning"] ?? 0);
    const weakWords = statusMap["weak"] ?? 0;

    const testData = testStats[0];

    res.json({
      wordsLearned,
      wordsInProgress,
      weakWords,
      totalWordsAvailable: totalWords[0]?.total ?? 0,
      testsAttempted: testData?.count ?? 0,
      averageScore: Math.round(testData?.avgScore ?? 0),
      streakDays: 0, // TODO: implement streak
      lastActive: null,
      categoryProgress: (categoryStats.rows as Array<{ category: string; learned: string; total: string }>).map((r) => ({
        category: r.category,
        learned: parseInt(r.learned) || 0,
        total: parseInt(r.total) || 0,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting user progress");
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
