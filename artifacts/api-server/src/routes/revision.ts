import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { vocabularyItemsTable, userWordProgressTable } from "@workspace/db";
import { eq, and, inArray, or, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { CompleteRevisionBody, GetRevisionWordsQueryParams } from "@workspace/api-zod";
import { formatVocabItem } from "./vocabulary.js";

const router: IRouter = Router();

// GET /revision
router.get("/revision", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const parsed = GetRevisionWordsQueryParams.safeParse(req.query);
    const count = parsed.success ? (parsed.data.count ?? 10) : 10;

    // Get words that are: weak, learning (due for review), or never seen
    // Priority: weak > due for review > new words
    const weakAndLearning = await db
      .select({ vocabItemId: userWordProgressTable.vocabItemId })
      .from(userWordProgressTable)
      .where(
        and(
          eq(userWordProgressTable.userId, userId),
          or(
            eq(userWordProgressTable.status, "weak"),
            eq(userWordProgressTable.status, "learning")
          )
        )
      )
      .orderBy(sql`
        CASE status WHEN 'weak' THEN 0 ELSE 1 END,
        ${userWordProgressTable.lastSeen} ASC NULLS FIRST
      `)
      .limit(count);

    let vocabIds = weakAndLearning.map((p) => p.vocabItemId);

    // If not enough, add new (unseen) words
    if (vocabIds.length < count) {
      const seenIds = await db
        .select({ vocabItemId: userWordProgressTable.vocabItemId })
        .from(userWordProgressTable)
        .where(eq(userWordProgressTable.userId, userId));

      const seenVocabIds = seenIds.map((p) => p.vocabItemId);

      const newWords = await db
        .select({ id: vocabularyItemsTable.id })
        .from(vocabularyItemsTable)
        .where(
          and(
            eq(vocabularyItemsTable.isActive, true),
            seenVocabIds.length > 0
              ? sql`${vocabularyItemsTable.id} NOT IN (${sql.join(seenVocabIds.map(id => sql`${id}`), sql`, `)})`
              : sql`1=1`
          )
        )
        .orderBy(sql`RANDOM()`)
        .limit(count - vocabIds.length);

      vocabIds = [...vocabIds, ...newWords.map((w) => w.id)];
    }

    // Count total due
    const [{ totalDue }] = await db
      .select({ totalDue: sql<number>`count(*)::int` })
      .from(userWordProgressTable)
      .where(
        and(
          eq(userWordProgressTable.userId, userId),
          or(
            eq(userWordProgressTable.status, "weak"),
            eq(userWordProgressTable.status, "learning")
          )
        )
      );

    if (vocabIds.length === 0) {
      res.json({ words: [], totalDue: 0 });
      return;
    }

    const items = await db
      .select()
      .from(vocabularyItemsTable)
      .where(inArray(vocabularyItemsTable.id, vocabIds));

    res.json({
      words: items.map(formatVocabItem),
      totalDue,
    });
  } catch (err) {
    req.log.error({ err }, "Error getting revision words");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /revision/complete
router.post("/revision/complete", requireAuth, async (req, res) => {
  try {
    const parsed = CompleteRevisionBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }

    const userId = req.user!.userId;
    const { results } = parsed.data;

    for (const result of results) {
      const newStatus = result.remembered ? "learned" : "weak";
      await db.execute(sql`
        INSERT INTO user_word_progress (user_id, vocab_item_id, status, times_seen, times_correct, last_seen, next_review)
        VALUES (
          ${userId},
          ${result.wordId},
          ${newStatus},
          1,
          ${result.remembered ? 1 : 0},
          NOW(),
          ${result.remembered ? sql`NOW() + INTERVAL '3 days'` : sql`NOW() + INTERVAL '1 day'`}
        )
        ON CONFLICT (user_id, vocab_item_id) DO UPDATE
        SET
          status = ${newStatus},
          times_seen = user_word_progress.times_seen + 1,
          times_correct = user_word_progress.times_correct + ${result.remembered ? 1 : 0},
          last_seen = NOW(),
          next_review = ${result.remembered ? sql`NOW() + INTERVAL '3 days'` : sql`NOW() + INTERVAL '1 day'`}
      `);
    }

    res.json({ success: true, message: "Revision completed" });
  } catch (err) {
    req.log.error({ err }, "Error completing revision");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
