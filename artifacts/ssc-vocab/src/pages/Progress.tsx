import { useGetUserProgress } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BrainCircuit, BookA, Activity, Target, Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCategory, getCategoryColor } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function ProgressPage() {
  const { data: progress, isLoading } = useGetUserProgress();

  if (isLoading || !progress) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Overall mastery = words answered correctly at least once / words attempted
  const wordsAttempted = (progress as any).wordsAttempted ?? 0;
  const wordsCorrectOnce = (progress as any).wordsCorrectOnce ?? 0;
  const overallProgress = wordsAttempted > 0
    ? Math.round((wordsCorrectOnce / wordsAttempted) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your Progress</h1>
        <p className="text-muted-foreground mt-1">Track your vocabulary mastery journey</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center">
                <BookA className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold">{progress.wordsLearned}</h3>
              <p className="text-sm text-muted-foreground font-medium">Words Mastered</p>
              <p className="text-xs text-muted-foreground">answered correctly 2+ times in tests</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold">{Number(progress.averageScore ?? 0).toFixed(2)}%</h3>
              <p className="text-sm text-muted-foreground font-medium">Avg. Accuracy</p>
              <p className="text-xs text-muted-foreground">total correct ÷ total questions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                <BrainCircuit className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold">{progress.wordsInProgress}</h3>
              <p className="text-sm text-muted-foreground font-medium">In Progress</p>
              <p className="text-xs text-muted-foreground">seen in tests, not yet mastered</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold">{progress.testsAttempted}</h3>
              <p className="text-sm text-muted-foreground font-medium">Tests Taken</p>
              <p className="text-xs text-muted-foreground">completed tests only</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="border-primary/20 shadow-md">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" /> Overall Mastery
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 flex flex-col items-center justify-center text-center">
            <div className="relative w-48 h-48 flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
                <circle 
                  cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" 
                  className="text-primary" 
                  strokeDasharray={`${overallProgress * 2.827} 282.7`} 
                  strokeLinecap="round" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black">{overallProgress}%</span>
              </div>
            </div>
            <p className="text-muted-foreground font-medium">
              {wordsAttempted === 0
                ? "Take a test to start tracking your mastery."
                : `You answered ${wordsCorrectOnce} out of ${wordsAttempted} attempted words correctly.`}
            </p>
            {wordsAttempted > 0 && (
              <div className="mt-4 text-xs text-muted-foreground space-y-1 text-left w-full max-w-xs border rounded-lg p-3 bg-muted/20">
                <p className="font-semibold text-foreground mb-2">How this is calculated</p>
                <p>• <strong>Overall Mastery %</strong> = words you got right (at least once) ÷ total words attempted in tests</p>
                <p>• <strong>Words Mastered</strong> = words you answered correctly <em>2 or more times</em> across all tests</p>
                <p>• <strong>In Progress</strong> = words you've seen in tests but haven't mastered yet (less than 2 correct answers)</p>
                <p>• <strong>Avg. Accuracy</strong> = total correct answers ÷ total questions across all tests</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-lg">Category Breakdown</CardTitle>
            <CardDescription>Your progress across different topics</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {progress.categoryProgress?.map((cat) => {
                const percent = cat.total > 0 ? Math.round((cat.learned / cat.total) * 100) : 0;
                return (
                  <div key={cat.category} className="p-4 space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`border ${getCategoryColor(cat.category)}`}>
                          {formatCategory(cat.category)}
                        </Badge>
                      </div>
                      <span className="text-sm font-bold">{percent}%</span>
                    </div>
                    <Progress value={percent} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">
                      {cat.learned} / {cat.total} words
                    </p>
                  </div>
                );
              })}
              {(!progress.categoryProgress || progress.categoryProgress.length === 0) && (
                <div className="p-8 text-center text-muted-foreground">
                  No category data available yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
