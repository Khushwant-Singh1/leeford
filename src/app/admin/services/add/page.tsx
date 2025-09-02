'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Wrench } from 'lucide-react';
import Link from 'next/link';
import { PageBuilder } from '@/components/admin/page-builder/PageBuilder';
import { PageComponent } from '@/components/admin/page-builder/ComponentEditor';

const formSchema = z.object({
  name: z.string().min(1, 'Required').max(100, 'Max 100 chars'),
  description: z.string().min(1, 'Required').max(500, 'Max 500 chars'),
  parentId: z.string().optional(),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface ParentService {
  id: string;
  name: string;
  slug: string;
  parent?: { id: string; name: string } | null;
}

export default function AddServicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [parentServices, setParentServices] = useState<ParentService[]>([]);
  const [pageComponents, setPageComponents] = useState<PageComponent[]>([]);
  const [showPageBuilder, setShowPageBuilder] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', description: '', parentId: 'none', isActive: true },
  });

  const watchParentId = form.watch('parentId');
  useEffect(() => {
    setShowPageBuilder(Boolean(watchParentId && watchParentId !== 'none'));
  }, [watchParentId]);

  /* ---------- fetch parent list ---------- */
  useEffect(() => {
    fetch('/api/admin/services')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => setParentServices(d.services || []))
      .catch(() => toast({ title: 'Could not load parent services', variant: 'destructive' }));
  }, [toast]);

  /* ---------- submit ---------- */
  async function onSubmit(values: FormData) {
    setIsLoading(true);
    try {
      const payload = {
        ...values,
        parentId: values.parentId === 'none' ? null : values.parentId,
        components: pageComponents.map(({ id, ...c }) =>
          id.startsWith('temp-') ? c : { ...c, id }
        ),
      };

      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Created' });
        router.push('/admin/services');
      } else {
        toast({ title: 'Error', description: data.error || 'Failed', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  /* ---------- ui ---------- */
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/services">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            Add New Service
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Create a service or treatment category
          </p>
        </div>
      </div>

      {/* form */}
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Service Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-base text-black font-medium'>Name</FormLabel>
                    <FormControl>
                      <Input className='bg-gray-50 text-black border border-gray-200' placeholder="e.g. Haircut & Styling" {...field} />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description shown to customers..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Service</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose parent…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None (root service)</SelectItem>
                        {parentServices.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.parent ? `↳ ${s.name}` : s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel className="font-medium">Active</FormLabel>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Visible to customers when switched on
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Service
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/services">Cancel</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* page builder */}
      {showPageBuilder && (
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Page Builder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PageBuilder
              components={pageComponents}
              onComponentsChange={setPageComponents}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}