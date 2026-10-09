import React, { useState, useEffect } from "react";
import { api, type VocabItem, type User } from "../lib/api";
import { useAuth } from "../lib/auth";
import {
  Shield,
  Plus,
  Trash2,
  Users,
  Database,
  BarChart2,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";

export function Admin() {
  const { user, adminLogin } = useAuth();
  const [isAdmin, setIsAdmin] = useState(user?.role === "admin");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"stats" | "vocab" | "users" | "bulk">("stats");
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [loading, setLoading] = useState(false);

  // New Word Form State
  const [newWord, setNewWord] = useState({
    word: "",
    meaning: "",
    hindiMeaning: "",
    exampleSentence: "",
    synonyms: "",
    antonyms: "",
    category: "synonyms",
    difficulty: "medium",
  });
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  // Bulk import state
  const [bulkJson, setBulkJson] = useState("");
  const [bulkStatus, setBulkStatus] = useState<string | null>(null);

  useEffect(() => {
    setIsAdmin(user?.role === "admin");
    if (user?.role === "admin") {
      loadAdminData();
    }
  }, [user]);

  async function loadAdminData() {
    setLoading(true);
    try {
      const [sData, uData, vData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.listVocabulary({ limit: 50 }),
      ]);
      setStats(sData);
      setUsers(uData.items);
      setVocabList(vData.items);
    } catch (err) {
      console.error("Failed to load admin dashboard", err);
    } finally {
      setLoading(false);
    }
  }

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      await adminLogin(password);
      setIsAdmin(true);
      loadAdminData();
    } catch (err: any) {
      setLoginError(err.message || "Invalid admin password");
    }
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createVocabItem({
        word: newWord.word,
        meaning: newWord.meaning,
        hindiMeaning: newWord.hindiMeaning || null,
        exampleSentence: newWord.exampleSentence || null,
        synonyms: newWord.synonyms ? newWord.synonyms.split(",").map((s) => s.trim()) : [],
        antonyms: newWord.antonyms ? newWord.antonyms.split(",").map((s) => s.trim()) : [],
        category: newWord.category,
        difficulty: newWord.difficulty as any,
        alphabet: newWord.word[0].toLowerCase(),
      });
      setAddSuccess(`Word "${newWord.word}" added successfully!`);
      setNewWord({
        word: "",
        meaning: "",
        hindiMeaning: "",
        exampleSentence: "",
        synonyms: "",
        antonyms: "",
        category: "synonyms",
        difficulty: "medium",
      });
      loadAdminData();
      setTimeout(() => setAddSuccess(null), 3000);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteWord = async (id: number) => {
    if (!confirm("Are you sure you want to delete this vocabulary item?")) return;
    try {
      await api.deleteVocabItem(id);
      loadAdminData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleBulkImport = async () => {
    try {
      const parsed = JSON.parse(bulkJson);
      const items = Array.isArray(parsed) ? parsed : parsed.entries || [];
      const res = await api.bulkImportVocab(items);
      setBulkStatus(`Successfully imported ${res.created} words!`);
      loadAdminData();
    } catch (err: any) {
      setBulkStatus(`Import error: ${err.message}`);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-card border shadow-xl space-y-6">
        <div className="w-12 h-12 rounded-2xl mx-auto bg-primary/10 text-primary flex items-center justify-center font-bold">
          <Shield className="w-6 h-6" />
        </div>

        <div className="text-center">
          <h2 className="text-xl font-black text-foreground">Admin Portal Access</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Please enter your administrator credentials to manage platform datasets.
          </p>
        </div>

        {loginError && (
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleAdminAuth} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">
              Admin Master Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="password"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <span className="text-[11px] text-muted-foreground mt-1 block">
              Default password: <code className="bg-muted px-1.5 py-0.5 rounded">sscvocab@admin2024</code>
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary/90"
          >
            Authenticate as Admin
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-card border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground">Administrator Console</h1>
            <p className="text-xs text-muted-foreground">Manage vocabulary records, users, and imports</p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex gap-1.5 p-1 rounded-xl bg-muted border">
          <button
            type="button"
            onClick={() => setActiveTab("stats")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === "stats" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("vocab")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === "vocab" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            Add Word
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === "users" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            Users ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bulk")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === "bulk" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            Bulk Import
          </button>
        </div>
      </div>

      {/* Tab: Overview Stats */}
      {activeTab === "stats" && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-card border shadow-sm">
              <span className="text-[11px] font-bold uppercase text-muted-foreground">Total Vocabulary</span>
              <p className="text-2xl font-black text-foreground mt-1">{stats.totalVocabulary}</p>
            </div>
            <div className="p-4 rounded-xl bg-card border shadow-sm">
              <span className="text-[11px] font-bold uppercase text-muted-foreground">Total Tests Run</span>
              <p className="text-2xl font-black text-foreground mt-1">{stats.totalTests}</p>
            </div>
            <div className="p-4 rounded-xl bg-card border shadow-sm">
              <span className="text-[11px] font-bold uppercase text-muted-foreground">Active Learners</span>
              <p className="text-2xl font-black text-foreground mt-1">{stats.activeUsers}</p>
            </div>
            <div className="p-4 rounded-xl bg-card border shadow-sm">
              <span className="text-[11px] font-bold uppercase text-muted-foreground">Categories</span>
              <p className="text-2xl font-black text-foreground mt-1">{stats.categoryBreakdown?.length || 9}</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card border shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4">Vocabulary Items by Category</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {stats.categoryBreakdown?.map((cat: any) => (
                <div key={cat.category} className="p-3 rounded-lg bg-muted/40 border flex justify-between items-center text-xs">
                  <span className="font-semibold capitalize text-foreground">{cat.category.replace(/_/g, " ")}</span>
                  <span className="font-bold text-primary">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Add Word */}
      {activeTab === "vocab" && (
        <div className="p-6 rounded-2xl bg-card border shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" /> Add New Vocabulary Entry
            </h2>
          </div>

          {addSuccess && (
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{addSuccess}</span>
            </div>
          )}

          <form onSubmit={handleAddWord} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">
                  Word / Idiom *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Magnanimous"
                  value={newWord.word}
                  onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">
                  Category *
                </label>
                <select
                  value={newWord.category}
                  onChange={(e) => setNewWord({ ...newWord, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="synonyms">Synonyms</option>
                  <option value="antonyms">Antonyms</option>
                  <option value="one_word_substitution">One Word Substitution</option>
                  <option value="idioms_phrases">Idioms & Phrases</option>
                  <option value="phrasal_verbs">Phrasal Verbs</option>
                  <option value="root_words">Root Words</option>
                  <option value="confusing_words">Confusing Words</option>
                  <option value="spellings">Spellings</option>
                  <option value="important_vocabulary">Important Vocab</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">
                English Meaning / Definition *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Generous or forgiving, especially toward a rival..."
                value={newWord.meaning}
                onChange={(e) => setNewWord({ ...newWord, meaning: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">
                  Hindi Meaning (हिन्दी अर्थ)
                </label>
                <input
                  type="text"
                  placeholder="उदा. उदार, क्षमाशील"
                  value={newWord.hindiMeaning}
                  onChange={(e) => setNewWord({ ...newWord, hindiMeaning: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">
                  Difficulty Level
                </label>
                <select
                  value={newWord.difficulty}
                  onChange={(e) => setNewWord({ ...newWord, difficulty: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="easy">Easy (Tier-1)</option>
                  <option value="medium">Medium (Moderate)</option>
                  <option value="hard">Hard (Tier-2)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">
                  Synonyms (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Generous, Altruistic, Noble"
                  value={newWord.synonyms}
                  onChange={(e) => setNewWord({ ...newWord, synonyms: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">
                  Antonyms (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Petty, Mean, Vengeful"
                  value={newWord.antonyms}
                  onChange={(e) => setNewWord({ ...newWord, antonyms: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">
                Example Sentence
              </label>
              <input
                type="text"
                placeholder="He was magnanimous in victory and shook hands with his opponent."
                value={newWord.exampleSentence}
                onChange={(e) => setNewWord({ ...newWord, exampleSentence: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary/90"
            >
              Save Vocabulary Item
            </button>
          </form>
        </div>
      )}

      {/* Tab: Users */}
      {activeTab === "users" && (
        <div className="p-6 rounded-2xl bg-card border shadow-sm space-y-4">
          <h2 className="text-base font-bold text-foreground">Registered Student Accounts</h2>
          <div className="divide-y border rounded-xl overflow-hidden">
            {users.map((u) => (
              <div key={u.id} className="p-3.5 flex items-center justify-between bg-card text-xs">
                <div>
                  <span className="font-bold text-foreground">{u.name}</span>
                  <span className="text-muted-foreground block">{u.email}</span>
                </div>
                <span className="px-2 py-0.5 rounded font-semibold uppercase text-[10px] bg-muted">
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Bulk Import */}
      {activeTab === "bulk" && (
        <div className="p-6 rounded-2xl bg-card border shadow-sm space-y-4">
          <h2 className="text-base font-bold text-foreground">Bulk JSON Vocabulary Import</h2>
          <p className="text-xs text-muted-foreground">
            Paste a JSON array of vocabulary items containing <code className="bg-muted px-1">word</code>, <code className="bg-muted px-1">meaning</code>, <code className="bg-muted px-1">hindiMeaning</code>, <code className="bg-muted px-1">category</code>.
          </p>

          {bulkStatus && (
            <div className="p-3 rounded-xl bg-muted text-xs font-semibold">
              {bulkStatus}
            </div>
          )}

          <textarea
            rows={8}
            placeholder={`[\n  {\n    "word": "Diligent",\n    "meaning": "Hardworking",\n    "hindiMeaning": "मेहनती",\n    "category": "synonyms"\n  }\n]`}
            value={bulkJson}
            onChange={(e) => setBulkJson(e.target.value)}
            className="w-full p-3 rounded-xl border font-mono text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <button
            type="button"
            onClick={handleBulkImport}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary/90"
          >
            Execute Bulk Import
          </button>
        </div>
      )}
    </div>
  );
}
