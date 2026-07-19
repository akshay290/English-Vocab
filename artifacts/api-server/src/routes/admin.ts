import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, vocabularyItemsTable } from "@workspace/db";
import { eq, ilike, and, sql } from "drizzle-orm";
import { signToken, requireAdmin } from "../middlewares/auth.js";
import {
  AdminLoginBody,
  AdminListUsersQueryParams,
  AdminListVocabularyQueryParams,
  AdminDeleteUserParams,
} from "@workspace/api-zod";
import { formatVocabItem } from "./vocabulary.js";

const router: IRouter = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sscvocab@admin2024";

// POST /admin/auth
router.post("/admin/auth", async (req, res) => {
  try {
    const parsed = AdminLoginBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }

    if (parsed.data.password !== ADMIN_PASSWORD) {
      res.status(401).json({ error: "Invalid admin password" });
      return;
    }

    // Find or create admin user
    let adminUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.role, "admin"))
      .limit(1);

    if (adminUser.length === 0) {
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      const [created] = await db
        .insert(usersTable)
        .values({
          name: "Admin",
          email: "admin@sscvocab.local",
          passwordHash,
          role: "admin",
        })
        .returning();
      adminUser = [created];
    }

    const user = adminUser[0];
    const token = signToken({ userId: user.id, email: user.email, role: "admin" });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Error in admin auth");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/stats
router.get("/admin/stats", requireAdmin, async (req, res) => {
  try {
    const [totalUsers, totalVocab, totalTests, activeUsers, catBreakdown] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.role, "user")),
      db.select({ count: sql<number>`count(*)::int` }).from(vocabularyItemsTable),
      db.execute(sql`SELECT COUNT(*)::int AS count FROM tests`),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(usersTable)
        .where(and(eq(usersTable.role, "user"), eq(usersTable.isActive, true))),
      db
        .select({
          category: vocabularyItemsTable.category,
          count: sql<number>`count(*)::int`,
        })
        .from(vocabularyItemsTable)
        .groupBy(vocabularyItemsTable.category)
        .orderBy(vocabularyItemsTable.category),
    ]);

    res.json({
      totalUsers: totalUsers[0]?.count ?? 0,
      totalVocabulary: totalVocab[0]?.count ?? 0,
      totalTests: (totalTests.rows[0] as { count: number })?.count ?? 0,
      activeUsers: activeUsers[0]?.count ?? 0,
      categoryBreakdown: catBreakdown.map((r) => ({ category: r.category, count: r.count })),
      recentActivity: [],
    });
  } catch (err) {
    req.log.error({ err }, "Error getting admin stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/users
router.get("/admin/users", requireAdmin, async (req, res) => {
  try {
    const parsed = AdminListUsersQueryParams.safeParse(req.query);
    const page = parsed.success ? (parsed.data.page ?? 1) : 1;
    const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
    const search = parsed.success ? parsed.data.search : undefined;
    const offset = (page - 1) * limit;

    const conditions = [eq(usersTable.role, "user")];
    if (search) {
      conditions.push(
        ilike(usersTable.name, `%${search}%`) as ReturnType<typeof eq>
      );
    }

    const [items, [{ total }]] = await Promise.all([
      db
        .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, createdAt: usersTable.createdAt })
        .from(usersTable)
        .where(and(...conditions))
        .orderBy(sql`${usersTable.createdAt} DESC`)
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(usersTable)
        .where(and(...conditions)),
    ]);

    res.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    req.log.error({ err }, "Error listing admin users");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /admin/users/:id
router.delete("/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [deleted] = await db
      .delete(usersTable)
      .where(and(eq(usersTable.id, id), eq(usersTable.role, "user")))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    req.log.error({ err }, "Error deleting user");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/vocabulary
router.get("/admin/vocabulary", requireAdmin, async (req, res) => {
  try {
    const parsed = AdminListVocabularyQueryParams.safeParse(req.query);
    const page = parsed.success ? (parsed.data.page ?? 1) : 1;
    const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
    const category = parsed.success ? parsed.data.category : undefined;
    const search = parsed.success ? parsed.data.search : undefined;
    const offset = (page - 1) * limit;

    const conditions: ReturnType<typeof eq>[] = [];
    if (category) conditions.push(eq(vocabularyItemsTable.category, category) as ReturnType<typeof eq>);
    if (search) {
      conditions.push(ilike(vocabularyItemsTable.word, `%${search}%`) as ReturnType<typeof eq>);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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
    req.log.error({ err }, "Error listing admin vocabulary");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /admin/vocabulary/bulk
router.post("/admin/vocabulary/bulk", requireAdmin, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      res.status(400).json({ error: "items must be an array" });
      return;
    }

    let created = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        await db.insert(vocabularyItemsTable).values({
          word: item.word,
          meaning: item.meaning,
          hindiMeaning: item.hindiMeaning ?? null,
          exampleSentence: item.exampleSentence ?? null,
          synonyms: item.synonyms ?? [],
          antonyms: item.antonyms ?? [],
          difficulty: item.difficulty ?? "medium",
          category: item.category,
          alphabet: (item.alphabet ?? item.word[0]).toLowerCase(),
          topics: item.topics ?? [],
          examRefs: item.examRefs ?? [],
        });
        created++;
      } catch (e: unknown) {
        failed++;
        errors.push(`${item.word}: ${(e as Error).message}`);
      }
    }

    res.status(201).json({ created, failed, errors });
  } catch (err) {
    req.log.error({ err }, "Error bulk creating vocabulary");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
