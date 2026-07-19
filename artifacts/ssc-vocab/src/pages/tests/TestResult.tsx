import { useGetTestResult } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { CheckCircle2, XCircle, Clock, Target, ArrowRight, RotateCcw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function TestResult({ params }: { params: { id: string } }) {
  const testId = parseInt(params.id);
  const { data: result, isLoading } = useGetTestResult(testId, {
    query: {
      enabled: !!testId,
      queryKey: ['testResult', testId]
    }
  });

  if (isLoading || !result) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-8 w-64 mt-8" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)}
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const correctCount = result.questions.filter(q => q.isCorrect).length;
  const incorrectCount = result.questions.filter(q => q.isCorrect === false).length;
  const skippedCount = result.questions.filter(q => q.userAnswer === null).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Test Results</h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>

      <Card className="border-none shadow-xl bg-gradient-to-br from-card to-primary/5 relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${result.percentage >= 80 ? 'from-secondary to-emerald-400' : result.percentage >= 50 ? 'from-accent to-amber-300' : 'from-destructive to-red-400'}`} />
        <CardContent className="p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-left flex flex-col items-center md:items-start">
              <p className="text-muted-foreground font-medium mb-2 uppercase tracking-widest text-sm">Your Score</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-6xl md:text-8xl font-black ${result.percentage >= 80 ? 'text-secondary' : result.percentage >= 50 ? 'text-accent' : 'text-destructive'}`}>
                  {result.percentage}%
                </span>
              </div>
              <p className="mt-4 text-lg font-medium">
                {result.percentage >= 80 ? 'Outstanding performance! Keep it up.' : 
                 result.percentage >= 50 ? 'Good effort, but room for improvement.' : 
                 'Don\'t worry, keep practicing. You\'ll get better!'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background p-4 rounded-xl shadow-sm border flex flex-col items-center justify-center text-center">
                <Target className="h-6 w-6 text-primary mb-2" />
                <span className="text-2xl font-bold">{result.totalQuestions}</span>
                <span className="text-xs text-muted-foreground uppercase font-semibold">Total</span>
              </div>
              <div className="bg-background p-4 rounded-xl shadow-sm border flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="h-6 w-6 text-secondary mb-2" />
                <span className="text-2xl font-bold">{correctCount}</span>
                <span className="text-xs text-muted-foreground uppercase font-semibold">Correct</span>
              </div>
              <div className="bg-background p-4 rounded-xl shadow-sm border flex flex-col items-center justify-center text-center">
                <XCircle className="h-6 w-6 text-destructive mb-2" />
                <span className="text-2xl font-bold">{incorrectCount}</span>
                <span className="text-xs text-muted-foreground uppercase font-semibold">Incorrect</span>
              </div>
              <div className="bg-background p-4 rounded-xl shadow-sm border flex flex-col items-center justify-center text-center">
                <Clock className="h-6 w-6 text-muted-foreground mb-2" />
                <span className="text-2xl font-bold">{formatTime(result.timeTakenSeconds)}</span>
                <span className="text-xs text-muted-foreground uppercase font-semibold">Time</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-background/50 border-t p-6 flex justify-center gap-4">
          <Button asChild variant="outline" className="min-w-40 font-semibold h-11">
            <Link href="/tests"><RotateCcw className="mr-2 h-4 w-4"/> New Test</Link>
          </Button>
          <Button asChild className="min-w-40 font-semibold h-11">
            <Link href="/revision">Smart Revision <ArrowRight className="ml-2 h-4 w-4"/></Link>
          </Button>
        </CardFooter>
      </Card>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          Detailed Breakdown
          {skippedCount > 0 && <Badge variant="secondary">{skippedCount} Skipped</Badge>}
        </h2>

        <div className="space-y-4">
          {result.questions.map((q, idx) => {
            const isCorrect = q.isCorrect === true;
            const isSkipped = q.userAnswer === null;
            const isWrong = q.isCorrect === false;

            return (
              <Card key={q.id} className={`overflow-hidden border-l-4 ${isCorrect ? 'border-l-secondary' : isSkipped ? 'border-l-muted-foreground' : 'border-l-destructive'}`}>
                <CardHeader className="pb-3 bg-muted/20">
                  <div className="flex gap-3">
                    <span className="font-bold text-muted-foreground w-6 shrink-0">{idx + 1}.</span>
                    <CardTitle className="text-lg leading-snug">{q.questionText}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 pb-6 px-6 sm:pl-16">
                  <div className="space-y-3">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = q.userAnswer === optIdx;
                      const isActualCorrect = q.correctAnswer === optIdx;
                      
                      let optionClass = "border p-3 rounded-lg flex items-center justify-between transition-colors";
                      let Icon = null;

                      if (isActualCorrect) {
                        optionClass += " bg-secondary/10 border-secondary/30 text-secondary-foreground font-medium";
                        Icon = <CheckCircle2 className="h-5 w-5 text-secondary" />;
                      } else if (isSelected && isWrong) {
                        optionClass += " bg-destructive/10 border-destructive/30 text-destructive font-medium";
                        Icon = <XCircle className="h-5 w-5 text-destructive" />;
                      }

                      return (
                        <div key={optIdx} className={optionClass}>
                          <span>{opt}</span>
                          {Icon}
                        </div>
                      );
                    })}
                  </div>
                  
                  {isWrong && q.vocabItem && (
                    <div className="mt-4 p-4 bg-muted/40 rounded-lg border border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Weak Word Detected</span>
                        <p className="font-medium">{q.vocabItem.word} - <span className="text-muted-foreground font-normal">{q.vocabItem.meaning}</span></p>
                      </div>
                      <Button size="sm" variant="outline" asChild className="shrink-0">
                        <Link href={`/vocabulary/${q.vocabItem.id}`}>Study Word</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
