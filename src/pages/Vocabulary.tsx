import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { api, type VocabItem } from "../lib/api";
import { AudioButton } from "../components/AudioPlayer";
import {
  Search,
  Filter,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Volume2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Tag,
} from "lucide-react";

export function Vocabulary() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialCategory = searchParams.get("category") || "";

  const [category, setCategory] = useState(initialCategory);
  const [alphabet, setAlphabet] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<VocabItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState<VocabItem | null>(null);

  const limit = 20;

  const categories = [
    { slug: "", label: "All Categories" },
    { slug: "synonyms", label: "Synonyms" },
    { slug: "antonyms", label: "Antonyms" },
    { slug: "one_word_substitution", label: "One-Word Substitution" },
    { slug: "idioms_phrases", label: "Idioms & Phrases" },
    { slug: "phrasal_verbs", label: "Phrasal Verbs" },
    { slug: "root_words", label: "Root Words" },
    { slug: "confusing_words", label: "Confusing Words" },
    { slug: "spellings", label: "Spellings" },
    { slug: "important_vocabulary", label: "Important Vocab" },
  ];

  const alphabetList = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await api.listVocabulary({
          category: category || undefined,
          alphabet: alphabet || undefined,
          difficulty: difficulty || undefined,
          search: search || undefined,
          page,
          limit,
        });
        setItems(data.items);
        setTotal(data.total);
      } catch (err) {
        console.error("Failed to load vocabulary items", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [category, alphabet, difficulty, search, page]);

  const totalPages = Math.ceil(total / limit) || 1;

  const handleUpdateStatus = async (wordId: number, status: string) => {
    try {
      await api.updateWordProgress(wordId, status);
      // Optional toast or feedback
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" /> SSC Vocabulary Archive
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse examination vocabulary with Hindi explanations, example sentences, synonyms, and roots.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 self-start sm:self-auto">
          {total} Total Words Available
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search words, meanings, or Hindi translations..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Difficulty Dropdown */}
          <div>
            <select
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy (Tier-1)</option>
              <option value="medium">Medium (Moderate)</option>
              <option value="hard">Hard (Tier-2 Advanced)</option>
            </select>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => {
                setCategory(cat.slug);
                setPage(1);
              }}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                category === cat.slug
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Alphabet Bar */}
        <div className="flex flex-wrap gap-1 pt-2 border-t">
          <button
            type="button"
            onClick={() => {
              setAlphabet("");
              setPage(1);
            }}
            className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
              alphabet === ""
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All A-Z
          </button>
          {alphabetList.map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => {
                setAlphabet(letter);
                setPage(1);
              }}
              className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
                alphabet.toUpperCase() === letter
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Vocabulary List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="font-bold text-base text-foreground">No vocabulary items match your filters</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Try clearing the search query or selecting "All Categories".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedWord(item)}
              className="p-5 rounded-xl bg-card border shadow-sm hover:shadow-md hover:border-primary/40 cursor-pointer transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-foreground">{item.word}</h3>
                    <AudioButton text={item.word} />
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      item.difficulty === "easy"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : item.difficulty === "hard"
                        ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                    }`}
                  >
                    {item.difficulty}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {item.meaning}
                </p>

                {item.hindiMeaning && (
                  <div className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                    🇮🇳 {item.hindiMeaning}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="capitalize">{item.category.replace(/_/g, " ")}</span>
                {item.examRefs.length > 0 && (
                  <span className="font-semibold text-primary/80 truncate max-w-[150px]">
                    {item.examRefs[0]}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-card border">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <span className="text-xs font-medium text-muted-foreground">
            Page <strong className="text-foreground">{page}</strong> of{" "}
            <strong className="text-foreground">{totalPages}</strong>
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Word Detail Modal */}
      {selectedWord && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedWord(null)}
        >
          <div
            className="relative max-w-lg w-full bg-card rounded-2xl border shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-foreground">{selectedWord.word}</h2>
                  <AudioButton text={selectedWord.word} />
                </div>
                <span className="text-xs text-muted-foreground capitalize">
                  {selectedWord.category.replace(/_/g, " ")} • {selectedWord.difficulty}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWord(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                  English Definition
                </label>
                <p className="text-sm font-medium text-foreground mt-0.5">
                  {selectedWord.meaning}
                </p>
              </div>

              {selectedWord.hindiMeaning && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                  <label className="text-[11px] font-bold uppercase text-amber-800 dark:text-amber-300">
                    Hindi Meaning (हिन्दी अर्थ)
                  </label>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mt-0.5">
                    {selectedWord.hindiMeaning}
                  </p>
                </div>
              )}

              {selectedWord.exampleSentence && (
                <div>
                  <label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                    Example Sentence
                  </label>
                  <p className="text-xs italic text-foreground/90 mt-0.5 bg-muted/40 p-2.5 rounded-lg border">
                    "{selectedWord.exampleSentence}"
                  </p>
                </div>
              )}

              {selectedWord.synonyms.length > 0 && (
                <div>
                  <label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                    Synonyms
                  </label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedWord.synonyms.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedWord.antonyms.length > 0 && (
                <div>
                  <label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                    Antonyms
                  </label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedWord.antonyms.map((a, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-xs bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-medium"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedWord.examRefs.length > 0 && (
                <div>
                  <label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                    Exam Reference
                  </label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedWord.examRefs.map((ref, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[11px] bg-primary/10 text-primary font-semibold"
                      >
                        {ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  handleUpdateStatus(selectedWord.id, "weak");
                  setSelectedWord(null);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 hover:opacity-90"
              >
                <AlertCircle className="w-3.5 h-3.5" /> Mark Weak
              </button>
              <button
                type="button"
                onClick={() => {
                  handleUpdateStatus(selectedWord.id, "learned");
                  setSelectedWord(null);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:opacity-90"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Mark Mastered
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
