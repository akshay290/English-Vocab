import React, { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import confetti from "canvas-confetti";
import { api, type Test } from "../lib/api";
import {
  Trophy,
  CheckCircle,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Award,
  Clock,
  BookOpen,
} from "lucide-react";

export function TestResult() {
  const [, params] = useRoute("/tests/result/:id");
  const testId = params && "id" in params ? Number((params as { id: string }).id) : null;

  const [data, setData] = useState<{ test: Test; summary: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!testId) return;

    async function fetchResult() {
      try {
        const res = await api.getTestResult(testId);
        setData(res);

        // Confetti if scored >= 60%
        if (res.summary?.percentage >= 60) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      } catch (err) {
        console.error("Failed to load test result", err);
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [testId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground font-semibold">Generating performance report...</p>
      </div>
    );
  }

  if (!data || !data.test) {
    return (
      <div className="p-8 text-center rounded-2xl bg-card border max-w-md mx-auto space-y-4">
        <h3 className="font-bold text-base text-foreground">Scorecard Not Found</h3>
        <p className="text-xs text-muted-foreground">Unable to find test result data.</p>
        <Link
          href="/tests"
          className="inline-block px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
        >
          Go to Practice Tests
        </Link>
      </div>
    );
  }

  const { test, summary } = data;
  const isPass = summary.percentage >= 60;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Score Hero Card */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border shadow-xl text-center space-y-4 relative overflow-hidden ${
          isPass
            ? "bg-gradient-to-b from-emerald-500/10 via-background to-background border-emerald-500/30"
            : "bg-gradient-to-b from-indigo-500/10 via-background to-background border-border"
        }`}
      >
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg bg-gradient-to-tr from-indigo-600 to-emerald-500">
          <Trophy className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Test Performance Summary
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground mt-1">
            {summary.score} / {summary.maxScore}{" "}
            <span className="text-xl sm:text-2xl font-bold text-muted-foreground">
              ({summary.percentage}%)
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {isPass ? "🎉 Excellent score! Keep up this precision." : "📚 Good attempt! Review incorrect questions below to bridge knowledge gaps."}
          </p>
        </div>

        {/* Detailed Metrics Breakdown */}
        <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto pt-4">
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
            <div className="flex items-center justify-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold text-base">
              <CheckCircle className="w-4 h-4" />
              <span>{summary.correctCount}</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400 mt-0.5 block">
              Correct (+{summary.correctCount * 2})
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
            <div className="flex items-center justify-center gap-1.5 text-red-700 dark:text-red-300 font-bold text-base">
              <XCircle className="w-4 h-4" />
              <span>{summary.incorrectCount}</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-red-800 dark:text-red-400 mt-0.5 block">
              Incorrect (−{(summary.incorrectCount * 0.5).toFixed(1)})
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/60 border">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground font-bold text-base">
              <HelpCircle className="w-4 h-4" />
              <span>{summary.unattemptedCount}</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5 block">
              Skipped (0.0)
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/tests"
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary/90 transition-colors"
          >
            Start Another Test
          </Link>
          <Link
            href="/revision"
            className="px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs border transition-colors"
          >
            Revise Weak Words
          </Link>
        </div>
      </div>

      {/* Question by Question Review */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> Question Review & Detailed Explanations
          </h2>
          <span className="text-xs text-muted-foreground">
            {test.questions?.length} Questions Analyzed
          </span>
        </div>

        <div className="space-y-4">
          {test.questions?.map((q, idx) => {
            const isCorrect = q.isCorrect === true;
            const isIncorrect = q.isCorrect === false;
            const isSkipped = q.isCorrect === null || !q.userAnswer;

            return (
              <div
                key={q.id}
                className={`p-5 rounded-2xl border shadow-sm transition-all space-y-4 ${
                  isCorrect
                    ? "bg-emerald-50/20 border-emerald-500/30"
                    : isIncorrect
                    ? "bg-red-50/20 border-red-500/30"
                    : "bg-card border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-3 pb-3 border-b">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {idx + 1}
                    </span>
                    <h3 className="font-bold text-sm sm:text-base text-foreground">
                      {q.questionText}
                    </h3>
                  </div>

                  <div>
                    {isCorrect && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <CheckCircle className="w-3.5 h-3.5" /> +2.00
                      </span>
                    )}
                    {isIncorrect && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                        <XCircle className="w-3.5 h-3.5" /> −0.50
                      </span>
                    )}
                    {isSkipped && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        Skipped (0.0)
                      </span>
                    )}
                  </div>
                </div>

                {/* Options display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt, optIdx) => {
                    const isUserChoice = q.userAnswer === opt;
                    const isCorrectChoice = q.correctAnswer === opt;

                    let optClass = "bg-muted/40 text-muted-foreground border-border";
                    if (isCorrectChoice) {
                      optClass = "bg-emerald-100/70 border-emerald-500 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 font-bold";
                    } else if (isUserChoice && !isCorrect) {
                      optClass = "bg-red-100/70 border-red-500 text-red-900 dark:bg-red-950/60 dark:text-red-200 font-bold";
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-xl border flex items-start gap-2.5 ${optClass}`}
                      >
                        <span className="font-bold text-xs uppercase flex-shrink-0">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        <span className="flex-1">{opt}</span>
                        {isCorrectChoice && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />}
                        {isUserChoice && !isCorrect && <XCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />}
                      </div>
                    );
                  })}
                </div>

                {/* Vocabulary info note */}
                {q.vocabItem && (
                  <div className="pt-2 text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">Word: {q.vocabItem.word}</span>
                    {q.vocabItem.hindiMeaning && (
                      <span>• हिन्दी: <strong className="text-amber-700 dark:text-amber-400">{q.vocabItem.hindiMeaning}</strong></span>
                    )}
                    {q.vocabItem.synonyms?.length > 0 && (
                      <span>• Synonyms: {q.vocabItem.synonyms.join(", ")}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
