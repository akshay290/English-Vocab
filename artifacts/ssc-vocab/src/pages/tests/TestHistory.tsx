import { useGetTestHistory } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ArrowRight, Clock, Target, Calendar, CheckCircle2, PlayCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function TestHistory() {
  const { data: history, isLoading } = useGetTestHistory({ limit: 50 });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <Skeleton className="h-10 w-48 mb-8" />
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test History</h1>
          <p className="text-muted-foreground mt-1">Review your past performance</p>
        </div>
        <Button asChild>
          <Link href="/tests">New Test</Link>
        </Button>
      </div>

      {!history || history.items.length === 0 ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="p-12 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No tests taken yet</h3>
            <p className="text-muted-foreground mb-6">Start taking tests to build your history and track progress.</p>
            <Button size="lg" asChild>
              <Link href="/tests">Take your first test</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.items.map(test => {
            const isCompleted = test.status === 'completed';
            const date = new Date(test.createdAt);
            
            return (
              <Card key={test.id} className="hover-elevate transition-all border-border/50 hover:border-primary/30">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center">
                    <div className="flex-1 p-6 w-full">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant={isCompleted ? "default" : "secondary"} className={isCompleted ? "bg-secondary text-secondary-foreground" : ""}>
                          {isCompleted ? 'Completed' : 'In Progress'}
                        </Badge>
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(date, 'MMM d, yyyy • h:mm a')}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-foreground/80">
                        <span className="flex items-center gap-1.5"><Target className="h-4 w-4" /> {test.totalQuestions} Questions</span>
                        {test.timeDurationMinutes && (
                          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {test.timeDurationMinutes} min limit</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-muted/30 p-6 border-t sm:border-t-0 sm:border-l border-border/50 flex items-center justify-between sm:justify-end gap-6 sm:w-64 w-full">
                      <div className="text-center sm:text-right">
                        {isCompleted ? (
                          <>
                            <div className="text-2xl font-black text-foreground">{(test as any).percentage ?? '—'}%</div>
                            <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Score</div>
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground font-medium italic">Pending</div>
                        )}
                      </div>
                      <Button variant={isCompleted ? "outline" : "default"} size="icon" className="h-10 w-10 rounded-full" asChild>
                        <Link href={isCompleted ? `/tests/${test.id}/result` : `/tests/${test.id}`}>
                          {isCompleted ? <ArrowRight className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
