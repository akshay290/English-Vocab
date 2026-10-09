import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { vocabularyItemsTable, testsTable, testQuestionsTable, userWordProgressTable } from "@workspace/db";
import { eq, and, inArray, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import {
  CreateTestBody,
  SubmitTestBody,
  GetTestParams,
  SubmitTestParams,
  GetTestResultParams,
  GetTestHistoryQueryParams,
} from "@workspace/api-zod";
import { formatVocabItem } from "./vocabulary.js";

const router: IRouter = Router();

// POST /tests
router.post("/tests", requireAuth, async (req, res) => {
  try {
    const parsed = CreateTestBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid test config" });
      return;
    }

    const config = parsed.data;
    const { categories, alphabets, difficulty, totalQuestions, timeDurationMinutes, questionMode } = config;
    const userId = req.user!.userId;

    // ── 30 : 70 split ────────────────────────────────────────────────────────
    // Known   = answered correctly ≥1× in any test (times_correct >= 1) or manually marked 'learned'
    // Unknown = no progress row, never answered correctly, or marked 'weak'
    const knownQuota   = Math.round(totalQuestions * 0.30);
    const unknownQuota = totalQuestions - knownQuota;
    const extraPool    = Math.max(totalQuestions * 3, 30);

    // Use IN (...) with individual bindings — passing a JS array to ANY() causes
    // "malformed array literal" because Drizzle serialises the array as a string
    const categorySql  = categories && categories.length > 0
      ? sql`AND v.category IN (${sql.join(categories.map((c) => sql`${c}`), sql`, `)})`
      : sql``;
    const alphabetSql  = alphabets && alphabets.length > 0
      ? sql`AND v.alphabet IN (${sql.join(alphabets.map((a) => sql`${a.toLowerCase()}`), sql`, `)})`
      : sql``;
    const difficultySql = difficulty
      ? sql`AND v.difficulty = ${difficulty}`
      : sql``;

    // Known words — user has progress showing at least 1 correct answer
    const knownWords = await db.execute(sql`
      SELECT v.*
      FROM vocabulary_items v
      JOIN user_word_progress uwp
        ON uwp.vocab_item_id = v.id AND uwp.user_id = ${userId}
      WHERE v.is_active = true
        ${categorySql}
        ${alphabetSql}
        ${difficultySql}
        AND (uwp.times_correct >= 1 OR uwp.status = 'learned')
      ORDER BY RANDOM()
      LIMIT ${knownQuota + extraPool}
    `);

    // Unknown words — no progress row, or never answered correctly, or marked weak
    const unknownWords = await db.execute(sql`
      SELECT v.*
      FROM vocabulary_items v
      LEFT JOIN user_word_progress uwp
        ON uwp.vocab_item_id = v.id AND uwp.user_id = ${userId}
      WHERE v.is_active = true
        ${categorySql}
        ${alphabetSql}
        ${difficultySql}
        AND (uwp.id IS NULL OR uwp.times_correct = 0 OR uwp.status = 'weak')
      ORDER BY RANDOM()
      LIMIT ${unknownQuota + extraPool}
    `);

    type RawVocab = {
      id: number; word: string; meaning: string; hindi_meaning: string | null;
      category: string; difficulty: string; alphabet: string; is_active: boolean;
      example_sentence: string | null; synonyms: string[] | null; antonyms: string[] | null;
      exam_refs: string[] | null; topics: string[] | null; created_at: Date; updated_at: Date;
    };

    const knownPool   = knownWords.rows  as RawVocab[];
    const unknownPool = unknownWords.rows as RawVocab[];

    // Fill quotas; compensate from the other bucket if one is short
    const actualKnown   = knownPool.slice(0, knownQuota);
    const stillNeeded   = totalQuestions - actualKnown.length;
    const actualUnknown = unknownPool.slice(0, stillNeeded);
    let questionWords   = [...actualKnown, ...actualUnknown];

    if (questionWords.length < totalQuestions) {
      res.status(400).json({
        error: `Not enough words match your criteria. Found ${questionWords.length}, need ${totalQuestions}.`,
      });
      return;
    }

    // Sort by alphabet if requested
    if (questionMode === "alphabet_wise") {
      questionWords = [...questionWords].sort((a, b) => a.alphabet.localeCompare(b.alphabet));
    }

    // Distractor pool = union of both pools minus selected question words
    const selectedIds   = new Set(questionWords.map((w) => w.id));
    const distractorPool = [...knownPool, ...unknownPool].filter((v) => !selectedIds.has(v.id));

    // Create test
    const [test] = await db
      .insert(testsTable)
      .values({
        userId,
        config: config as object,
        status: "in_progress",
        totalQuestions,
        timeDurationMinutes: timeDurationMinutes ?? null,
      })
      .returning();

    // Generate MCQ questions
    const questions = questionWords.map((word, idx) => {
      const distractors = [...distractorPool]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((v) => v.meaning);

      const correctAnswer = Math.floor(Math.random() * 4);
      const options = [...distractors];
      options.splice(correctAnswer, 0, word.meaning);

      return {
        testId: test.id,
        vocabItemId: word.id,
        questionText: `What is the meaning of "${word.word}"?`,
        options,
        correctAnswer,
        position: idx + 1,
      };
    });

    const insertedQuestions = await db.insert(testQuestionsTable).values(questions).returning();

    res.status(201).json({
      id: test.id,
      status: test.status,
      totalQuestions: test.totalQuestions,
      score: null,
      timeDurationMinutes: test.timeDurationMinutes,
      config: test.config,
      questions: insertedQuestions.map((q) => ({
        id: q.id,
        position: q.position,
        questionText: q.questionText,
        options: q.options as string[],
        userAnswer: null,
        vocabItemId: q.vocabItemId,
      })),
      createdAt: test.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Error creating test");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /tests/history — must come before /:id
router.get("/tests/history", requireAuth, async (req, res) => {
  try {
    const parsed = GetTestHistoryQueryParams.safeParse(req.query);
    const page = parsed.success ? (parsed.data.page ?? 1) : 1;
    const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;
    const offset = (page - 1) * limit;

    const [items, [{ total }]] = await Promise.all([
      db
        .select()
        .from(testsTable)
        .where(eq(testsTable.userId, req.user!.userId))
        .orderBy(sql`${testsTable.createdAt} DESC`)
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(testsTable)
        .where(eq(testsTable.userId, req.user!.userId)),
    ]);

    res.json({
      items: items.map(formatTestSummary),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting test history");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /tests/:id
router.get("/tests/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [test] = await db
      .select()
      .from(testsTable)
      .where(and(eq(testsTable.id, id), eq(testsTable.userId, req.user!.userId)))
      .limit(1);

    if (!test) {
      res.status(404).json({ error: "Test not found" });
      return;
    }

    const questions = await db
      .select()
      .from(testQuestionsTable)
      .where(eq(testQuestionsTable.testId, id))
      .orderBy(testQuestionsTable.position);

    res.json({
      id: test.id,
      status: test.status,
      totalQuestions: test.totalQuestions,
      score: test.score,
      timeDurationMinutes: test.timeDurationMinutes,
      config: test.config,
      questions: questions.map((q) => ({
        id: q.id,
        position: q.position,
        questionText: q.questionText,
        options: q.options as string[],
        userAnswer: q.userAnswer,
        vocabItemId: q.vocabItemId,
      })),
      createdAt: test.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Error getting test");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /tests/:id/submit
router.post("/tests/:id/submit", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const parsed = SubmitTestBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid submission" });
      return;
    }

    const [test] = await db
      .select()
      .from(testsTable)
      .where(and(eq(testsTable.id, id), eq(testsTable.userId, req.user!.userId)))
      .limit(1);

    if (!test) {
      res.status(404).json({ error: "Test not found" });
      return;
    }

    const questions = await db
      .select()
      .from(testQuestionsTable)
      .where(eq(testQuestionsTable.testId, id))
      .orderBy(testQuestionsTable.position);

    const { answers, timeTakenSeconds } = parsed.data;
    const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedOption]));

    let correctCount = 0;
    let incorrectCount = 0;
    const updatedQuestions = [];

    for (const q of questions) {
      const userAnswer = answerMap.get(q.id) ?? null;
      const isCorrect = userAnswer !== null && userAnswer === q.correctAnswer;

      if (isCorrect) {
        correctCount++;
      } else if (userAnswer !== null) {
        incorrectCount++;
      }

      await db
        .update(testQuestionsTable)
        .set({ userAnswer: userAnswer ?? null, isCorrect })
        .where(eq(testQuestionsTable.id, q.id));

      updatedQuestions.push({ ...q, userAnswer, isCorrect });
    }

    // +2 correct, -0.5 incorrect, 0 unattempted — floored at 0
    const rawScore = correctCount * 2 - incorrectCount * 0.5;
    const score = Math.max(0, rawScore);
    const unattemptedCount = test.totalQuestions - correctCount - incorrectCount;
    const maxScore = test.totalQuestions * 2;
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    const completedAt = new Date();
    await db
      .update(testsTable)
      .set({ status: "completed", score, timeTakenSeconds, completedAt })
      .where(eq(testsTable.id, id));

    // Update user word progress for wrong answers
    const weakVocabIds = updatedQuestions
      .filter((q) => !q.isCorrect)
      .map((q) => q.vocabItemId);

    for (const vocabId of weakVocabIds) {
      const existing = await db
        .select()
        .from(vocabularyItemsTable)
        .where(eq(vocabularyItemsTable.id, vocabId))
        .limit(1);

      if (existing.length > 0) {
        // Upsert user word progress
        await db.execute(sql`
          INSERT INTO user_word_progress (user_id, vocab_item_id, status, times_seen, times_correct)
          VALUES (${req.user!.userId}, ${vocabId}, 'weak', 1, 0)
          ON CONFLICT (user_id, vocab_item_id) DO UPDATE
          SET status = 'weak', times_seen = user_word_progress.times_seen + 1,
              last_seen = NOW()
        `);
      }
    }

    // Update correct answers progress
    const learnedVocabIds = updatedQuestions
      .filter((q) => q.isCorrect)
      .map((q) => q.vocabItemId);

    for (const vocabId of learnedVocabIds) {
      await db.execute(sql`
        INSERT INTO user_word_progress (user_id, vocab_item_id, status, times_seen, times_correct)
        VALUES (${req.user!.userId}, ${vocabId}, 'learning', 1, 1)
        ON CONFLICT (user_id, vocab_item_id) DO UPDATE
        SET times_seen = user_word_progress.times_seen + 1,
            times_correct = user_word_progress.times_correct + 1,
            status = CASE
              WHEN user_word_progress.times_correct + 1 >= 3 THEN 'learned'
              ELSE 'learning'
            END,
            last_seen = NOW()
      `);
    }

    // Fetch vocab items for result
    const vocabIds = questions.map((q) => q.vocabItemId);
    const vocabItems = await db
      .select()
      .from(vocabularyItemsTable)
      .where(inArray(vocabularyItemsTable.id, vocabIds));

    const vocabMap = new Map(vocabItems.map((v) => [v.id, v]));

    res.json({
      id: test.id,
      score,
      maxScore,
      correctCount,
      incorrectCount,
      unattemptedCount,
      totalQuestions: test.totalQuestions,
      percentage,
      timeTakenSeconds,
      questions: updatedQuestions.map((q) => ({
        id: q.id,
        position: q.position,
        questionText: q.questionText,
        options: q.options as string[],
        correctAnswer: q.correctAnswer,
        userAnswer: q.userAnswer,
        isCorrect: q.isCorrect,
        vocabItemId: q.vocabItemId,
        vocabItem: vocabMap.has(q.vocabItemId) ? formatVocabItem(vocabMap.get(q.vocabItemId)!) : null,
      })),
      createdAt: test.createdAt,
      completedAt: completedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error submitting test");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /tests/:id/result
router.get("/tests/:id/result", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [test] = await db
      .select()
      .from(testsTable)
      .where(and(eq(testsTable.id, id), eq(testsTable.userId, req.user!.userId)))
      .limit(1);

    if (!test || test.status !== "completed") {
      res.status(404).json({ error: "Test result not found" });
      return;
    }

    const questions = await db
      .select()
      .from(testQuestionsTable)
      .where(eq(testQuestionsTable.testId, id))
      .orderBy(testQuestionsTable.position);

    const vocabIds = questions.map((q) => q.vocabItemId);
    const vocabItems = await db
      .select()
      .from(vocabularyItemsTable)
      .where(inArray(vocabularyItemsTable.id, vocabIds));

    const vocabMap = new Map(vocabItems.map((v) => [v.id, v]));
    // score = correctCount*2 - incorrectCount*0.5, maxScore = totalQuestions*2
    const maxScore = test.totalQuestions * 2;
    const percentage = maxScore > 0 ? Math.round(((test.score ?? 0) / maxScore) * 100) : 0;

    // Recompute correct/incorrect counts from stored question data for result page
    const correctCount = questions.filter((q) => q.isCorrect === true).length;
    const incorrectCount = questions.filter((q) => q.isCorrect === false && q.userAnswer !== null).length;
    const unattemptedCount = questions.filter((q) => q.userAnswer === null).length;

    res.json({
      id: test.id,
      score: test.score ?? 0,
      maxScore,
      correctCount,
      incorrectCount,
      unattemptedCount,
      totalQuestions: test.totalQuestions,
      percentage,
      timeTakenSeconds: test.timeTakenSeconds ?? 0,
      questions: questions.map((q) => ({
        id: q.id,
        position: q.position,
        questionText: q.questionText,
        options: q.options as string[],
        correctAnswer: q.correctAnswer,
        userAnswer: q.userAnswer,
        isCorrect: q.isCorrect,
        vocabItemId: q.vocabItemId,
        vocabItem: vocabMap.has(q.vocabItemId) ? formatVocabItem(vocabMap.get(q.vocabItemId)!) : null,
      })),
      createdAt: test.createdAt,
      completedAt: test.completedAt!.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting test result");
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatTestSummary(test: typeof testsTable.$inferSelect) {
  const maxScore = test.totalQuestions * 2;
  const percentage =
    test.score != null && maxScore > 0
      ? Math.round((test.score / maxScore) * 100)
      : null;
  return {
    id: test.id,
    status: test.status,
    totalQuestions: test.totalQuestions,
    score: test.score,
    percentage,
    timeDurationMinutes: test.timeDurationMinutes,
    timeTakenSeconds: test.timeTakenSeconds,
    config: test.config,
    createdAt: test.createdAt,
    completedAt: test.completedAt?.toISOString() ?? null,
  };
}

export default router;
