'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Edit, Trash2, Tag, ArrowLeft, Inbox } from 'lucide-react';
import Link from 'next/link';

const categorySchema = z.object({
  name: z.string().min(1, 'Required').max(100, 'Max 100 chars'),
  description: z.string().optional(),
});

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  _count: { services: number };
}

export default function ServiceCategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '' },
  });

  /* ---------- fetch ---------- */
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/services/categories');
      const data = await res.json();
      if (res.ok) setCategories(data);
      else throw data;
    } catch {
      toast({ title: 'Could not load categories', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  /* ---------- crud ---------- */
  const onSubmit = async (values: z.infer<typeof categorySchema>) => {
    const url = editingCategory
      ? `/api/admin/services/categories/${editingCategory.id}`
      : '/api/admin/services/categories';
    const method = editingCategory ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: editingCategory ? 'Updated' : 'Created' });
        setDialogOpen(false);
        form.reset();
        fetchCategories();
      } else {
        toast({ title: data.error || 'Failed', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      const res = await fetch(`/api/admin/services/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Deleted' });
        fetchCategories();
      } else {
        toast({ title: data.error || 'Failed', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const openCreate = () => {
    setEditingCategory(null);
    form.reset();
    setDialogOpen(true);
  };

  const openEdit = (cat: ServiceCategory) => {
    setEditingCategory(cat);
    form.setValue('name', cat.name);
    form.setValue('description', cat.description || '');
    setDialogOpen(true);
  };

  /* ---------- skeleton ---------- */
  const skeletonRows = Array.from({ length: 5 }).map((_, i) => (
    <TableRow key={i}>
      <TableCell colSpan={5}>
        <Skeleton className="h-6 w-full rounded" />
      </TableCell>
    </TableRow>
  ));

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/services">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              Service Categories
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Organize your services into logical groups
            </p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* table */}
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Tag className="h-5 w-5" />
            All Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Services</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                skeletonRows
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-neutral-500 dark:text-neutral-400">
                      <Inbox className="h-10 w-10" />
                      <span>No categories yet</span>
                      <Button variant="outline" size="sm" onClick={openCreate}>
                        Create your first
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((cat) => (
                  <TableRow key={cat.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <TableCell>
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">{cat.name}</div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">{cat.slug}</div>
                    </TableCell>
                    <TableCell className="text-sm text-neutral-600 dark:text-neutral-300">
                      {cat.description || '—'}
                    </TableCell>
                    <TableCell className="text-center font-semibold">{cat._count.services}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(cat.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                          <Edit className="h-4 w-4" />
                        </Button>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={cat._count.services > 0}
                                onClick={() => handleDelete(cat.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TooltipTrigger>
                            {cat._count.services > 0 && (
                              <TooltipContent>
                                <p>Cannot delete category with services</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Create Category'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Hair" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Short description..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="submit">{editingCategory ? 'Save' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}