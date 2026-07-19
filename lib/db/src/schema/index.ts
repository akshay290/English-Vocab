import { pgTable, serial, text, integer, boolean, timestamp, jsonb, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"), // "user" | "admin"
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

// ─── Vocabulary Items ─────────────────────────────────────────────────────────

export const vocabularyItemsTable = pgTable("vocabulary_items", {
  id: serial("id").primaryKey(),
  word: text("word").notNull(),
  meaning: text("meaning").notNull(),
  hindiMeaning: text("hindi_meaning"),
  exampleSentence: text("example_sentence"),
  synonyms: jsonb("synonyms").$type<string[]>().notNull().default([]),
  antonyms: jsonb("antonyms").$type<string[]>().notNull().default([]),
  difficulty: text("difficulty").notNull().default("medium"), // easy | medium | hard
  category: text("category").notNull(),
  alphabet: text("alphabet").notNull(),
  topics: jsonb("topics").$type<string[]>().notNull().default([]),
  examRefs: jsonb("exam_refs").$type<string[]>().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertVocabularyItemSchema = createInsertSchema(vocabularyItemsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertVocabularyItem = z.infer<typeof insertVocabularyItemSchema>;
export type VocabularyItem = typeof vocabularyItemsTable.$inferSelect;

// ─── Tests ────────────────────────────────────────────────────────────────────

export const testsTable = pgTable("tests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  config: jsonb("config").notNull(),
  status: text("status").notNull().default("in_progress"), // in_progress | completed
  score: integer("score"),
  totalQuestions: integer("total_questions").notNull(),
  timeDurationMinutes: integer("time_duration_minutes"),
  timeTakenSeconds: integer("time_taken_seconds"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export type Test = typeof testsTable.$inferSelect;

// ─── Test Questions ───────────────────────────────────────────────────────────

export const testQuestionsTable = pgTable("test_questions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id")
    .notNull()
    .references(() => testsTable.id, { onDelete: "cascade" }),
  vocabItemId: integer("vocab_item_id")
    .notNull()
    .references(() => vocabularyItemsTable.id),
  questionText: text("question_text").notNull(),
  options: jsonb("options").$type<string[]>().notNull(),
  correctAnswer: integer("correct_answer").notNull(),
  userAnswer: integer("user_answer"),
  isCorrect: boolean("is_correct"),
  position: integer("position").notNull(),
});

export type TestQuestion = typeof testQuestionsTable.$inferSelect;

// ─── User Word Progress ───────────────────────────────────────────────────────

export const userWordProgressTable = pgTable(
  "user_word_progress",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    vocabItemId: integer("vocab_item_id")
      .notNull()
      .references(() => vocabularyItemsTable.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("new"), // new | learning | learned | weak
    timesSeen: integer("times_seen").notNull().default(0),
    timesCorrect: integer("times_correct").notNull().default(0),
    lastSeen: timestamp("last_seen"),
    nextReview: timestamp("next_review"),
  },
  (t) => [unique("uwp_user_vocab_unique").on(t.userId, t.vocabItemId)]
);

export type UserWordProgress = typeof userWordProgressTable.$inferSelect;
