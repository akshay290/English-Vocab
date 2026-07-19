import { useState } from 'react';
import { useListVocabulary, useBrowseTopics } from '@workspace/api-client-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VocabCard } from '@/components/VocabCard';
import { Search, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from 'wouter';
import { formatCategory, DIFFICULTY_LABELS } from '@/lib/utils';

export default function VocabularyBrowser() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [, setLocation] = useLocation();

  const { data: topics } = useBrowseTopics();
  
  // Debounce search
  useState(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  });

  const { data, isLoading } = useListVocabulary({
    page,
    limit: 24,
    search: debouncedSearch || undefined,
    category: category !== 'all' ? category : undefined,
    difficulty: difficulty !== 'all' ? difficulty : undefined,
  });

  const alphabets = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(search);
    setPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vocabulary Browser</h1>
          <p className="text-muted-foreground mt-1">Explore words, meanings, and examples</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        <div className="md:col-span-12">
          {/* Alphabet Row */}
          <div className="flex flex-wrap gap-1 mb-6 p-4 bg-muted/30 rounded-xl justify-center">
            {alphabets.map(letter => (
              <Button
                key={letter}
                variant="ghost"
                className="h-8 w-8 p-0 text-sm font-medium rounded-md hover:bg-primary/20 hover:text-primary"
                onClick={() => setLocation(`/vocabulary/alphabet/${letter}`)}
              >
                {letter}
              </Button>
            ))}
          </div>
        </div>

        <div className="md:col-span-12 flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search words, meanings..." 
              className="pl-10 h-12 bg-background border-primary/20 focus-visible:ring-primary/30 text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
            <SelectTrigger className="w-full md:w-[220px] h-12">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {topics?.map(t => (
                <SelectItem key={t.slug} value={t.slug}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={difficulty} onValueChange={(v) => { setDifficulty(v); setPage(1); }}>
            <SelectTrigger className="w-full md:w-[180px] h-12">
              <SelectValue placeholder="All Difficulties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-muted/50 animate-pulse"></div>
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-24 bg-muted/20 rounded-2xl border border-dashed">
          <h3 className="text-xl font-semibold mb-2">No words found</h3>
          <p className="text-muted-foreground mb-6">Try adjusting your filters or search query.</p>
          <Button variant="outline" onClick={() => { setSearch(''); setDebouncedSearch(''); setCategory('all'); setDifficulty('all'); }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data?.items.map(word => (
              <VocabCard key={word.id} word={word} />
            ))}
          </div>
          
          {data && data.totalPages > 1 && (
            <div className="flex justify-center items-center mt-12 gap-2">
              <Button 
                variant="outline" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm font-medium px-4">
                Page {page} of {data.totalPages}
              </span>
              <Button 
                variant="outline" 
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
