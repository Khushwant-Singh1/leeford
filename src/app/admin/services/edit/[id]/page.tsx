'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { Loader2, ArrowLeft, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  name: z
    .string()
    .min(1, 'Required')
    .max(100, 'Maximum 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_&()]+$/, 'Only letters, numbers, spaces and - _ & ()'),
  description: z.string().min(1, 'Required').max(500, 'Maximum 500 characters'),
  parentId: z.string().optional(),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface ParentService {
  id: string;
  name: string;
  parent?: { id: string; name: string } | null;
}

export default function EditServicePage() {
  const router = useRouter();
  const { id } = useParams();
  const serviceId = id as string;
  const { toast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [parentServices, setParentServices] = useState<ParentService[]>([]);
  const [service, setService] = useState<ParentService & { description: string; isActive: boolean } | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', description: '', parentId: 'none', isActive: true },
  });

  /* ---------- Data ---------- */
  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/services/${serviceId}`).then((r) => r.json()),
      fetch('/api/admin/services?limit=1000&status=active').then((r) => r.json()),
    ])
      .then(([svc, parents]) => {
        setService(svc);
        setParentServices(
          (parents.services || []).filter((s: ParentService) => s.id !== serviceId)
        );
        form.reset({
          name: svc.name,
          description: svc.description,
          parentId: svc.parentId || 'none',
          isActive: svc.isActive,
        });
      })
      .catch(() => {
        toast({ title: 'Service not found', variant: 'destructive' });
        router.replace('/admin/services');
      })
      .finally(() => setIsLoading(false));
  }, [serviceId, router, toast, form]);

  /* ---------- Submit ---------- */
  async function onSubmit(values: FormData) {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, parentId: values.parentId === 'none' ? null : values.parentId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Saved', description: 'Service updated successfully' });
        router.push('/admin/services');
      } else {
        toast({ title: 'Error', description: data.error || 'Update failed', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Unexpected error', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }

  /* ---------- Loading Skeleton ---------- */
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <Skeleton className="h-10 w-48 rounded" />
        <Card>
          <CardContent className="p-6 space-y-5">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-32 rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---------- UI ---------- */
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/services">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            Edit Service
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Update details and save changes
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="text-lg">Service Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Haircut & Styling" {...field} />
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
                      <Textarea placeholder="Describe what this service includes..." rows={3} {...field} />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose parent..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None (root service)</SelectItem>
                        {parentServices.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.parent ? `↳ ${p.name}` : p.name}
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
                        Customers can see and book this service when enabled
                      </p>
                    </div>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/services">Cancel</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}