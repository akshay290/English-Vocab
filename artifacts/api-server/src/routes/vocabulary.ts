import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { vocabularyItemsTable } from "@workspace/db";
import { eq, ilike, and, or, sql, inArray } from "drizzle-orm";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";
import {
  ListVocabularyQueryParams,
  GetVocabularyItemParams,
  UpdateVocabularyParams,
  DeleteVocabularyParams,
  CreateVocabularyBody,
  UpdateVocabularyBody,
  GetRandomWordsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /vocabulary/browse/alphabet — must come before /:id
router.get("/vocabulary/browse/alphabet", async (req, res) => {
  try {
    const rows = await db
      .select({
        letter: vocabularyItemsTable.alphabet,
        count: sql<number>`count(*)::int`,
      })
      .from(vocabularyItemsTable)
      .where(eq(vocabularyItemsTable.isActive, true))
      .groupBy(vocabularyItemsTable.alphabet)
      .orderBy(vocabularyItemsTable.alphabet);

    res.json(rows.map((r) => ({ letter: r.letter.toUpperCase(), count: r.count })));
  } catch (err) {
    req.log.error({ err }, "Error browsing alphabet");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /vocabulary/browse/topics — must come before /:id
router.get("/vocabulary/browse/topics", async (req, res) => {
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

    const categoryLabels: Record<string, string> = {
      synonyms: "Synonyms",
      antonyms: "Antonyms",
      one_word_substitution: "One Word Substitution",
      idioms_phrases: "Idioms and Phrases",
      important_vocabulary: "Important Vocabulary",
      phrasal_verbs: "Phrasal Verbs",
      root_words: "Root Words",
      confusing_words: "Confusing Words",
      spellings: "Spellings",
    };

    res.json(
      rows.map((r) => ({
        name: categoryLabels[r.category] ?? r.category,
        slug: r.category,
        count: r.count,
        description: null,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Error browsing topics");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /vocabulary/random
router.get("/vocabulary/random", async (req, res) => {
  try {
    const parsed = GetRandomWordsQueryParams.safeParse(req.query);
    const count = parsed.success ? (parsed.data.count ?? 5) : 5;
    const category = parsed.success ? parsed.data.category : undefined;

    const conditions = [eq(vocabularyItemsTable.isActive, true)];
    if (category) {
      conditions.push(eq(vocabularyItemsTable.category, category));
    }

    const items = await db
      .select()
      .from(vocabularyItemsTable)
      .where(and(...conditions))
      .orderBy(sql`RANDOM()`)
      .limit(count);

    res.json(items.map(formatVocabItem));
  } catch (err) {
    req.log.error({ err }, "Error getting random words");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /vocabulary
router.get("/vocabulary", async (req, res) => {
  try {
    const parsed = ListVocabularyQueryParams.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }

    const { category, alphabet, difficulty, search, page = 1, limit = 20 } = parsed.data;
    const topic = req.query.topic as string | undefined;

    const conditions: ReturnType<typeof eq>[] = [
      eq(vocabularyItemsTable.isActive, true) as ReturnType<typeof eq>,
    ];

    if (category) conditions.push(eq(vocabularyItemsTable.category, category) as ReturnType<typeof eq>);
    if (alphabet) conditions.push(eq(vocabularyItemsTable.alphabet, alphabet.toLowerCase()) as ReturnType<typeof eq>);
    if (difficulty) conditions.push(eq(vocabularyItemsTable.difficulty, difficulty) as ReturnType<typeof eq>);
    if (search) {
      conditions.push(
        or(
          ilike(vocabularyItemsTable.word, `%${search}%`),
          ilike(vocabularyItemsTable.meaning, `%${search}%`)
        ) as ReturnType<typeof eq>
      );
    }

    const whereClause = and(...conditions);
    const offset = (page - 1) * limit;

    const [items, [{ total }]] = await Promise.all([
      db
        .select()
        .from(vocabularyItemsTable)
        .where(whereClause)
        .orderBy(vocabularyItemsTable.word)
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(vocabularyItemsTable)
        .where(whereClause),
    ]);

    res.json({
      items: items.map(formatVocabItem),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    req.log.error({ err }, "Error listing vocabulary");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /vocabulary (admin)
router.post("/vocabulary", requireAdmin, async (req, res) => {
  try {
    const parsed = CreateVocabularyBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }

    const data = parsed.data;
    const [item] = await db
      .insert(vocabularyItemsTable)
      .values({
        word: data.word,
        meaning: data.meaning,
        hindiMeaning: data.hindiMeaning ?? null,
        exampleSentence: data.exampleSentence ?? null,
        synonyms: data.synonyms ?? [],
        antonyms: data.antonyms ?? [],
        difficulty: data.difficulty,
        category: data.category,
        alphabet: data.alphabet.toLowerCase(),
        topics: data.topics ?? [],
        examRefs: data.examRefs ?? [],
      })
      .returning();

    res.status(201).json(formatVocabItem(item));
  } catch (err) {
    req.log.error({ err }, "Error creating vocabulary");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /vocabulary/:id
router.get("/vocabulary/:id", async (req, res) => {
  try {
    const parsed = GetVocabularyItemParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [item] = await db
      .select()
      .from(vocabularyItemsTable)
      .where(eq(vocabularyItemsTable.id, parsed.data.id))
      .limit(1);

    if (!item) {
      res.status(404).json({ error: "Word not found" });
      return;
    }

    res.json(formatVocabItem(item));
  } catch (err) {
    req.log.error({ err }, "Error getting vocabulary item");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /vocabulary/:id (admin)
router.put("/vocabulary/:id", requireAdmin, async (req, res) => {
  try {
    const params = UpdateVocabularyParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const parsed = UpdateVocabularyBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }

    const updates: Partial<typeof vocabularyItemsTable.$inferInsert> = {};
    const d = parsed.data;
    if (d.word !== undefined) updates.word = d.word;
    if (d.meaning !== undefined) updates.meaning = d.meaning;
    if (d.hindiMeaning !== undefined) updates.hindiMeaning = d.hindiMeaning;
    if (d.exampleSentence !== undefined) updates.exampleSentence = d.exampleSentence;
    if (d.synonyms !== undefined) updates.synonyms = d.synonyms;
    if (d.antonyms !== undefined) updates.antonyms = d.antonyms;
    if (d.difficulty !== undefined) updates.difficulty = d.difficulty;
    if (d.category !== undefined) updates.category = d.category;
    if (d.alphabet !== undefined) updates.alphabet = d.alphabet.toLowerCase();
    if (d.topics !== undefined) updates.topics = d.topics;
    if (d.examRefs !== undefined) updates.examRefs = d.examRefs;
    if (d.isActive !== undefined) updates.isActive = d.isActive;
    updates.updatedAt = new Date();

    const [item] = await db
      .update(vocabularyItemsTable)
      .set(updates)
      .where(eq(vocabularyItemsTable.id, params.data.id))
      .returning();

    if (!item) {
      res.status(404).json({ error: "Word not found" });
      return;
    }

    res.json(formatVocabItem(item));
  } catch (err) {
    req.log.error({ err }, "Error updating vocabulary");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /vocabulary/:id (admin)
router.delete("/vocabulary/:id", requireAdmin, async (req, res) => {
  try {
    const parsed = DeleteVocabularyParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [item] = await db
      .delete(vocabularyItemsTable)
      .where(eq(vocabularyItemsTable.id, parsed.data.id))
      .returning();

    if (!item) {
      res.status(404).json({ error: "Word not found" });
      return;
    }

    res.json({ success: true, message: "Word deleted" });
  } catch (err) {
    req.log.error({ err }, "Error deleting vocabulary");
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatVocabItem(item: typeof vocabularyItemsTable.$inferSelect) {
  return {
    id: item.id,
    word: item.word,
    meaning: item.meaning,
    hindiMeaning: item.hindiMeaning,
    exampleSentence: item.exampleSentence,
    synonyms: (item.synonyms as string[]) ?? [],
    antonyms: (item.antonyms as string[]) ?? [],
    difficulty: item.difficulty,
    category: item.category,
    alphabet: item.alphabet.toUpperCase(),
    topics: (item.topics as string[]) ?? [],
    examRefs: (item.examRefs as string[]) ?? [],
    isActive: item.isActive,
    createdAt: item.createdAt,
  };
}

export { formatVocabItem };
export default router;
