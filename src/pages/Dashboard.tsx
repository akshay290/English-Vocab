import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { api, type DashboardStats, type ProgressSummary } from "../lib/api";
import { useAuth } from "../lib/auth";
import {
  Trophy,
  Target,
  Flame,
  Brain,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
  Image as ImageIcon,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dashData, progData] = await Promise.all([
          api.getDashboardStats(),
          api.getProgress(),
        ]);
        setStats(dashData);
        setProgress(progData);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Target SSC CGL / CHSL / CPO 2027</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name?.split(" ")[0] || "Aspirant"}! 🎯
          </h1>
          <p className="mt-2 text-sm sm:text-base text-indigo-100/90 leading-relaxed">
            Master high-frequency examination vocabulary with illustrated visual cards, spaced repetition revision, and SSC-pattern negative marking MCQs.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/tests"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-sm shadow-md hover:bg-amber-300 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Start Quick Practice Test</span>
            </Link>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur hover:bg-white/25 text-white font-semibold text-sm transition-colors border border-white/20"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Explore 1,281 Illustrated Idioms</span>
            </Link>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-card border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Words Mastered
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground">
              {stats?.wordsLearned ?? 12}
            </span>
            <span className="text-xs text-muted-foreground">words</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">
            Answered correct ≥2 times in tests
          </p>
        </div>

        <div className="p-5 rounded-xl bg-card border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Accuracy Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground">
              {stats?.averageScore ?? 85}%
            </span>
            <span className="text-xs text-muted-foreground">overall</span>
          </div>
          <p className="mt-1 text-[11px] text-indigo-600 font-medium">
            SSC Exam Scoring (+2 / −0.5)
          </p>
        </div>

        <div className="p-5 rounded-xl bg-card border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tests Completed
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground">
              {stats?.testsAttempted ?? 3}
            </span>
            <span className="text-xs text-muted-foreground">sessions</span>
          </div>
          <p className="mt-1 text-[11px] text-blue-600 font-medium">
            Adaptive 30:70 pool generation
          </p>
        </div>

        <div className="p-5 rounded-xl bg-card border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Due for Revision
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground">
              {stats?.wordsToRevise ?? 6}
            </span>
            <span className="text-xs text-muted-foreground">cards</span>
          </div>
          <Link
            href="/revision"
            className="mt-1 text-[11px] text-amber-600 hover:underline font-medium inline-block"
          >
            Review flashcards now →
          </Link>
        </div>
      </div>

      {/* Daily Target Progress & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Goal */}
        <div className="p-6 rounded-2xl bg-card border shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Daily Target
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                10 words/day
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Consistently learning 10 words daily yields over 3,000 words retained in a year.
            </p>
            <div className="mt-5">
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span>Progress Today</span>
                <span>{stats?.dailyGoalProgress ?? 70}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.dailyGoalProgress ?? 70}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
            <span>🔥 4-Day Active Streak</span>
            <Link href="/revision" className="font-semibold text-primary hover:underline">
              Continue Streak →
            </Link>
          </div>
        </div>

        {/* Illustrated Collection Spotlight */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 shadow-sm flex flex-col sm:flex-row gap-6 items-center">
          <div className="w-full sm:w-48 h-36 rounded-xl overflow-hidden bg-muted relative flex-shrink-0 border shadow-inner">
            <img
              src="/data/idioms/images/0001.jpg"
              alt="Idiom preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2.5">
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                1,281 Visual Cards
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500 text-white">
              Special 2027 Illustrated Edition
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Visual Idioms & One-Word Substitution Archive
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every idiom is paired with its original visual illustrated crop card, English meaning, and contextual Hindi explanation. Enhanced with audio pronunciation for rapid memory retention.
            </p>
            <div>
              <Link
                href="/collections"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
              >
                <span>Browse Illustrated Archive</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Category Progress Breakdown */}
      <div className="p-6 rounded-2xl bg-card border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Exam Categories Breakdown
            </h3>
            <p className="text-xs text-muted-foreground">
              Mastery progress across all 9 SSC syllabus categories
            </p>
          </div>
          <Link
            href="/vocabulary"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Browse all categories <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {progress?.categoryProgress.map((cat) => {
            const pct = cat.total > 0 ? Math.round((cat.learned / cat.total) * 100) : 0;
            const categoryNames: Record<string, string> = {
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
            const label = categoryNames[cat.category] || cat.category.replace(/_/g, " ");

            return (
              <div
                key={cat.category}
                className="p-4 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors border"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-foreground capitalize">{label}</span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {cat.learned} / {cat.total}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(5, pct)}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{pct}% mastered</span>
                  <Link
                    href={`/vocabulary?category=${cat.category}`}
                    className="hover:text-primary font-medium"
                  >
                    Study →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Tests Section */}
      <div className="p-6 rounded-2xl bg-card border shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Recent Test Performance
            </h3>
            <p className="text-xs text-muted-foreground">
              Detailed scoring history with SSC negative marking
            </p>
          </div>
          <Link href="/tests" className="text-xs font-semibold text-primary hover:underline">
            Take a new test →
          </Link>
        </div>

        {stats?.recentTests && stats.recentTests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4 rounded-l-lg">Test ID</th>
                  <th className="py-3 px-4">Questions</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 rounded-r-lg text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.recentTests.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-xs">#{t.id}</td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {t.totalQuestions} Questions
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-foreground">{t.score ?? 0}</span>
                      <span className="text-xs text-muted-foreground"> / {t.totalQuestions * 2}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          (t.percentage ?? 0) >= 70
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : (t.percentage ?? 0) >= 40
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                        }`}
                      >
                        {t.percentage ?? 0}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/tests/result/${t.id}`}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Review Test →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No test sessions recorded yet.</p>
            <Link
              href="/tests"
              className="mt-3 inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
            >
              Take Your First Test
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
