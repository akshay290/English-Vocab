import React, { useState } from "react";
import { useLocation } from "wouter";
import { api } from "../lib/api";
import {
  CheckCircle2,
  Clock,
  Settings2,
  Zap,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Flame,
} from "lucide-react";

export function Tests() {
  const [, setLocation] = useLocation();

  const [categories, setCategories] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [totalQuestions, setTotalQuestions] = useState<number>(10);
  const [timeDurationMinutes, setTimeDurationMinutes] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableCategories = [
    { slug: "synonyms", label: "Synonyms" },
    { slug: "antonyms", label: "Antonyms" },
    { slug: "one_word_substitution", label: "One Word Substitution" },
    { slug: "idioms_phrases", label: "Idioms & Phrases" },
    { slug: "phrasal_verbs", label: "Phrasal Verbs" },
    { slug: "root_words", label: "Root Words" },
    { slug: "confusing_words", label: "Confusing Words" },
    { slug: "spellings", label: "Spellings" },
    { slug: "important_vocabulary", label: "Important Vocab" },
  ];

  const toggleCategory = (slug: string) => {
    if (categories.includes(slug)) {
      setCategories(categories.filter((c) => c !== slug));
    } else {
      setCategories([...categories, slug]);
    }
  };

  const startTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const test = await api.createTest({
        categories: categories.length > 0 ? categories : undefined,
        difficulty: difficulty === "all" ? undefined : difficulty,
        totalQuestions,
        timeDurationMinutes,
      });
      setLocation(`/tests/active/${test.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create test session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <CheckCircle2 className="w-7 h-7 text-primary" /> SSC MCQ Practice Tests
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Simulate official SSC examination conditions with standard negative marking (+2 for correct, −0.5 for wrong).
        </p>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => {
            setTotalQuestions(10);
            setTimeDurationMinutes(8);
            setDifficulty("medium");
            setCategories([]);
            startTest();
          }}
          className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-500/20 shadow-sm hover:shadow-md cursor-pointer transition-all space-y-2 group"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-foreground group-hover:text-indigo-600 transition-colors">
            Quick Sprint (10 Qs)
          </h3>
          <p className="text-xs text-muted-foreground">
            Balanced 10-question mixed bag across all syllabus categories. 8 minutes.
          </p>
          <div className="pt-2 text-xs font-semibold text-indigo-600 flex items-center gap-1">
            Launch Sprint <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div
          onClick={() => {
            setTotalQuestions(25);
            setTimeDurationMinutes(20);
            setDifficulty("medium");
            setCategories([]);
            startTest();
          }}
          className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 shadow-sm hover:shadow-md cursor-pointer transition-all space-y-2 group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-foreground group-hover:text-emerald-600 transition-colors">
            Tier-1 Mock (25 Qs)
          </h3>
          <p className="text-xs text-muted-foreground">
            Full English section length. Tests vocabulary speed, stamina, and accuracy. 20 minutes.
          </p>
          <div className="pt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1">
            Launch Mock <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div
          onClick={() => {
            setTotalQuestions(15);
            setTimeDurationMinutes(12);
            setDifficulty("hard");
            setCategories([]);
            startTest();
          }}
          className="p-5 rounded-2xl bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border border-red-500/20 shadow-sm hover:shadow-md cursor-pointer transition-all space-y-2 group"
        >
          <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">
            <Flame className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-foreground group-hover:text-red-600 transition-colors">
            Hard / Tier-2 Drill
          </h3>
          <p className="text-xs text-muted-foreground">
            Tougher, high-frequency confusing traps and advanced idioms. 12 minutes.
          </p>
          <div className="pt-2 text-xs font-semibold text-red-600 flex items-center gap-1">
            Launch Drill <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Custom Test Builder */}
      <div className="p-6 rounded-2xl bg-card border shadow-sm space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b">
          <Settings2 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Custom Test Generator</h2>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Categories Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              1. Select Categories (Optional — defaults to all)
            </label>
            {categories.length > 0 && (
              <button
                type="button"
                onClick={() => setCategories([])}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Clear Selection
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {availableCategories.map((cat) => {
              const selected = categories.includes(cat.slug);
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => toggleCategory(cat.slug)}
                  className={`p-3 rounded-xl text-xs font-semibold text-left border transition-all ${
                    selected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted border-border"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Difficulty, Count & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2 block">
              2. Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Difficulties Mixed</option>
              <option value="easy">Easy (Tier-1 Basic)</option>
              <option value="medium">Medium (Moderate Standard)</option>
              <option value="hard">Hard (Tier-2 Advanced)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2 block">
              3. Questions Count
            </label>
            <select
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={5}>5 Questions (Rapid)</option>
              <option value={10}>10 Questions (Standard)</option>
              <option value={15}>15 Questions</option>
              <option value={20}>20 Questions</option>
              <option value={25}>25 Questions (Full Section)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2 block">
              4. Time Duration
            </label>
            <select
              value={timeDurationMinutes}
              onChange={(e) => setTimeDurationMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={5}>5 Minutes</option>
              <option value={10}>10 Minutes</option>
              <option value={15}>15 Minutes</option>
              <option value={20}>20 Minutes</option>
            </select>
          </div>
        </div>

        {/* SSC Marking Scheme Note */}
        <div className="p-4 rounded-xl bg-muted/60 border text-xs text-muted-foreground space-y-1">
          <span className="font-bold text-foreground block">
            ⚖️ Official SSC Exam Marking Pattern:
          </span>
          <p>
            • Correct answer: <strong className="text-emerald-600">+2.00 marks</strong>
          </p>
          <p>
            • Incorrect answer: <strong className="text-red-600">−0.50 marks (negative marking)</strong>
          </p>
          <p>• Unattempted question: <strong>0.00 marks</strong></p>
        </div>

        {/* Launch Button */}
        <div>
          <button
            type="button"
            disabled={loading}
            onClick={startTest}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? "Generating Adaptive Test..." : `Start Custom Test (${totalQuestions} Questions)`}
          </button>
        </div>
      </div>
    </div>
  );
}
