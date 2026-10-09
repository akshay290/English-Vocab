import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import confetti from "canvas-confetti";
import { api, type VocabItem } from "../lib/api";
import { AudioButton } from "../components/AudioPlayer";
import {
  RotateCcw,
  CheckCircle,
  XCircle,
  BrainCircuit,
  Eye,
  Sparkles,
  Trophy,
  ArrowRight,
} from "lucide-react";

export function Revision() {
  const [words, setWords] = useState<VocabItem[]>([]);
  const [totalDue, setTotalDue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<Array<{ wordId: number; remembered: boolean }>>([]);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function loadRevision() {
      try {
        const data = await api.getRevisionWords(10);
        setWords(data.words);
        setTotalDue(data.totalDue);
      } catch (err) {
        console.error("Failed to load revision words", err);
      } finally {
        setLoading(false);
      }
    }
    loadRevision();
  }, []);

  const handleAction = async (remembered: boolean) => {
    if (currentIndex >= words.length) return;
    const currentWord = words[currentIndex];
    const newResults = [...results, { wordId: currentWord.id, remembered }];
    setResults(newResults);
    setIsFlipped(false);

    if (currentIndex + 1 >= words.length) {
      // Finished deck
      setCompleted(true);
      confetti({ particleCount: 70, spread: 60 });
      try {
        await api.completeRevision(newResults);
      } catch (e) {
        console.error("Failed to record revision", e);
      }
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground font-semibold">Loading spaced repetition deck...</p>
      </div>
    );
  }

  if (words.length === 0 || completed) {
    const rememberedCount = results.filter((r) => r.remembered).length;
    const forgotCount = results.filter((r) => !r.remembered).length;

    return (
      <div className="max-w-md mx-auto p-8 rounded-3xl bg-card border shadow-xl text-center space-y-6 my-8">
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white bg-gradient-to-tr from-indigo-600 to-emerald-500 shadow-lg">
          <Trophy className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-foreground">
            {completed ? "Revision Session Complete! 🎉" : "All Caught Up! ✨"}
          </h2>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            {completed
              ? `You reviewed ${results.length} cards. Your spaced repetition schedules have been updated.`
              : "No words are currently due for revision. Great job keeping your vocabulary memory fresh!"}
          </p>
        </div>

        {completed && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-center">
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                {rememberedCount}
              </span>
              <span className="text-[10px] block font-semibold uppercase text-emerald-800 dark:text-emerald-400">
                Remembered
              </span>
            </div>
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-center">
              <span className="text-xl font-bold text-red-700 dark:text-red-300">
                {forgotCount}
              </span>
              <span className="text-[10px] block font-semibold uppercase text-red-800 dark:text-red-400">
                Need Practice
              </span>
            </div>
          </div>
        )}

        <div className="pt-4 flex flex-col gap-2">
          <Link
            href="/tests"
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary/90 text-center"
          >
            Take an MCQ Practice Test
          </Link>
          <Link
            href="/vocabulary"
            className="w-full py-2.5 rounded-xl bg-muted text-foreground font-semibold text-xs text-center hover:bg-muted/80"
          >
            Explore Vocabulary Library
          </Link>
        </div>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header & Deck Progress */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <BrainCircuit className="w-4 h-4 text-primary" /> Spaced Repetition Engine
          </span>
          <h1 className="text-xl font-black text-foreground">
            Card {currentIndex + 1} of {words.length}
          </h1>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          {totalDue} due in queue
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
        />
      </div>

      {/* Interactive Flashcard */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="min-h-[340px] rounded-3xl bg-card border shadow-lg hover:shadow-xl transition-all p-8 flex flex-col justify-between cursor-pointer relative overflow-hidden select-none group"
      >
        {/* Card Header */}
        <div className="flex items-start justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground capitalize">
            {currentWord.category.replace(/_/g, " ")}
          </span>
          <AudioButton text={currentWord.word} />
        </div>

        {/* Card Body */}
        <div className="my-auto text-center space-y-4 py-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            {currentWord.word}
          </h2>

          {!isFlipped ? (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full animate-pulse">
              <Eye className="w-3.5 h-3.5" /> Tap card to reveal Hindi meaning & examples
            </div>
          ) : (
            <div className="space-y-4 pt-2 animate-in fade-in zoom-in-95 duration-200">
              <p className="text-base font-semibold text-foreground max-w-lg mx-auto">
                {currentWord.meaning}
              </p>

              {currentWord.hindiMeaning && (
                <div className="inline-block p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-sm font-bold text-amber-800 dark:text-amber-300">
                  🇮🇳 {currentWord.hindiMeaning}
                </div>
              )}

              {currentWord.exampleSentence && (
                <p className="text-xs italic text-muted-foreground max-w-md mx-auto">
                  "{currentWord.exampleSentence}"
                </p>
              )}

              {currentWord.synonyms?.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                  {currentWord.synonyms.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card Footer prompt */}
        <div className="text-center text-[11px] text-muted-foreground border-t pt-3">
          {isFlipped ? "Did you recall this word correctly?" : "Click anywhere on the card to flip"}
        </div>
      </div>

      {/* Review Feedback Controls */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => handleAction(false)}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-950 dark:hover:bg-red-900 dark:text-red-300 font-bold text-sm transition-colors border border-red-200 dark:border-red-900 shadow-sm"
        >
          <XCircle className="w-5 h-5 text-red-600" />
          <span>Forgot / Weak</span>
        </button>

        <button
          type="button"
          onClick={() => handleAction(true)}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:text-emerald-300 font-bold text-sm transition-colors border border-emerald-200 dark:border-emerald-900 shadow-sm"
        >
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>Remembered / Mastered</span>
        </button>
      </div>
    </div>
  );
}
