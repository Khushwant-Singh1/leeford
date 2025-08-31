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
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PageBuilder } from '@/components/admin/page-builder/PageBuilder';
import { PageComponent } from '@/components/admin/page-builder/ComponentEditor';

const formSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  parentId: z.string().optional(),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface ParentService {
  id: string;
  name: string;
  slug: string;
  parent?: {
    id: string;
    name: string;
  } | null;
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
    defaultValues: {
      name: '',
      description: '',
      parentId: 'none',
      isActive: true,
    },
  });

  // Check if this is a leaf service (should show page builder)
  const watchParentId = form.watch('parentId');
  
  useEffect(() => {
    // Show page builder for services that have a parent (sub-categories or treatments)
    setShowPageBuilder(Boolean(watchParentId && watchParentId !== 'none'));
  }, [watchParentId]);

  // Fetch parent services
  useEffect(() => {
    const fetchParentServices = async () => {
      try {
        const response = await fetch('/api/admin/services');
        if (response.ok) {
          const data = await response.json();
          setParentServices(data.services || []);
        }
      } catch (error) {
        console.error('Error fetching parent services:', error);
      }
    };

    fetchParentServices();
  }, []);

  // Page component management functions
  const handleComponentsChange = (newComponents: PageComponent[]) => {
    setPageComponents(newComponents);
  };

  async function onSubmit(values: FormData) {
    setIsLoading(true);
    try {
      const payload = {
        ...values,
        parentId: values.parentId && values.parentId !== 'none' ? values.parentId : null,
        components: pageComponents.map(({ id, ...component }) => ({
          ...component,
          // Remove temp id for new components
          ...(id.startsWith('temp-') ? {} : { id })
        }))
      };

      const response = await fetch('/api/admin/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Service created successfully',
        });
        router.push('/admin/services');
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create service',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/services">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Service</h1>
          <p className="text-muted-foreground">
            Create a new service or treatment category
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter service name" {...field} />
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
                          placeholder="Enter service description"
                          rows={4}
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
                      <FormLabel>Parent Service (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select parent service (leave empty for root service)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No parent (Root service)</SelectItem>
                          {parentServices.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.parent ? `↳ ${service.name}` : service.name}
                              {service.parent && (
                                <span className="text-muted-foreground text-xs ml-2">
                                  (under {service.parent.name})
                                </span>
                              )}
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
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Status</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Enable this service to make it visible to customers
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Service'
                    )}
                  </Button>
                  <Link href="/admin/services">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Page Builder - Show for sub-services */}
        {showPageBuilder && (
          <PageBuilder 
            components={pageComponents}
            onComponentsChange={handleComponentsChange}
          />
        )}
      </div>
    </div>
  );
}
