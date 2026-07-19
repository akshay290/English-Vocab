import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminBulkCreateVocabulary } from '@workspace/api-client-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EXAMPLE = JSON.stringify(
  [
    {
      word: 'Ephemeral',
      meaning: 'Lasting for a very short time',
      hindiMeaning: 'क्षणिक',
      exampleSentence: 'Fame is ephemeral.',
      synonyms: ['brief', 'fleeting', 'transient'],
      antonyms: ['permanent', 'eternal'],
      difficulty: 'medium',
      category: 'important_vocabulary',
    },
  ],
  null,
  2
);

export function BulkAddDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const bulkMutation = useAdminBulkCreateVocabulary();
  const [json, setJson] = useState('');
  const [parseError, setParseError] = useState('');
  const [result, setResult] = useState<{ created: number; failed: number; errors?: string[] } | null>(null);

  const handleSubmit = () => {
    setParseError('');
    setResult(null);

    let items: unknown;
    try {
      items = JSON.parse(json);
    } catch {
      setParseError('Invalid JSON. Please check your input.');
      return;
    }

    if (!Array.isArray(items)) {
      setParseError('Input must be a JSON array [ { ... }, ... ]');
      return;
    }

    bulkMutation.mutate(
      { data: { items: items as any } },
      {
        onSuccess: (res) => {
          setResult(res);
          queryClient.invalidateQueries({ queryKey: ['/api/admin/vocabulary'] });
          queryClient.invalidateQueries({ queryKey: ['/api/vocabulary/browse/topics'] });
          if (res.failed === 0) {
            toast({ title: `${res.created} word(s) added successfully!` });
            if (res.created > 0) setJson('');
          } else {
            toast({
              variant: 'destructive',
              title: `${res.created} added, ${res.failed} failed`,
            });
          }
        },
        onError: (err: any) => {
          toast({
            variant: 'destructive',
            title: 'Bulk add failed',
            description: err?.data?.error ?? 'Something went wrong',
          });
        },
      }
    );
  };

  const handleClose = () => {
    setJson('');
    setParseError('');
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Add Vocabulary</DialogTitle>
          <DialogDescription>
            Paste a JSON array of vocabulary objects. Required fields:{' '}
            <code className="text-xs bg-muted px-1 rounded">word</code>,{' '}
            <code className="text-xs bg-muted px-1 rounded">meaning</code>,{' '}
            <code className="text-xs bg-muted px-1 rounded">category</code>,{' '}
            <code className="text-xs bg-muted px-1 rounded">difficulty</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Example */}
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Show example JSON
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-x-auto">{EXAMPLE}</pre>
          </details>

          <Textarea
            value={json}
            onChange={(e) => { setJson(e.target.value); setParseError(''); setResult(null); }}
            placeholder={'[\n  {\n    "word": "...",\n    "meaning": "...",\n    "category": "important_vocabulary",\n    "difficulty": "medium"\n  }\n]'}
            rows={14}
            className="font-mono text-sm"
          />

          {parseError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert variant={result.failed === 0 ? 'default' : 'destructive'}>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>{result.created}</strong> word(s) added.{' '}
                {result.failed > 0 && <><strong>{result.failed}</strong> failed.</>}
                {result.errors && result.errors.length > 0 && (
                  <ul className="mt-1 text-xs list-disc list-inside">
                    {result.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                    {result.errors.length > 5 && <li>…and {result.errors.length - 5} more</li>}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button onClick={handleSubmit} disabled={!json.trim() || bulkMutation.isPending}>
              {bulkMutation.isPending ? 'Uploading…' : 'Upload Words'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
