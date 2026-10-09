import React, { useState, useEffect } from "react";
import { api, type VocabItem } from "../lib/api";
import { AudioButton } from "../components/AudioPlayer";
import {
  Search,
  Image as ImageIcon,
  BookOpen,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Maximize2,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export function Collections() {
  const [items, setItems] = useState<VocabItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [alphabet, setAlphabet] = useState("");
  const [showHindi, setShowHindi] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const limit = 24;

  useEffect(() => {
    async function fetchIdioms() {
      setLoading(true);
      try {
        const data = await api.listVocabulary({
          category: "idioms_phrases",
          search: search || undefined,
          alphabet: alphabet || undefined,
          page,
          limit,
        });
        setItems(data.items);
        setTotal(data.total);
      } catch (err) {
        console.error("Failed to load illustrated idioms", err);
      } finally {
        setLoading(false);
      }
    }
    fetchIdioms();
  }, [page, search, alphabet]);

  const totalPages = Math.ceil(total / limit) || 1;

  const alphabetList = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-orange-800 text-white p-6 sm:p-8 shadow-lg">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>Illustrated 2027 Edition Collection</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            1,281 Illustrated Idioms & Phrases
          </h1>
          <p className="mt-2 text-sm text-amber-100/90 leading-relaxed">
            High-definition visual crops from authentic SSC preparation cards. Visual memory aids dramatically accelerate long-term retention of nuanced English idioms.
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-xl bg-card border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search idioms, Hindi meanings, or English definitions..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              type="button"
              onClick={() => setShowHindi(!showHindi)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                showHindi ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground"
              }`}
            >
              {showHindi ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showHindi ? "Hindi Meanings On" : "Hindi Hidden"}</span>
            </button>

            <span className="text-xs text-muted-foreground font-medium">
              Found <strong className="text-foreground">{total}</strong> idioms
            </span>
          </div>
        </div>

        {/* Alphabet Filter Pills */}
        <div className="flex flex-wrap gap-1 pt-2 border-t">
          <button
            type="button"
            onClick={() => {
              setAlphabet("");
              setPage(1);
            }}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
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
              className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
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

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border">
          <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="font-bold text-base text-foreground">No idioms matched your search</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search keywords or clear the alphabet filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col justify-between rounded-xl bg-card border shadow-sm hover:shadow-md hover:border-primary/40 transition-all overflow-hidden"
            >
              {/* Illustrated Image Preview if available */}
              {item.imageUrl && (
                <div
                  className="relative h-36 w-full bg-slate-950 overflow-hidden cursor-pointer"
                  onClick={() => setSelectedImage(item.imageUrl)}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.word}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <div className="absolute top-2 right-2 p-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">
                      {item.word}
                    </h3>
                    <AudioButton text={item.word} />
                  </div>

                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {item.meaning}
                  </p>
                </div>

                {/* Hindi Meaning Badge */}
                {showHindi && item.hindiMeaning && (
                  <div className="mt-2 pt-2 border-t">
                    <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-1 rounded inline-block">
                      🇮🇳 {item.hindiMeaning}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
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

      {/* Image Modal Preview */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-card rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Full card preview"
              className="max-h-[80vh] w-auto mx-auto object-contain rounded-xl"
            />
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="px-4 py-1.5 bg-muted rounded-lg text-xs font-semibold text-foreground hover:bg-muted/80"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
