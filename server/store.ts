import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { VOCAB_SEEDS, type VocabItemSeed } from "./data/vocabSeeds";

export interface VocabItem {
  id: number;
  word: string;
  meaning: string;
  hindiMeaning: string | null;
  exampleSentence: string | null;
  synonyms: string[];
  antonyms: string[];
  difficulty: "easy" | "medium" | "hard";
  category: string;
  alphabet: string;
  topics: string[];
  examRefs: string[];
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: "user" | "admin";
  isActive: boolean;
  createdAt: string;
}

export interface TestQuestion {
  id: number;
  testId: number;
  vocabItemId: number;
  questionNumber: number;
  questionText: string;
  options: string[]; // 4 choices
  correctAnswer: string;
  userAnswer?: string | null;
  isCorrect?: boolean | null;
  vocabItem?: VocabItem;
}

export interface Test {
  id: number;
  userId: number;
  status: "in_progress" | "completed" | "abandoned";
  totalQuestions: number;
  score: number | null; // e.g. +2 correct, -0.5 incorrect
  timeDurationMinutes: number;
  timeTakenSeconds: number | null;
  config: {
    categories?: string[];
    alphabets?: string[];
    difficulty?: string;
    totalQuestions: number;
    timeDurationMinutes: number;
    questionMode?: string;
  };
  questions: TestQuestion[];
  createdAt: string;
  completedAt: string | null;
}

export interface UserWordProgress {
  id: number;
  userId: number;
  vocabItemId: number;
  status: "new" | "learning" | "learned" | "weak";
  timesSeen: number;
  timesCorrect: number;
  lastSeen: string | null;
  nextReview: string | null;
}

class InMemoryStore {
  public vocabularyItems: VocabItem[] = [];
  public users: User[] = [];
  public tests: Test[] = [];
  public wordProgress: UserWordProgress[] = [];

  private nextVocabId = 1;
  private nextUserId = 1;
  private nextTestId = 1;
  private nextQuestionId = 1;
  private nextProgressId = 1;

  constructor() {
    this.initData();
  }

  private initData() {
    // 1. Seed admin and demo student users
    const adminPasswordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || "sscvocab@admin2024", 10);
    const studentPasswordHash = bcrypt.hashSync("student123", 10);

