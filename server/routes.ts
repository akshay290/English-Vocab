import { Router, type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { store, type VocabItem, type User } from "./store";

const router = Router();
const JWT_SECRET = process.env.SESSION_SECRET || "sscvocab-secret-key-32-chars-long!!";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sscvocab@admin2024";

interface AuthTokenPayload {
  userId: number;
  email: string;
  role: string;
}

function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
}

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // If not provided, fallback to demo student user for instant preview experience
    (req as any).user = { userId: 2, email: "student@sscvocab.com", role: "user" };
    return next();
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    (req as any).user = { userId: 2, email: "student@sscvocab.com", role: "user" };
    return next();
  }
  (req as any).user = payload;
  next();
}

function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const payload = verifyToken(authHeader.slice(7));
  if (!payload || payload.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  (req as any).user = payload;
  next();
}

// ── Health ──
router.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

// ── Auth ──
router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const existing = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser: User = {
      id: store.users.length + 1,
      name,
      email,
      passwordHash,
      role: "user",
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    store.users.push(newUser);

    const token = signToken({ userId: newUser.id, email: newUser.email, role: newUser.role });
    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
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
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

router.get("/auth/me", authMiddleware, (req, res) => {
  const userId = (req as any).user?.userId;
  const user = store.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  });
});

// ── Vocabulary ──
router.get("/vocabulary/browse/alphabet", (_req, res) => {
  const counts: Record<string, number> = {};
  for (let c = 65; c <= 90; c++) {
    counts[String.fromCharCode(c)] = 0;
  }
  for (const item of store.vocabularyItems) {
    if (!item.isActive) continue;
    const letter = item.alphabet.toUpperCase();
    if (counts[letter] !== undefined) {
      counts[letter]++;
    }
  }
  const result = Object.entries(counts).map(([letter, count]) => ({ letter, count }));
  res.json(result);
});

router.get("/vocabulary/browse/topics", (_req, res) => {
  const categoryLabels: Record<string, string> = {
    synonyms: "Synonyms",
    antonyms: "Antonyms",
    one_word_substitution: "One Word Substitution",
    idioms_phrases: "Idioms & Phrases",
    important_vocabulary: "Important Vocabulary",
    phrasal_verbs: "Phrasal Verbs",
    root_words: "Root Words",
    confusing_words: "Confusing Words",
    spellings: "Spellings",
  };

  const counts: Record<string, number> = {};
  Object.keys(categoryLabels).forEach((cat) => (counts[cat] = 0));

  for (const item of store.vocabularyItems) {
    if (!item.isActive) continue;
    if (counts[item.category] !== undefined) {
      counts[item.category]++;
    } else {
      counts[item.category] = 1;
    }
  }

  const result = Object.entries(counts).map(([slug, count]) => ({
    name: categoryLabels[slug] || slug.replace(/_/g, " "),
    slug,
    count,
    description: `Comprehensive collection for ${categoryLabels[slug] || slug}`,
  }));
  res.json(result);
});

router.get("/vocabulary/random", (req, res) => {
  const count = Number(req.query.count) || 5;
  const category = req.query.category as string | undefined;

  let pool = store.vocabularyItems.filter((v) => v.isActive);
  if (category) {
    pool = pool.filter((v) => v.category === category);
  }
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  res.json(shuffled.slice(0, count));
});

