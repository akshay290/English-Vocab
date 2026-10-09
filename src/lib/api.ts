export interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
}

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

export interface TestQuestion {
  id: number;
  questionNumber: number;
  questionText: string;
  options: string[];
  vocabItemId: number;
  userAnswer?: string | null;
  correctAnswer?: string;
  isCorrect?: boolean | null;
  vocabItem?: VocabItem;
}

export interface Test {
  id: number;
  status: "in_progress" | "completed" | "abandoned";
  totalQuestions: number;
  score: number | null;
  timeDurationMinutes: number;
  timeTakenSeconds: number | null;
  config: any;
  createdAt: string;
  completedAt: string | null;
  questions?: TestQuestion[];
}

export interface DashboardStats {
  wordsLearned: number;
  testsAttempted: number;
  currentStreak: number;
  averageScore: number;
  wordsToRevise: number;
  weakWordsCount: number;
  recentTests: any[];
  dailyGoalProgress: number;
}

export interface ProgressSummary {
  wordsLearned: number;
  wordsAttempted: number;
  wordsCorrectOnce: number;
  wordsInProgress: number;
  weakWords: number;
  totalWordsAvailable: number;
  testsAttempted: number;
  averageScore: number;
  streakDays: number;
  lastActive: string | null;
  categoryProgress: Array<{ category: string; learned: number; total: number }>;
}

export interface LeaderboardUser {
  rank: number;
  userId: number;
  name: string;
  wordsLearned: number;
  testsAttempted: number;
  averageScore: number;
}

const TOKEN_KEY = "ssc_vocab_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`/api${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMsg = "An error occurred";
    try {
      const errData = await res.json();
      errMsg = errData.error || errData.message || errMsg;
    } catch {
      errMsg = `Request failed: ${res.statusText}`;
    }
    throw new Error(errMsg);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  register: (data: { name: string; email: string; password: string }) =>
    request<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMe: () => request<User>("/auth/me"),

  // Vocabulary
  getAlphabetCounts: () => request<Array<{ letter: string; count: number }>>("/vocabulary/browse/alphabet"),
  getTopicCounts: () =>
    request<Array<{ name: string; slug: string; count: number; description: string }>>("/vocabulary/browse/topics"),
  getRandomWords: (count = 5, category?: string) =>
    request<VocabItem[]>(`/vocabulary/random?count=${count}${category ? `&category=${category}` : ""}`),
  listVocabulary: (params: { category?: string; alphabet?: string; difficulty?: string; search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params.category) q.set("category", params.category);
    if (params.alphabet) q.set("alphabet", params.alphabet);
    if (params.difficulty) q.set("difficulty", params.difficulty);
    if (params.search) q.set("search", params.search);
    if (params.page) q.set("page", String(params.page));
    if (params.limit) q.set("limit", String(params.limit));
    return request<{ items: VocabItem[]; total: number; page: number; limit: number; totalPages: number }>(`/vocabulary?${q.toString()}`);
  },
  getVocabularyItem: (id: number) => request<VocabItem>(`/vocabulary/${id}`),

  // Tests
  createTest: (config: { categories?: string[]; alphabets?: string[]; difficulty?: string; totalQuestions: number; timeDurationMinutes: number }) =>
    request<Test>("/tests", {
      method: "POST",
      body: JSON.stringify(config),
    }),
  getTest: (id: number) => request<Test>(`/tests/${id}`),
  submitTest: (id: number, data: { answers: Record<string, string>; timeTakenSeconds: number }) =>
    request<Test>(`/tests/${id}/submit`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getTestResult: (id: number) =>
    request<{ test: Test; summary: any }>(`/tests/${id}/result`),
  getTestHistory: () => request<any[]>("/tests/history"),

  // Progress
  getProgress: () => request<ProgressSummary>("/progress"),
  getWeakWords: () => request<VocabItem[]>("/progress/weak-words"),
  getWordProgress: (wordId: number) => request<any>(`/progress/words/${wordId}`),
  updateWordProgress: (wordId: number, status: string) =>
    request<any>(`/progress/words/${wordId}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  // Revision
  getRevisionWords: (count = 10) => request<{ words: VocabItem[]; totalDue: number }>(`/revision?count=${count}`),
  completeRevision: (results: Array<{ wordId: number; remembered: boolean }>) =>
    request<{ success: boolean; message: string }>("/revision/complete", {
      method: "POST",
      body: JSON.stringify({ results }),
    }),

  // Stats
  getDashboardStats: () => request<DashboardStats>("/stats/dashboard"),
  getLeaderboard: () => request<LeaderboardUser[]>("/stats/leaderboard"),
  getCategoryBreakdown: () => request<Array<{ category: string; count: number }>>("/stats/category-breakdown"),

  // Admin
  adminLogin: (password: string) =>
    request<{ token: string; user: User }>("/admin/auth", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
  getAdminStats: () => request<any>("/admin/stats"),
  getAdminUsers: () => request<{ items: User[]; total: number }>("/admin/users"),
  deleteUser: (id: number) => request<any>(`/admin/users/${id}`, { method: "DELETE" }),
  createVocabItem: (data: Partial<VocabItem>) =>
    request<VocabItem>("/vocabulary", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateVocabItem: (id: number, data: Partial<VocabItem>) =>
    request<VocabItem>(`/vocabulary/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteVocabItem: (id: number) =>
    request<{ success: boolean; message: string }>(`/vocabulary/${id}`, { method: "DELETE" }),
  bulkImportVocab: (items: any[]) =>
    request<any>("/admin/vocabulary/bulk", {
      method: "POST",
      body: JSON.stringify({ items }),
    }),
};