    const adminUser: User = {
      id: this.nextUserId++,
      name: "Admin",
      email: "admin@sscvocab.local",
      passwordHash: adminPasswordHash,
      role: "admin",
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const studentUser: User = {
      id: this.nextUserId++,
      name: "Akshay Sharma",
      email: "student@sscvocab.com",
      passwordHash: studentPasswordHash,
      role: "user",
      isActive: true,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    };

    const student2: User = {
      id: this.nextUserId++,
      name: "Priya Patel",
      email: "priya@sscvocab.com",
      passwordHash: studentPasswordHash,
      role: "user",
      isActive: true,
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    };

    const student3: User = {
      id: this.nextUserId++,
      name: "Rahul Verma",
      email: "rahul@sscvocab.com",
      passwordHash: studentPasswordHash,
      role: "user",
      isActive: true,
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    };

    this.users.push(adminUser, studentUser, student2, student3);

    // 2. Load Vocab Seeds
    for (const seed of VOCAB_SEEDS) {
      this.vocabularyItems.push({
        id: this.nextVocabId++,
        word: seed.word,
        meaning: seed.meaning,
        hindiMeaning: seed.hindiMeaning,
        exampleSentence: seed.exampleSentence || null,
        synonyms: seed.synonyms,
        antonyms: seed.antonyms,
        difficulty: seed.difficulty,
        category: seed.category,
        alphabet: seed.alphabet.toLowerCase(),
        topics: seed.topics,
        examRefs: seed.examRefs,
        imageUrl: seed.imageUrl || null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // 3. Load 1,281 Idioms from public/data/idioms/idioms_1281.json
    try {
      const idiomsPath = path.resolve(process.cwd(), "public/data/idioms/idioms_1281.json");
      if (fs.existsSync(idiomsPath)) {
        const raw = fs.readFileSync(idiomsPath, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.entries)) {
          for (const item of parsed.entries) {
            const word = item.word || item.idiom || `Idiom ${item.id}`;
            const firstLetter = (word.replace(/^[^a-zA-Z]+/, "")[0] || "a").toLowerCase();
            this.vocabularyItems.push({
              id: this.nextVocabId++,
              word,
              meaning: item.english_meaning || item.meaning || "Meaning in progress",
              hindiMeaning: item.hindi_meaning || item.hindiMeaning || null,
              exampleSentence: null,
              synonyms: [],
              antonyms: [],
              difficulty: "medium",
              category: "idioms_phrases",
              alphabet: firstLetter,
              topics: ["Idioms and Phrases", "Illustrated 2027 Collection"],
              examRefs: ["SSC Exam Archive"],
              imageUrl: item.image ? `/data/idioms/${item.image}` : null,
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
          console.log(`[Store] Successfully loaded ${parsed.entries.length} illustrated idioms!`);
        }
      }
    } catch (e) {
      console.warn("[Store] Note: Could not load idioms_1281.json, continuing with seeds:", e);
    }

    // 4. Create some initial practice test results for demo students to populate leaderboard & analytics
    this.seedDemoActivity(studentUser.id);
    this.seedDemoActivity(student2.id, 8);
    this.seedDemoActivity(student3.id, 14);
  }

  private seedDemoActivity(userId: number, correctCount = 12) {
    const sampleWords = this.vocabularyItems.slice(0, 15);
    const testId = this.nextTestId++;
    const questions: TestQuestion[] = [];

    let score = 0;
    sampleWords.forEach((word, idx) => {
      const isCorrect = idx < correctCount;
      if (isCorrect) score += 2;
      else score -= 0.5;

      const q: TestQuestion = {
        id: this.nextQuestionId++,
        testId,
        vocabItemId: word.id,
        questionNumber: idx + 1,
        questionText: `What is the meaning of "${word.word}"?`,
        options: [
          word.meaning,
          "To reject or cancel abruptly",
          "Excessive pride or insolence",
          "Fleeting and momentary existence",
        ].sort(() => 0.5 - Math.random()),
        correctAnswer: word.meaning,
        userAnswer: isCorrect ? word.meaning : "To reject or cancel abruptly",
        isCorrect,
        vocabItem: word,
      };
      questions.push(q);

      this.wordProgress.push({
        id: this.nextProgressId++,
        userId,
        vocabItemId: word.id,
        status: isCorrect ? (idx % 2 === 0 ? "learned" : "learning") : "weak",
        timesSeen: 2,
        timesCorrect: isCorrect ? 2 : 0,
        lastSeen: new Date(Date.now() - idx * 3600000).toISOString(),
        nextReview: isCorrect ? new Date(Date.now() + 86400000).toISOString() : new Date().toISOString(),
      });
    });

    const test: Test = {
      id: testId,
      userId,
      status: "completed",
      totalQuestions: sampleWords.length,
      score: Math.max(0, score),
      timeDurationMinutes: 10,
      timeTakenSeconds: 340,
      config: {
        totalQuestions: sampleWords.length,
        timeDurationMinutes: 10,
        difficulty: "medium",
      },
      questions,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      completedAt: new Date(Date.now() - 86400000 + 340000).toISOString(),
    };
    this.tests.push(test);
  }

  // Helper for generating test questions with real distractors
  public createTest(userId: number, config: any): Test {
    const totalQuestions = Number(config.totalQuestions) || 10;
    const timeDurationMinutes = Number(config.timeDurationMinutes) || 10;
    const { categories, alphabets, difficulty } = config;

    let pool = this.vocabularyItems.filter((v) => v.isActive);

    if (categories && Array.isArray(categories) && categories.length > 0) {
      pool = pool.filter((v) => categories.includes(v.category));
    }
    if (alphabets && Array.isArray(alphabets) && alphabets.length > 0) {
      const lowerAlphas = alphabets.map((a: string) => a.toLowerCase());
      pool = pool.filter((v) => lowerAlphas.includes(v.alphabet));
    }
    if (difficulty && difficulty !== "all") {
      pool = pool.filter((v) => v.difficulty === difficulty);
    }

    if (pool.length < totalQuestions) {
      // Fallback: broaden pool to all items
      pool = this.vocabularyItems.filter((v) => v.isActive);
    }

    // Shuffle pool
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, totalQuestions);

    const testId = this.nextTestId++;
    const questions: TestQuestion[] = selected.map((item, idx) => {
      // Pick 3 distractors from the remaining pool
      const distractors = this.vocabularyItems
        .filter((v) => v.id !== item.id && v.meaning !== item.meaning)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((v) => v.meaning);

      while (distractors.length < 3) {
        distractors.push(`Alternative meaning option ${distractors.length + 1}`);
      }

      const options = [item.meaning, ...distractors].sort(() => 0.5 - Math.random());

      return {
        id: this.nextQuestionId++,
        testId,
        vocabItemId: item.id,
        questionNumber: idx + 1,
        questionText: `What is the correct meaning of "${item.word}"?`,
        options,
        correctAnswer: item.meaning,
        userAnswer: null,
        isCorrect: null,
        vocabItem: item,
      };
    });

    const newTest: Test = {
      id: testId,
      userId,
      status: "in_progress",
      totalQuestions: selected.length,
      score: null,
      timeDurationMinutes,
      timeTakenSeconds: null,
      config,
      questions,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    this.tests.push(newTest);
    return newTest;
  }

  public submitTest(testId: number, userId: number, answers: Record<string, string>, timeTakenSeconds?: number): Test | null {
    const test = this.tests.find((t) => t.id === testId && t.userId === userId);
    if (!test) return null;

    let score = 0;

    for (const q of test.questions) {
      const submittedAnswer = answers[String(q.id)] || answers[String(q.questionNumber)];
      q.userAnswer = submittedAnswer || null;

      if (!submittedAnswer) {
        q.isCorrect = null; // Unattempted
      } else if (submittedAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
        q.isCorrect = true;
        score += 2; // +2 for correct
      } else {
        q.isCorrect = false;
        score -= 0.5; // -0.5 for incorrect
      }

      // Update user word progress
      this.recordWordAttempt(userId, q.vocabItemId, q.isCorrect);
    }

    test.status = "completed";
    test.score = Math.max(0, score);
    test.timeTakenSeconds = timeTakenSeconds || 0;
    test.completedAt = new Date().toISOString();

    return test;
  }

  public recordWordAttempt(userId: number, vocabItemId: number, isCorrect: boolean | null) {
    let progress = this.wordProgress.find((p) => p.userId === userId && p.vocabItemId === vocabItemId);
    const now = new Date().toISOString();

    if (!progress) {
      progress = {
        id: this.nextProgressId++,
        userId,
        vocabItemId,
        status: isCorrect === true ? "learning" : isCorrect === false ? "weak" : "new",
        timesSeen: isCorrect !== null ? 1 : 0,
        timesCorrect: isCorrect === true ? 1 : 0,
        lastSeen: now,
        nextReview: new Date(Date.now() + 86400000).toISOString(),
      };
      this.wordProgress.push(progress);
    } else {
      if (isCorrect !== null) {
        progress.timesSeen += 1;
        if (isCorrect === true) {
          progress.timesCorrect += 1;
          if (progress.timesCorrect >= 2) {
            progress.status = "learned";
          } else {
            progress.status = "learning";
          }
          // Spaced repetition interval increases
          progress.nextReview = new Date(Date.now() + 3 * 86400000).toISOString();
        } else {
          progress.status = "weak";
          progress.nextReview = new Date(Date.now() + 86400000).toISOString();
        }
        progress.lastSeen = now;
      }
    }
  }

  public addVocabItem(data: Partial<VocabItem>): VocabItem {
    const item: VocabItem = {
      id: this.nextVocabId++,
      word: data.word || "Untitled",
      meaning: data.meaning || "",
      hindiMeaning: data.hindiMeaning || null,
      exampleSentence: data.exampleSentence || null,
      synonyms: data.synonyms || [],
      antonyms: data.antonyms || [],
      difficulty: data.difficulty || "medium",
      category: data.category || "synonyms",
      alphabet: (data.alphabet || data.word?.[0] || "a").toLowerCase(),
      topics: data.topics || [],
      examRefs: data.examRefs || [],
      imageUrl: data.imageUrl || null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.vocabularyItems.push(item);
    return item;
  }
}

export const store = new InMemoryStore();
