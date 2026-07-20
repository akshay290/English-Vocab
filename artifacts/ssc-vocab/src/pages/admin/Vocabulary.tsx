import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminListVocabulary, useDeleteVocabulary, useAdminBulkCreateVocabulary, VocabularyItem, customFetch } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, Edit, Trash2, Upload, Trash } from 'lucide-react';
import { formatCategory, getDifficultyColor } from '@/lib/utils';
import { VocabularyFormDialog } from '@/components/admin/VocabularyFormDialog';
import { BulkAddDialog } from '@/components/admin/BulkAddDialog';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AdminVocabulary() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editItem, setEditItem] = useState<VocabularyItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const deleteMutation = useDeleteVocabulary();
  const bulkMutation = useAdminBulkCreateVocabulary();

  const deleteAllMutation = useMutation({
    mutationFn: () => customFetch('/api/admin/vocabulary', { method: 'DELETE' }),
    onSuccess: () => {
      toast({ title: 'All words deleted', description: 'The word database has been cleared.' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vocabulary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vocabulary/browse/topics'] });
      setDeleteAllOpen(false);
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Failed to delete all words' });
      setDeleteAllOpen(false);
    },
  });

  const handleSearchChange = (val: string) => {
    setSearch(val);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(search);
    setPage(1);
  };

  const { data, isLoading } = useAdminListVocabulary({
    search: debouncedSearch || undefined,
    page,
    limit: 20
  });

  const handleDelete = () => {
    if (deleteId == null) return;
    deleteMutation.mutate(
      { id: deleteId },
      {
        onSuccess: () => {
          toast({ title: 'Word deleted' });
          queryClient.invalidateQueries({ queryKey: ['/api/admin/vocabulary'] });
          setDeleteId(null);
        },
        onError: () => {
          toast({ variant: 'destructive', title: 'Failed to delete word' });
          setDeleteId(null);
        },
      }
    );
  };

  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      let items: unknown;
      try {
        items = JSON.parse(content);
      } catch {
        toast({ variant: 'destructive', title: 'Invalid JSON file', description: 'The file could not be parsed as JSON.' });
        return;
      }

      if (!Array.isArray(items)) {
        toast({ variant: 'destructive', title: 'Wrong format', description: 'JSON must be an array: [ { word, meaning, category, difficulty, ... } ]' });
        return;
      }

      toast({ title: `Uploading ${items.length} words…` });

      bulkMutation.mutate(
        { data: { items: items as any } },
        {
          onSuccess: (res) => {
            toast({
              title: `Upload complete`,
              description: `${res.created} words added${res.failed > 0 ? `, ${res.failed} failed` : ''}.`,
            });
            queryClient.invalidateQueries({ queryKey: ['/api/admin/vocabulary'] });
            queryClient.invalidateQueries({ queryKey: ['/api/vocabulary/browse/topics'] });
          },
          onError: (err: any) => {
            toast({ variant: 'destructive', title: 'Upload failed', description: err?.data?.error ?? 'Something went wrong' });
          },
        }
      );
    };
    reader.readAsText(file);
    // reset input so the same file can be re-uploaded
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vocabulary Management</h1>
          <p className="text-muted-foreground mt-1">Add, edit, or remove words</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Hidden file input for JSON upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleJsonFileUpload}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={bulkMutation.isPending}
          >
            <Upload className="h-4 w-4 mr-2" />
            {bulkMutation.isPending ? 'Uploading…' : 'Upload JSON'}
          </Button>
          <Button variant="outline" onClick={() => setBulkOpen(true)}>Bulk Add (Paste)</Button>
          <Button onClick={() => { setEditItem(null); setAddOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Word
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteAllOpen(true)}
            disabled={deleteAllMutation.isPending}
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete All Words
          </Button>
        </div>
      </div>

      {/* JSON format hint */}
      <Card className="bg-muted/40 border-dashed">
        <CardContent className="py-3 px-4">
          <p className="text-xs text-muted-foreground">
            <strong>Upload JSON format:</strong>{' '}
            <code className="bg-background px-1 rounded">
              {'[{"word":"...","meaning":"...","category":"important_vocabulary","difficulty":"medium","hindiMeaning":"...","synonyms":[],"antonyms":[],"examRefs":["SSC CGL"]}]'}
            </code>
            {' '}— Categories: <code className="bg-background px-1 rounded">important_vocabulary</code>,{' '}
            <code className="bg-background px-1 rounded">idioms_phrases</code>,{' '}
            <code className="bg-background px-1 rounded">synonyms</code>,{' '}
            <code className="bg-background px-1 rounded">antonyms</code>,{' '}
            <code className="bg-background px-1 rounded">homonyms</code>,{' '}
            <code className="bg-background px-1 rounded">phrasal_verbs</code>,{' '}
            <code className="bg-background px-1 rounded">fixed_prepositions</code>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-4 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Word Database</CardTitle>
            <form onSubmit={handleSearch} className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search words..." 
                className="pl-9 h-9"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </form>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Word</TableHead>
                    <TableHead>Meaning</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items.map((word) => (
                    <TableRow key={word.id}>
                      <TableCell className="font-bold">{word.word}</TableCell>
                      <TableCell className="max-w-md truncate text-muted-foreground">{word.meaning}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-medium">
                          {formatCategory(word.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`border ${getDifficultyColor(word.difficulty)}`}>
                          {word.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => { setEditItem(word); setAddOpen(true); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(word.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data?.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No vocabulary words found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          
          {data && data.totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing page {page} of {data.totalPages}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit dialog */}
      <VocabularyFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        editItem={editItem}
      />

      {/* Bulk Add dialog (paste JSON) */}
      <BulkAddDialog open={bulkOpen} onOpenChange={setBulkOpen} />

      {/* Delete All confirmation */}
      <AlertDialog open={deleteAllOpen} onOpenChange={(o) => { if (!o) setDeleteAllOpen(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete ALL words?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete every word in the database, including all test history
              referencing them. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteAllMutation.mutate()}
              disabled={deleteAllMutation.isPending}
            >
              {deleteAllMutation.isPending ? 'Deleting…' : 'Delete All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete single word confirmation */}
      <AlertDialog open={deleteId != null} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this word?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The word will be permanently removed from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
