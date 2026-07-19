import { useListVocabulary, useBrowseTopics } from '@workspace/api-client-react';
import { VocabCard } from '@/components/VocabCard';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { formatCategory, getCategoryColor } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function CategoryBrowser({ params }: { params: { category: string } }) {
  const category = params.category;
  
  const { data: topics } = useBrowseTopics();
  const topicInfo = topics?.find(t => t.slug === category);

  const { data, isLoading } = useListVocabulary({
    category: category,
    limit: 100, // Fetch first 100
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4 -ml-4 text-muted-foreground hover:text-foreground">
          <Link href="/vocabulary"><ArrowLeft className="h-4 w-4 mr-2"/> Back to Browser</Link>
        </Button>
        <div className="flex flex-col items-start gap-2">
          <Badge variant="outline" className={`mb-2 ${getCategoryColor(category)}`}>Category</Badge>
          <h1 className="text-3xl font-bold tracking-tight">{formatCategory(category)}</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            {topicInfo?.description || `Browse all vocabulary related to ${formatCategory(category)}.`}
          </p>
          <p className="text-sm font-medium bg-muted px-2 py-1 rounded-md mt-2">
            {data ? `${data.total} words` : 'Loading...'}
          </p>
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
          <h3 className="text-xl font-semibold mb-2">No words found in this category</h3>
          <p className="text-muted-foreground">Check back later for new additions.</p>
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
