import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminListVocabulary, useDeleteVocabulary, VocabularyItem } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { formatCategory, getDifficultyColor } from '@/lib/utils';
import { VocabularyFormDialog } from '@/components/admin/VocabularyFormDialog';
import { BulkAddDialog } from '@/components/admin/BulkAddDialog';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useDeleteVocabulary();

  // Debounce via a simple timeout approach
  const handleSearchChange = (val: string) => {
    setSearch(val);
    // immediate update; real debounce via form submit
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vocabulary Management</h1>
          <p className="text-muted-foreground mt-1">Add, edit, or remove words</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBulkOpen(true)}>Bulk Add</Button>
          <Button onClick={() => { setEditItem(null); setAddOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add New Word
          </Button>
        </div>
      </div>

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

      {/* Bulk Add dialog */}
      <BulkAddDialog open={bulkOpen} onOpenChange={setBulkOpen} />

      {/* Delete confirmation */}
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
