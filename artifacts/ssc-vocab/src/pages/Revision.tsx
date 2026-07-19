import { useState } from 'react';
import { useGetRevisionWords, useCompleteRevision } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrainCircuit, CheckCircle2, RotateCcw, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { formatCategory, getDifficultyColor, DIFFICULTY_LABELS } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function Revision() {
  const { data: revisionData, isLoading, refetch } = useGetRevisionWords({ count: 10 }, {
    query: { refetchOnWindowFocus: false, queryKey: ['/api/revision'] }
  });
  const completeMutation = useCompleteRevision();
  const { toast } = useToast();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<{wordId: number, remembered: boolean}[]>([]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl flex flex-col items-center">
        <Skeleton className="h-10 w-48 mb-8" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  // No words to revise
  if (!revisionData || revisionData.words.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center space-y-6 bg-muted/20 p-12 rounded-3xl border border-dashed">
          <div className="h-20 w-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">You're all caught up!</h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            You have no words due for revision right now. Great job staying on top of your spaced repetition schedule.
          </p>
          <div className="pt-4 flex justify-center gap-4">
            <Button asChild variant="outline">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
            <Button asChild>
              <Link href="/vocabulary">Learn New Words</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Revision complete
  if (currentIndex >= revisionData.words.length) {
    const rememberedCount = results.filter(r => r.remembered).length;
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="border-none shadow-xl bg-gradient-to-br from-card to-primary/5 text-center">
          <CardContent className="p-12 space-y-6">
            <div className="h-24 w-24 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <BrainCircuit className="h-12 w-12" />
            </div>
            <h2 className="text-3xl font-bold">Revision Session Complete</h2>
            <p className="text-muted-foreground text-lg">
              You reviewed {revisionData.words.length} words and remembered {rememberedCount} of them.
            </p>
            <div className="pt-6 flex flex-col sm:flex-row justify-center gap-4">
              <Button onClick={() => refetch()} variant="outline" className="h-12 px-8">
                <RotateCcw className="mr-2 h-4 w-4" /> Revise More
              </Button>
              <Button asChild className="h-12 px-8">
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const word = revisionData.words[currentIndex];

  const handleFlip = () => {
    setIsFlipped(true);
  };

  const handleResult = (remembered: boolean) => {
    const newResults = [...results, { wordId: word.id, remembered }];
    setResults(newResults);
    
    // If it's the last word, submit everything
    if (currentIndex === revisionData.words.length - 1) {
      completeMutation.mutate(
        {
          data: {
            wordIds: revisionData.words.map(w => w.id),
            results: newResults
          }
        },
        {
          onError: () => {
            toast({ title: 'Error saving results', variant: 'destructive' });
          }
        }
      );
    }
    
    setCurrentIndex(prev => prev + 1);
    setIsFlipped(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl min-h-[calc(100vh-10rem)] flex flex-col">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Smart Revision</h1>
        <p className="text-muted-foreground">Word {currentIndex + 1} of {revisionData.words.length}</p>
        <div className="w-full bg-muted h-2 rounded-full mt-4 overflow-hidden">
          <div 
            className="bg-primary h-full transition-all duration-300" 
            style={{ width: `${(currentIndex / revisionData.words.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center perspective-[1000px]">
        {/* Card Flip Container */}
        <div 
          className={`relative w-full transition-all duration-500 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
          style={{ transformStyle: 'preserve-3d', minHeight: '400px' }}
          onClick={!isFlipped ? handleFlip : undefined}
        >
          {/* FRONT */}
          <Card className="absolute inset-0 w-full h-full backface-hidden flex flex-col items-center justify-center p-8 border-primary/20 shadow-xl bg-card hover:border-primary/50 transition-colors" style={{ backfaceVisibility: 'hidden' }}>
            <Badge variant="outline" className="absolute top-6">
              {formatCategory(word.category)}
            </Badge>
            <h2 className="text-5xl md:text-6xl font-black text-center mb-6">{word.word}</h2>
            <p className="text-muted-foreground animate-pulse flex items-center gap-2">
              <RotateCcw className="h-4 w-4" /> Tap to reveal meaning
            </p>
          </Card>

          {/* BACK */}
          <Card className="absolute inset-0 w-full h-full backface-hidden p-8 border-primary/20 shadow-xl bg-card rotate-y-180 flex flex-col" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <div className="flex justify-between items-start mb-6">
              <Badge variant="outline" className="border">
                {formatCategory(word.category)}
              </Badge>
              <Badge variant="outline" className={`border ${getDifficultyColor(word.difficulty)}`}>
                {DIFFICULTY_LABELS[word.difficulty] || word.difficulty}
              </Badge>
            </div>
            
            <div className="flex-1 space-y-6 overflow-y-auto pr-2">
              <h2 className="text-3xl font-bold border-b pb-4">{word.word}</h2>
              
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">Meaning</h3>
                <p className="text-xl">{word.meaning}</p>
              </div>

              {word.hindiMeaning && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">Hindi Meaning</h3>
                  <p className="text-xl font-medium">{word.hindiMeaning}</p>
                </div>
              )}

              {word.exampleSentence && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="italic text-foreground/80">"{word.exampleSentence}"</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className={`mt-8 flex justify-center gap-4 transition-opacity duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <Button 
          size="lg" 
          variant="outline" 
          className="w-full max-w-[200px] h-14 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground font-bold text-lg"
          onClick={() => handleResult(false)}
        >
          <ThumbsDown className="mr-2 h-5 w-5" /> Forgot
        </Button>
        <Button 
          size="lg" 
          className="w-full max-w-[200px] h-14 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold text-lg"
          onClick={() => handleResult(true)}
        >
          <ThumbsUp className="mr-2 h-5 w-5" /> Remembered
        </Button>
      </div>
    </div>
  );
}
