import { useEffect, useState } from 'react';
import { getGetWordProgressQueryKey, useGetUserProgress, useGetWordProgress } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { BookOpenCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { VocabCard } from '@/components/VocabCard';

const PAGE_SIZE = 24;

export default function StrongWords() {
  const [page, setPage] = useState(1);
  const { data: progress } = useGetUserProgress();
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGetWordProgress(
    { status: 'learned', page, limit: PAGE_SIZE },
    {
      query: {
        queryKey: getGetWordProgressQueryKey({ status: 'learned', page, limit: PAGE_SIZE }),
        refetchOnMount: 'always',
      },
    },
  );

  const totalPages = Math.max(1, data?.totalPages ?? 1);

  useEffect(() => {
    if (data && page > totalPages) setPage(totalPages);
  }, [data, page, totalPages]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <BookOpenCheck className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Learned / Strong Words</h1>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            Words with learned status, including words you marked yourself. The Words Mastered count measures words answered correctly at least twice in tests, so these totals can differ.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/progress">View Progress</Link>
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Learned / Strong Words</p>
            <p className="text-3xl font-bold mt-1">{data?.total ?? (isLoading ? '…' : '—')}</p>
            <p className="text-xs text-muted-foreground mt-1">Current learned status</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Words Mastered</p>
            <p className="text-3xl font-bold mt-1">{progress?.wordsLearned ?? '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">Correct at least twice in tests</p>
          </CardContent>
        </Card>
      </div>

      {isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <h2 className="text-lg font-semibold">Could not load your learned words</h2>
          <p className="text-sm text-muted-foreground mt-1">Please check your connection and try again.</p>
          <Button className="mt-4" onClick={() => void refetch()}>Try again</Button>
        </div>
      ) : isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="h-72 rounded-xl" />)}
        </div>
      ) : data?.total === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center">
          <h2 className="text-xl font-semibold">No learned words yet</h2>
          <p className="text-muted-foreground mt-2">Open a word and mark it as learned, or build your knowledge through tests and revision.</p>
          <Button className="mt-5" asChild><Link href="/vocabulary">Browse Vocabulary</Link></Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Your learned list</h2>
            <p className="text-sm text-muted-foreground">{data?.total ?? 0} words</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data?.items.map((item) => item.vocabItem ? (
              <VocabCard key={item.id} word={item.vocabItem} />
            ) : null)}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 pt-4">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                Previous
              </Button>
              <span className="text-sm font-medium">Page {page} of {totalPages}</span>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