router.get("/vocabulary", (req, res) => {
  const { category, alphabet, difficulty, search } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Number(req.query.limit) || 20);

  let filtered = store.vocabularyItems.filter((v) => v.isActive);

  if (category) {
    filtered = filtered.filter((v) => v.category === category);
  }
  if (alphabet) {
    filtered = filtered.filter((v) => v.alphabet.toLowerCase() === (alphabet as string).toLowerCase());
  }
  if (difficulty) {
    filtered = filtered.filter((v) => v.difficulty === difficulty);
  }
  if (search) {
    const q = (search as string).toLowerCase().trim();
    filtered = filtered.filter(
      (v) =>
        v.word.toLowerCase().includes(q) ||
        v.meaning.toLowerCase().includes(q) ||
        (v.hindiMeaning && v.hindiMeaning.toLowerCase().includes(q)) ||
        v.synonyms.some((s) => s.toLowerCase().includes(q))
    );
  }

  const total = filtered.length;
  const offset = (page - 1) * limit;
  const items = filtered.slice(offset, offset + limit);

  res.json({
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

router.get("/vocabulary/:id", (req, res) => {
  const id = Number(req.params.id);
  const item = store.vocabularyItems.find((v) => v.id === id);
  if (!item) {
    return res.status(404).json({ error: "Word not found" });
  }
  res.json(item);
});

router.post("/vocabulary", adminMiddleware, (req, res) => {
  const item = store.addVocabItem(req.body);
  res.status(201).json(item);
});

router.put("/vocabulary/:id", adminMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const index = store.vocabularyItems.findIndex((v) => v.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Word not found" });
  }
  store.vocabularyItems[index] = {
    ...store.vocabularyItems[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  res.json(store.vocabularyItems[index]);
});

router.delete("/vocabulary/:id", adminMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const index = store.vocabularyItems.findIndex((v) => v.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Word not found" });
  }
  store.vocabularyItems.splice(index, 1);
  res.json({ success: true, message: "Word deleted" });
});

// ── Tests ──
router.post("/tests", authMiddleware, (req, res) => {
  const userId = (req as any).user.userId;
  const test = store.createTest(userId, req.body);
  res.status(201).json(test);
});

router.get("/tests/:id", authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const test = store.tests.find((t) => t.id === id);
  if (!test) {
    return res.status(404).json({ error: "Test not found" });
  }

  // Strip answers if test is in progress
  const sanitizedQuestions = test.questions.map((q) => ({
    id: q.id,
    questionNumber: q.questionNumber,
    questionText: q.questionText,
    options: q.options,
    vocabItemId: q.vocabItemId,
    userAnswer: test.status === "completed" ? q.userAnswer : undefined,
    correctAnswer: test.status === "completed" ? q.correctAnswer : undefined,
    isCorrect: test.status === "completed" ? q.isCorrect : undefined,
  }));

  res.json({
    id: test.id,
    status: test.status,
    totalQuestions: test.totalQuestions,
    score: test.score,
    timeDurationMinutes: test.timeDurationMinutes,
    timeTakenSeconds: test.timeTakenSeconds,
    config: test.config,
    createdAt: test.createdAt,
    completedAt: test.completedAt,
    questions: sanitizedQuestions,
  });
});

router.post("/tests/:id/submit", authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const userId = (req as any).user.userId;
  const { answers, timeTakenSeconds } = req.body;

  const completed = store.submitTest(id, userId, answers || {}, timeTakenSeconds);
  if (!completed) {
    return res.status(404).json({ error: "Test not found" });
  }
  res.json(completed);
});

router.get("/tests/:id/result", authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const test = store.tests.find((t) => t.id === id);
  if (!test) {
    return res.status(404).json({ error: "Test not found" });
  }

  const correctCount = test.questions.filter((q) => q.isCorrect === true).length;
  const incorrectCount = test.questions.filter((q) => q.isCorrect === false).length;
  const unattemptedCount = test.questions.filter((q) => q.isCorrect === null).length;
  const maxScore = test.totalQuestions * 2;
  const percentage = maxScore > 0 ? Math.round(((test.score || 0) / maxScore) * 100) : 0;

  res.json({
    test,
    summary: {
      totalQuestions: test.totalQuestions,
      correctCount,
      incorrectCount,
      unattemptedCount,
      score: test.score,
      maxScore,
      percentage,
      timeTakenSeconds: test.timeTakenSeconds,
    },
  });
});

router.get("/tests/history", authMiddleware, (req, res) => {
  const userId = (req as any).user.userId;
  const userTests = store.tests
    .filter((t) => t.userId === userId && t.status === "completed")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(
    userTests.map((t) => ({
      id: t.id,
      totalQuestions: t.totalQuestions,
      score: t.score,
      percentage: Math.round(((t.score || 0) / (t.totalQuestions * 2)) * 100),
      timeDurationMinutes: t.timeDurationMinutes,
      timeTakenSeconds: t.timeTakenSeconds,
      createdAt: t.createdAt,
      completedAt: t.completedAt,
    }))
  );
});

// ── Progress ──
router.get("/progress", authMiddleware, (req, res) => {
  const userId = (req as any).user.userId;
  const userProgress = store.wordProgress.filter((p) => p.userId === userId);
  const userTests = store.tests.filter((t) => t.userId === userId && t.status === "completed");

  const wordsLearned = userProgress.filter((p) => p.status === "learned").length;
  const wordsAttempted = userProgress.length;
  const wordsCorrectOnce = userProgress.filter((p) => p.timesCorrect >= 1).length;
  const wordsInProgress = userProgress.filter((p) => p.status === "learning").length;
  const weakWordsCount = userProgress.filter((p) => p.status === "weak").length;

  let totalQuestionsAnswered = 0;
  let totalCorrect = 0;
  for (const t of userTests) {
    for (const q of t.questions) {
      if (q.userAnswer) {
        totalQuestionsAnswered++;
        if (q.isCorrect) totalCorrect++;
      }
    }
  }
  const averageAccuracy = totalQuestionsAnswered > 0 ? Math.round((totalCorrect / totalQuestionsAnswered) * 100) : 0;

  // Category breakdown
  const categoryStats: Record<string, { learned: number; total: number }> = {};
  for (const item of store.vocabularyItems) {
    if (!categoryStats[item.category]) {
      categoryStats[item.category] = { learned: 0, total: 0 };
    }
    categoryStats[item.category].total++;
  }
  for (const p of userProgress) {
    if (p.status === "learned" || p.timesCorrect >= 1) {
      const v = store.vocabularyItems.find((item) => item.id === p.vocabItemId);
      if (v && categoryStats[v.category]) {
        categoryStats[v.category].learned++;
      }
    }
  }

  res.json({
    wordsLearned,
    wordsAttempted,
    wordsCorrectOnce,
    wordsInProgress,
    weakWords: weakWordsCount,
    totalWordsAvailable: store.vocabularyItems.length,
    testsAttempted: userTests.length,
    averageScore: averageAccuracy,
    streakDays: 4,
    lastActive: new Date().toISOString(),
    categoryProgress: Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      learned: stats.learned,
      total: stats.total,
    })),
  });
});

