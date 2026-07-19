import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCreateVocabulary,
  VocabularyItem,
  VocabularyInputDifficulty,
} from '@workspace/api-client-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = [
  { value: 'synonyms', label: 'Synonyms' },
  { value: 'antonyms', label: 'Antonyms' },
  { value: 'one_word_substitution', label: 'One Word Substitution' },
  { value: 'idioms_phrases', label: 'Idioms & Phrases' },
  { value: 'important_vocabulary', label: 'Important Vocabulary' },
  { value: 'phrasal_verbs', label: 'Phrasal Verbs' },
  { value: 'root_words', label: 'Root Words' },
  { value: 'confusing_words', label: 'Confusing Words' },
  { value: 'spellings', label: 'Spellings' },
];

const schema = z.object({
  word: z.string().min(1, 'Word is required'),
  meaning: z.string().min(1, 'Meaning is required'),
  hindiMeaning: z.string().optional(),
  exampleSentence: z.string().optional(),
  synonyms: z.string().optional(),
  antonyms: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  category: z.string().min(1, 'Category is required'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: VocabularyItem | null;
}

export function VocabularyFormDialog({ open, onOpenChange, editItem }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateVocabulary();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      word: '',
      meaning: '',
      hindiMeaning: '',
      exampleSentence: '',
      synonyms: '',
      antonyms: '',
      difficulty: 'medium',
      category: '',
    },
  });

  useEffect(() => {
    if (editItem) {
      reset({
        word: editItem.word,
        meaning: editItem.meaning,
        hindiMeaning: editItem.hindiMeaning ?? '',
        exampleSentence: editItem.exampleSentence ?? '',
        synonyms: (editItem.synonyms ?? []).join(', '),
        antonyms: (editItem.antonyms ?? []).join(', '),
        difficulty: editItem.difficulty as 'easy' | 'medium' | 'hard',
        category: editItem.category,
      });
    } else {
      reset({
        word: '',
        meaning: '',
        hindiMeaning: '',
        exampleSentence: '',
        synonyms: '',
        antonyms: '',
        difficulty: 'medium',
        category: '',
      });
    }
  }, [editItem, open, reset]);

  const splitCSV = (val?: string) =>
    val ? val.split(',').map((s) => s.trim()).filter(Boolean) : [];

  const onSubmit = (values: FormValues) => {
    const payload = {
      word: values.word.trim(),
      meaning: values.meaning.trim(),
      hindiMeaning: values.hindiMeaning?.trim() || undefined,
      exampleSentence: values.exampleSentence?.trim() || undefined,
      synonyms: splitCSV(values.synonyms),
      antonyms: splitCSV(values.antonyms),
      difficulty: values.difficulty as VocabularyInputDifficulty,
      category: values.category,
      alphabet: values.word.trim()[0]?.toLowerCase() ?? 'a',
    };

    createMutation.mutate(
      { data: payload },
      {
        onSuccess: () => {
          toast({ title: 'Word added successfully!' });
          queryClient.invalidateQueries({ queryKey: ['/api/admin/vocabulary'] });
          queryClient.invalidateQueries({ queryKey: ['/api/vocabulary/browse/topics'] });
          onOpenChange(false);
          reset();
        },
        onError: (err: any) => {
          toast({
            variant: 'destructive',
            title: 'Failed to add word',
            description: err?.data?.error ?? 'Something went wrong',
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editItem ? 'Edit Word' : 'Add New Word'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="word">Word *</Label>
              <Input id="word" {...register('word')} placeholder="e.g. Ephemeral" />
              {errors.word && <p className="text-xs text-destructive">{errors.word.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={watch('category')}
                onValueChange={(v) => setValue('category', v, { shouldValidate: true })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="meaning">Meaning *</Label>
            <Textarea id="meaning" {...register('meaning')} placeholder="English meaning / definition" rows={2} />
            {errors.meaning && <p className="text-xs text-destructive">{errors.meaning.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="hindiMeaning">Hindi Meaning</Label>
            <Input id="hindiMeaning" {...register('hindiMeaning')} placeholder="हिन्दी अर्थ (optional)" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="exampleSentence">Example Sentence</Label>
            <Textarea id="exampleSentence" {...register('exampleSentence')} placeholder="Use the word in a sentence…" rows={2} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="synonyms">Synonyms</Label>
              <Input id="synonyms" {...register('synonyms')} placeholder="comma-separated, e.g. brief, fleeting" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="antonyms">Antonyms</Label>
              <Input id="antonyms" {...register('antonyms')} placeholder="comma-separated, e.g. permanent, eternal" />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="difficulty">Difficulty *</Label>
            <Select
              value={watch('difficulty')}
              onValueChange={(v) => setValue('difficulty', v as 'easy' | 'medium' | 'hard')}
            >
              <SelectTrigger id="difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
              {createMutation.isPending ? 'Saving…' : editItem ? 'Update Word' : 'Add Word'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
