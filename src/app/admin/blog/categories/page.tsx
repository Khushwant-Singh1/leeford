'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryForm } from '@/components/admin/blog-category-form'; // Import the new form

// --- (BlogCategory interface remains the same) ---
interface BlogCategory {
  id: string; name: string; slug: string; description: string | null; color: string | null;
  createdAt: string; updatedAt: string; _count: { posts: number; };
}

export default function BlogCategoriesPage() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogState, setDialogState] = useState<{ open: boolean; mode: 'create' | 'edit'; data?: BlogCategory | null }>({ open: false, mode: 'create', data: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; data?: BlogCategory | null }>({ open: false, data: null });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/blog/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      setCategories(await response.json());
    } catch (error) {
      toast.error('Failed to fetch categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleDelete = async () => {
    if (!deleteDialog.data) return;
    try {
      const response = await fetch(`/api/admin/blog/categories/${deleteDialog.data.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete category');
      toast.success('Category deleted successfully.');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to delete category.');
    } finally {
      setDeleteDialog({ open: false, data: null });
    }
  };

  const filteredCategories = useMemo(() =>
    categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [categories, searchTerm]
  );
  
  const handleFormSuccess = () => {
    setDialogState({ open: false, mode: 'create' });
    fetchCategories();
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Blog Categories</h1>
            <p className="text-muted-foreground">Organize your blog posts with categories.</p>
          </div>
          <Button onClick={() => setDialogState({ open: true, mode: 'create' })}>
            <Plus className="h-4 w-4 mr-2" />Add Category
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead>Posts</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}><TableCell><Skeleton className="h-5 w-32" /></TableCell><TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-48" /></TableCell><TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell></TableRow>
                    ))
                  ) : filteredCategories.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="h-48 text-center"><div className="flex flex-col items-center gap-4"><Tag className="h-12 w-12 text-muted-foreground" /><h3 className="text-lg font-semibold">No Categories Found</h3><p className="text-muted-foreground text-sm">{searchTerm ? 'Try adjusting your search.' : 'Create your first category to get started.'}</p></div></TableCell></TableRow>
                  ) : (
                    filteredCategories.map((category) => (
                      <TableRow key={category.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium"><div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color || '#3B82F6' }} />{category.name}</div></TableCell>
                        <TableCell className="hidden md:table-cell"><div className="max-w-xs truncate text-muted-foreground">{category.description || '—'}</div></TableCell>
                        <TableCell><Badge variant="secondary">{category._count.posts} posts</Badge></TableCell>
                        <TableCell className="text-right"><div className="flex items-center justify-end gap-1">
                          <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" onClick={() => setDialogState({ open: true, mode: 'edit', data: category })}><Edit className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Edit Category</p></TooltipContent></Tooltip>
                          <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => setDeleteDialog({ open: true, data: category })}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Delete Category</p></TooltipContent></Tooltip>
                        </div></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogState.open} onOpenChange={(open) => setDialogState({ ...dialogState, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogState.mode === 'edit' ? 'Edit Category' : 'Create New Category'}</DialogTitle>
              <DialogDescription>{dialogState.mode === 'edit' ? 'Update the category information.' : 'Add a new category to organize your blog posts.'}</DialogDescription>
            </DialogHeader>
            <CategoryForm initialData={dialogState.data} onSuccess={handleFormSuccess} />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently delete the category "{deleteDialog.data?.name}". This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}