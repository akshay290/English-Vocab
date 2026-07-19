import { useGetVocabularyItem, useUpdateWordProgress } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Volume2, CheckCircle2, Languages, List, Tags, History } from 'lucide-react';
import { Link } from 'wouter';
import { getCategoryColor, getDifficultyColor, formatCategory, DIFFICULTY_LABELS } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function WordDetail({ params }: { params: { id: string } }) {
  const wordId = parseInt(params.id);
  const { data: word, isLoading } = useGetVocabularyItem(wordId);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const markProgressMutation = useUpdateWordProgress();

  if (isLoading) return <WordDetailSkeleton />;
  if (!word) return <div className="text-center py-20 text-xl font-semibold">Word not found</div>;

  const handleMarkLearned = () => {
    markProgressMutation.mutate(
      { wordId, data: { status: 'learned' } }
    );
    toast({ title: "Marked as learned", description: "This word has been added to your learned list." });
  };

  const playAudio = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word.word);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" asChild className="mb-6 -ml-4 text-muted-foreground hover:text-foreground">
        <Link href="/vocabulary"><ArrowLeft className="h-4 w-4 mr-2"/> Back to Browser</Link>
      </Button>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-lg overflow-hidden">
            <div className={`h-2 w-full bg-primary`} />
            <CardContent className="p-8">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className={`border ${getCategoryColor(word.category)}`}>
                  {formatCategory(word.category)}
                </Badge>
                <Badge variant="outline" className={`border ${getDifficultyColor(word.difficulty)}`}>
                  {DIFFICULTY_LABELS[word.difficulty] || word.difficulty}
                </Badge>
                {word.examRefs?.map(exam => (
                  <Badge key={exam} variant="secondary" className="bg-muted">
                    {exam}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between mt-2 mb-6">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
                  {word.word}
                </h1>
                <Button size="icon" variant="outline" className="h-12 w-12 rounded-full border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground" onClick={playAudio}>
                  <Volume2 className="h-6 w-6" />
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-primary">
                    <BookOpen className="h-5 w-5" /> Meaning
                  </h3>
                  <p className="text-xl leading-relaxed text-foreground/90">{word.meaning}</p>
                </div>

                {word.hindiMeaning && (
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-secondary">
                      <Languages className="h-5 w-5" /> Hindi Meaning
                    </h3>
                    <p className="text-xl leading-relaxed text-foreground/90 font-medium">{word.hindiMeaning}</p>
                  </div>
                )}

                {word.exampleSentence && (
                  <div className="bg-muted/30 p-6 rounded-xl border border-border/50">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Example Sentence</h3>
                    <p className="text-lg italic text-foreground border-l-4 border-primary/40 pl-4 py-1">"{word.exampleSentence}"</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {(word.synonyms && word.synonyms.length > 0) || (word.antonyms && word.antonyms.length > 0) ? (
            <div className="grid sm:grid-cols-2 gap-6">
              {word.synonyms && word.synonyms.length > 0 && (
                <Card className="border-none shadow-md bg-purple-50/50 dark:bg-purple-950/10">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-purple-600 dark:text-purple-400">
                      <List className="h-5 w-5" /> Synonyms
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {word.synonyms.map(syn => (
                        <Badge key={syn} variant="outline" className="bg-white dark:bg-black/20 border-purple-200 dark:border-purple-800 text-sm">
                          {syn}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {word.antonyms && word.antonyms.length > 0 && (
                <Card className="border-none shadow-md bg-red-50/50 dark:bg-red-950/10">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-red-600 dark:text-red-400">
                      <History className="h-5 w-5" /> Antonyms
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {word.antonyms.map(ant => (
                        <Badge key={ant} variant="outline" className="bg-white dark:bg-black/20 border-red-200 dark:border-red-800 text-sm">
                          {ant}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          {isAuthenticated ? (
            <Card className="border-primary/20 shadow-md">
              <CardContent className="p-6 text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Mark as Learned</h3>
                  <p className="text-sm text-muted-foreground mt-1">Add this to your learned vocabulary to track progress.</p>
                </div>
                <Button className="w-full font-bold" onClick={handleMarkLearned}>
                  I know this word
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold mb-2">Track your progress</h3>
                <p className="text-sm text-muted-foreground mb-4">Log in to mark words as learned and build your daily streak.</p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/auth/login">Login to Track</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {word.topics && word.topics.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold flex items-center gap-2 mb-3 text-sm uppercase tracking-wider text-muted-foreground">
                  <Tags className="h-4 w-4" /> Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {word.topics.map(topic => (
                    <span key={topic} className="text-sm px-2 py-1 bg-muted rounded-md font-medium text-foreground/80">
                      {topic}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function WordDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <Skeleton className="h-10 w-32" />
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-16 w-3/4" />
              <div className="space-y-4 pt-4">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-20 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-12 w-12 rounded-full mx-auto" />
              <Skeleton className="h-6 w-3/4 mx-auto" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