router.get("/progress/weak-words", authMiddleware, (req, res) => {
  const userId = (req as any).user.userId;
  const weak = store.wordProgress.filter((p) => p.userId === userId && p.status === "weak");
  const vocabIds = weak.map((p) => p.vocabItemId);
  const items = store.vocabularyItems.filter((v) => vocabIds.includes(v.id));
  res.json(items);
});

router.get("/progress/words/:wordId", authMiddleware, (req, res) => {
  const userId = (req as any).user.userId;
  const wordId = Number(req.params.wordId);
  const progress = store.wordProgress.find((p) => p.userId === userId && p.vocabItemId === wordId);
  if (!progress) {
    return res.json({
      status: "new",
      vocabItemId: wordId,
      timesSeen: 0,
      timesCorrect: 0,
      lastSeen: null,
      nextReview: null,
    });
  }
  res.json(progress);
});

router.put("/progress/words/:wordId", authMiddleware, (req, res) => {
  const userId = (req as any).user.userId;
  const wordId = Number(req.params.wordId);
  const { status } = req.body;

  let progress = store.wordProgress.find((p) => p.userId === userId && p.vocabItemId === wordId);
  if (!progress) {
    progress = {
      id: store.wordProgress.length + 1,
      userId,
      vocabItemId: wordId,
      status: status || "learning",
      timesSeen: 1,
      timesCorrect: status === "learned" ? 1 : 0,
      lastSeen: new Date().toISOString(),
      nextReview: new Date().toISOString(),
    };
    store.wordProgress.push(progress);
  } else {
    progress.status = status;
    progress.timesSeen++;
    progress.lastSeen = new Date().toISOString();
  }
  res.json(progress);
});

// ── Revision (Spaced Repetition) ──
router.get("/revision", authMiddleware, (req, res) => {
  const userId = (req as any).user.userId;
  const count = Number(req.query.count) || 10;

  // Words that are weak or learning or due
  const due = store.wordProgress.filter(
    (p) => p.userId === userId && (p.status === "weak" || p.status === "learning")
  );
  let dueVocabIds = due.map((p) => p.vocabItemId);

  // If not enough, fill with new random words
  if (dueVocabIds.length < count) {
    const seen = new Set(store.wordProgress.filter((p) => p.userId === userId).map((p) => p.vocabItemId));
    const unseen = store.vocabularyItems.filter((v) => !seen.has(v.id)).slice(0, count - dueVocabIds.length);
    dueVocabIds = [...dueVocabIds, ...unseen.map((v) => v.id)];
  }

  const words = store.vocabularyItems.filter((v) => dueVocabIds.includes(v.id)).slice(0, count);

  res.json({
    words,
    totalDue: Math.max(due.length, words.length),
  });
});

router.post("/revision/complete", authMiddleware, (req, res) => {
  const userId = (req as any).user.userId;
  const { results } = req.body; // array of { wordId, remembered: boolean }

  if (Array.isArray(results)) {
    for (const r of results) {
      store.recordWordAttempt(userId, r.wordId, r.remembered);
    }
  }

  res.json({ success: true, message: "Revision recorded successfully" });
});

