import React, { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { api, type Test, type TestQuestion } from "../lib/api";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  Bookmark,
  Check,
  RotateCcw,
} from "lucide-react";

export function ActiveTest() {
  const [, params] = useRoute("/tests/active/:id");
  const [, setLocation] = useLocation();

  const testId = params && "id" in params ? Number((params as { id: string }).id) : null;
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(600); // 10 mins default
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (!testId) return;

    async function fetchTest() {
      try {
        const data = await api.getTest(testId);
        if (data.status === "completed") {
          setLocation(`/tests/result/${data.id}`, { replace: true });
          return;
        }
        setTest(data);
        setTimeLeft((data.timeDurationMinutes || 10) * 60);
      } catch (err: any) {
        setError(err.message || "Failed to load test session");
      } finally {
        setLoading(false);
      }
    }
    fetchTest();
  }, [testId]);

  // Countdown timer
  useEffect(() => {
    if (loading || submitting || !test) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, submitting, test]);

  const handleSubmitTest = async () => {
    if (!test || submitting) return;
    setSubmitting(true);
    setShowConfirmModal(false);

    try {
      const timeTakenSeconds = (test.timeDurationMinutes * 60) - timeLeft;
      await api.submitTest(test.id, {
        answers,
        timeTakenSeconds: Math.max(1, timeTakenSeconds),
      });
      // Use replace: true to prevent back-navigation loop per architecture memory
      setLocation(`/tests/result/${test.id}`, { replace: true });
    } catch (err: any) {
      setError(err.message || "Failed to submit test");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground font-semibold">
          Loading exam question paper...
        </p>
      </div>
    );
  }

  if (error || !test || !test.questions || test.questions.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-card border max-w-md mx-auto space-y-4">
        <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
        <h3 className="font-bold text-base text-foreground">Error Loading Test</h3>
        <p className="text-xs text-muted-foreground">{error || "Test questions not found"}</p>
        <button
          type="button"
          onClick={() => setLocation("/tests")}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
        >
          Return to Tests Hub
        </button>
      </div>
    );
  }

  const currentQuestion = test.questions[currentIndex];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isTimeCritical = timeLeft < 120; // less than 2 mins left

  const currentAnswer = answers[String(currentQuestion.id)] || "";
  const isMarked = !!markedForReview[currentQuestion.id];

  const handleSelectOption = (opt: string) => {
    setAnswers((prev) => ({
      ...prev,
      [String(currentQuestion.id)]: opt,
    }));
  };

  const handleClearAnswer = () => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[String(currentQuestion.id)];
      return copy;
    });
  };

  const toggleMarkForReview = () => {
    setMarkedForReview((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  };

  const attemptedCount = Object.keys(answers).length;
  const unattemptedCount = test.questions.length - attemptedCount;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header & Sticky Timer */}
      <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-card border shadow-sm sticky top-20 z-40">
        <div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            SSC Practice Test #{test.id}
          </span>
          <h2 className="font-extrabold text-sm sm:text-base text-foreground">
            Question {currentIndex + 1} of {test.questions.length}
          </h2>
        </div>

        {/* Timer display */}
        <div
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border font-mono font-bold text-sm sm:text-base ${
            isTimeCritical
              ? "bg-red-500/15 text-red-600 border-red-500/30 animate-pulse"
              : "bg-muted text-foreground border-border"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowConfirmModal(true)}
          disabled={submitting}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Finish & Submit</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Question Area */}
        <div className="lg:col-span-3 p-6 sm:p-8 rounded-2xl bg-card border shadow-sm space-y-6 flex flex-col justify-between min-h-[420px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider">
                Question {currentIndex + 1}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">+2.00</span>
                <span>/</span>
                <span className="text-red-600 font-bold">−0.50</span>
              </div>
            </div>

            {/* Question Text */}
            <div className="mt-4">
              <h3 className="text-lg sm:text-xl font-bold text-foreground leading-snug">
                {currentQuestion.questionText}
              </h3>
            </div>

            {/* 4 MCQ Options — key={currentQuestion.id} applied to prevent answer carry-over */}
            <div key={currentQuestion.id} className="mt-6 space-y-3">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = currentAnswer === option;
                const optionLabel = String.fromCharCode(65 + idx); // A, B, C, D

                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectOption(option)}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-sm font-medium cursor-pointer transition-all ${
                      isSelected
                        ? "bg-primary/10 border-primary text-foreground shadow-sm"
                        : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground border"
                      }`}
                    >
                      {optionLabel}
                    </div>
                    <span className="flex-1 mt-0.5 leading-relaxed">{option}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question Action Controls */}
          <div className="pt-6 border-t flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMarkForReview}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  isMarked
                    ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isMarked ? "Marked for Review" : "Mark Review"}</span>
              </button>

              {currentAnswer && (
                <button
                  type="button"
                  onClick={handleClearAnswer}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <RotateCcw className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <button
                type="button"
                disabled={currentIndex === test.questions.length - 1}
                onClick={() =>
                  setCurrentIndex((prev) => Math.min(test.questions!.length - 1, prev + 1))
                }
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Question Palette & Status Summary */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-card border shadow-sm space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Question Palette
            </h4>

            {/* Grid of question buttons */}
            <div className="grid grid-cols-5 gap-2">
              {test.questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = !!answers[String(q.id)];
                const isMarkedReview = !!markedForReview[q.id];

                let bgClass = "bg-muted text-muted-foreground hover:bg-muted/80";
                if (isCurrent) {
                  bgClass = "ring-2 ring-primary ring-offset-2 font-black " + (isAnswered ? "bg-emerald-600 text-white" : "bg-muted text-foreground");
                } else if (isAnswered) {
                  bgClass = "bg-emerald-600 text-white font-bold";
                } else if (isMarkedReview) {
                  bgClass = "bg-amber-500 text-white font-bold";
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-lg text-xs flex items-center justify-center transition-all ${bgClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t space-y-1.5 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-600" />
                <span>Answered ({attemptedCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-muted border" />
                <span>Unattempted ({unattemptedCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span>Marked for Review ({Object.values(markedForReview).filter(Boolean).length})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card rounded-2xl border shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-foreground">Submit Practice Test?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You have answered <strong className="text-foreground">{attemptedCount}</strong> out of{" "}
              <strong className="text-foreground">{test.questions.length}</strong> questions.{" "}
              {unattemptedCount > 0 && (
                <span>
                  There are <strong className="text-amber-600">{unattemptedCount}</strong> unattempted questions remaining.
                </span>
              )}
            </p>

            <div className="pt-4 border-t flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground"
              >
                Keep Testing
              </button>
              <button
                type="button"
                onClick={handleSubmitTest}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Yes, Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
