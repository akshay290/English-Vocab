import { useListVocabulary } from '@workspace/api-client-react';
import { VocabCard } from '@/components/VocabCard';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function AlphabetBrowser({ params }: { params: { letter: string } }) {
  const letter = params.letter.toUpperCase();
  
  const { data, isLoading } = useListVocabulary({
    alphabet: letter,
    limit: 100, // Just fetch a bunch for now
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4 -ml-4 text-muted-foreground hover:text-foreground">
          <Link href="/vocabulary"><ArrowLeft className="h-4 w-4 mr-2"/> Back to Browser</Link>
        </Button>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-primary text-primary-foreground text-3xl font-black rounded-2xl flex items-center justify-center shadow-lg">
            {letter}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Words starting with {letter}</h1>
            <p className="text-muted-foreground mt-1">
              {data ? `${data.total} words found` : 'Loading...'}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-muted/50 animate-pulse"></div>
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-24 bg-muted/20 rounded-2xl border border-dashed">
          <h3 className="text-xl font-semibold mb-2">No words found for {letter}</h3>
          <p className="text-muted-foreground">Try another letter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data?.items.map(word => (
            <VocabCard key={word.id} word={word} />
          ))}
        </div>
      )}
    </div>
  );
}