// ── Stats & Leaderboard ──
router.get("/stats/dashboard", authMiddleware, (req, res) => {
  const userId = (req as any).user.userId;
  const userProgress = store.wordProgress.filter((p) => p.userId === userId);
  const userTests = store.tests.filter((t) => t.userId === userId && t.status === "completed");

  const wordsLearned = userProgress.filter((p) => p.status === "learned").length;
  const weakWordsCount = userProgress.filter((p) => p.status === "weak").length;

  let totalAttempts = 0;
  let correctAttempts = 0;
  for (const t of userTests) {
    for (const q of t.questions) {
      if (q.userAnswer) {
        totalAttempts++;
        if (q.isCorrect) correctAttempts++;
      }
    }
  }
  const averageScore = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  const recentTests = userTests.slice(-5).reverse().map((t) => {
    const maxScore = t.totalQuestions * 2;
    return {
      id: t.id,
      status: t.status,
      totalQuestions: t.totalQuestions,
      score: t.score,
      percentage: maxScore > 0 ? Math.round(((t.score || 0) / maxScore) * 100) : 0,
      timeDurationMinutes: t.timeDurationMinutes,
      timeTakenSeconds: t.timeTakenSeconds,
      config: t.config,
      createdAt: t.createdAt,
      completedAt: t.completedAt,
    };
  });

  res.json({
    wordsLearned,
    testsAttempted: userTests.length,
    currentStreak: 4,
    averageScore,
    wordsToRevise: weakWordsCount,
    weakWordsCount,
    recentTests,
    dailyGoalProgress: Math.min(100, Math.round((wordsLearned / 10) * 100)),
  });
});

router.get("/stats/leaderboard", (_req, res) => {
  // Aggregate rankings for users
  const leaderboard = store.users
    .filter((u) => u.role === "user")
    .map((u) => {
      const uProgress = store.wordProgress.filter((p) => p.userId === u.id);
      const uTests = store.tests.filter((t) => t.userId === u.id && t.status === "completed");
      const learned = uProgress.filter((p) => p.status === "learned").length;

      let scoreSum = 0;
      let maxScoreSum = 0;
      for (const t of uTests) {
        if (t.score != null) {
          scoreSum += t.score;
          maxScoreSum += t.totalQuestions * 2;
        }
      }
      const avgScore = maxScoreSum > 0 ? Math.min(100, Math.max(0, Math.round((scoreSum / maxScoreSum) * 100))) : 0;

      return {
        userId: u.id,
        name: u.name,
        wordsLearned: learned,
        testsAttempted: uTests.length,
        averageScore: avgScore,
      };
    })
    .sort((a, b) => b.wordsLearned - a.wordsLearned || b.averageScore - a.averageScore)
    .map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

  res.json(leaderboard);
});

router.get("/stats/category-breakdown", (_req, res) => {
  const counts: Record<string, number> = {};
  for (const item of store.vocabularyItems) {
    if (!item.isActive) continue;
    counts[item.category] = (counts[item.category] || 0) + 1;
  }
  res.json(Object.entries(counts).map(([category, count]) => ({ category, count })));
});

// ── Admin ──
router.post("/admin/auth", (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid admin password" });
  }

  const admin = store.users.find((u) => u.role === "admin") || store.users[0];
  const token = signToken({ userId: admin.id, email: admin.email, role: "admin" });

  res.json({
    token,
    user: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: "admin",
      createdAt: admin.createdAt,
    },
  });
});

router.get("/admin/stats", adminMiddleware, (_req, res) => {
  const catBreakdown: Record<string, number> = {};
  for (const item of store.vocabularyItems) {
    catBreakdown[item.category] = (catBreakdown[item.category] || 0) + 1;
  }

  res.json({
    totalUsers: store.users.filter((u) => u.role === "user").length,
    totalVocabulary: store.vocabularyItems.length,
    totalTests: store.tests.length,
    activeUsers: store.users.length,
    categoryBreakdown: Object.entries(catBreakdown).map(([category, count]) => ({ category, count })),
    recentActivity: store.tests.slice(-5).reverse(),
  });
});

router.get("/admin/users", adminMiddleware, (_req, res) => {
  const users = store.users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
  }));
  res.json({ items: users, total: users.length });
});

router.delete("/admin/users/:id", adminMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const idx = store.users.findIndex((u) => u.id === id);
  if (idx === -1) return res.status(404).json({ error: "User not found" });
  store.users.splice(idx, 1);
  res.json({ success: true, message: "User deleted" });
});

router.get("/admin/vocabulary", adminMiddleware, (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const items = store.vocabularyItems.slice(offset, offset + limit);
  res.json({
    items,
    total: store.vocabularyItems.length,
    page,
    limit,
    totalPages: Math.ceil(store.vocabularyItems.length / limit),
  });
});

router.delete("/admin/vocabulary", adminMiddleware, (_req, res) => {
  const count = store.vocabularyItems.length;
  store.vocabularyItems = [];
  res.json({ success: true, deleted: count });
});

router.post("/admin/vocabulary/bulk", adminMiddleware, (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "items must be an array" });
  }

  let created = 0;
  for (const item of items) {
    store.addVocabItem(item);
    created++;
  }
  res.status(201).json({ created, failed: 0, errors: [] });
});

export default router;
