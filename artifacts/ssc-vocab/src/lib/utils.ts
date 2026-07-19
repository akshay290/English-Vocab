import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const CATEGORY_COLORS: Record<string, string> = {
  synonyms: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  antonyms: "text-red-500 bg-red-500/10 border-red-500/20",
  one_word_substitution: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  idioms_phrases: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  important_vocabulary: "text-green-500 bg-green-500/10 border-green-500/20",
  phrasal_verbs: "text-teal-500 bg-teal-500/10 border-teal-500/20",
  root_words: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
  confusing_words: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  spellings: "text-pink-500 bg-pink-500/10 border-pink-500/20",
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  medium: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  hard: "text-red-600 bg-red-500/10 border-red-500/20",
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const CATEGORY_LABELS: Record<string, string> = {
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

export function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] || "text-slate-500 bg-slate-500/10 border-slate-500/20";
}

export function getDifficultyColor(difficulty: string) {
  return DIFFICULTY_COLORS[difficulty] || "text-slate-500 bg-slate-500/10 border-slate-500/20";
}

export function formatCategory(category: string) {
  return CATEGORY_LABELS[category] || category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
