import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VocabularyItem } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { ArrowRight, BookOpen, Volume2 } from 'lucide-react';
import { getCategoryColor, getDifficultyColor, formatCategory, DIFFICULTY_LABELS } from '@/lib/utils';

export function VocabCard({ word }: { word: VocabularyItem }) {
  const categoryColor = getCategoryColor(word.category);
  const difficultyColor = getDifficultyColor(word.difficulty);

  return (
    <Card className="h-full flex flex-col hover-elevate transition-all group overflow-hidden border-border/50 hover:border-primary/30">
      <div className={`h-1.5 w-full bg-gradient-to-r from-primary to-primary/50`} />
      <CardHeader className="pb-3 px-5 pt-5">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className={`font-semibold border bg-transparent ${categoryColor}`}>
            {formatCategory(word.category)}
          </Badge>
          <Badge variant="outline" className={`font-medium border bg-transparent ${difficultyColor}`}>
            {DIFFICULTY_LABELS[word.difficulty] || word.difficulty}
          </Badge>
        </div>
        <div className="flex items-center justify-between mt-2">
          <h3 className="text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
            {word.word}
          </h3>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full" onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if ('speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(word.word);
              window.speechSynthesis.speak(utterance);
            }
          }}>
            <Volume2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-5 pb-4">
        <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
          {word.meaning}
        </p>
        {word.hindiMeaning && (
          <p className="text-xs text-muted-foreground/80 mt-2 font-medium">
            <span className="text-primary/70">Hi:</span> {word.hindiMeaning}
          </p>
        )}
      </CardContent>
      <CardFooter className="px-5 pb-5 pt-0">
        <Button variant="secondary" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
          <Link href={`/vocabulary/${word.id}`}>
            View Details
            <ArrowRight className="h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
