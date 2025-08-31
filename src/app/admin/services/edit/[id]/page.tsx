'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Loader2, ArrowLeft, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Enhanced validation schema with better error messages
const formSchema = z.object({
  name: z.string()
    .min(1, 'Service name is required')
    .max(100, 'Service name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_&()]+$/, 'Service name contains invalid characters'),
  description: z.string()
    .min(1, 'Description is required')
    .max(500, 'Description must be less than 500 characters'),
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

interface Service {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  isActive: boolean;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

// Error boundary component
const ErrorBoundary = ({ error, reset }: { error: Error; reset: () => void }) => (
  <Alert variant="destructive" className="max-w-2xl">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      <div className="space-y-2">
        <p className="font-medium">Something went wrong</p>
        <p className="text-sm">{error.message}</p>
        <Button variant="outline" size="sm" onClick={reset}>
          Try again
        </Button>
      </div>
    </AlertDescription>
  </Alert>
);

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id as string;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [parentServices, setParentServices] = useState<ParentService[]>([]);
  const [service, setService] = useState<Service | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      parentId: 'none',
      isActive: true,
    },
  });

  // Fetch service data
  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(`/api/admin/services/${serviceId}`);
        const data = await response.json();
        
        if (response.ok) {
          setService(data);
          form.setValue('name', data.name);
          form.setValue('description', data.description);
          form.setValue('parentId', data.parentId || 'none');
          form.setValue('isActive', data.isActive);
        } else {
          toast({
            title: 'Error',
            description: data.error || 'Service not found',
            variant: 'destructive',
          });
          router.push('/admin/services');
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load service',
          variant: 'destructive',
        });
        router.push('/admin/services');
      } finally {
        setPageLoading(false);
      }
    };

    if (serviceId) {
      fetchService();
    }
  }, [serviceId, form, router, toast]);

  // Fetch parent services
  useEffect(() => {
    const fetchParentServices = async () => {
      try {
        // Fetch all services to allow creating sub-sub-categories
        const response = await fetch('/api/admin/services?limit=1000&status=active');
        const data = await response.json();
        
        if (response.ok) {
          // Filter out current service and its descendants to prevent circular references
          const filteredServices = data.services?.filter((s: ParentService) => {
            // Don't include the current service
            if (s.id === serviceId) return false;
            // TODO: Add logic to filter out descendants to prevent circular references
            return true;
          }) || [];
          setParentServices(filteredServices);
        }
      } catch (error) {
        console.error('Failed to fetch parent services:', error);
      }
    };

    fetchParentServices();
  }, [serviceId]);

  async function onSubmit(values: FormData) {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          parentId: values.parentId && values.parentId !== 'none' ? values.parentId : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Service updated successfully',
        });
        router.push('/admin/services');
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update service',
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

  if (pageLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/services">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Services
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Service</h1>
            <p className="text-muted-foreground">Loading service details...</p>
          </div>
        </div>
        <Card className="max-w-2xl">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Service not found</p>
        <Link href="/admin/services">
          <Button className="mt-4">
            Back to Services
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/services">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Services
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Service</h1>
          <p className="text-muted-foreground">Update service details and settings</p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                      Updating...
                    </>
                  ) : (
                    'Update Service'
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
    </div>
  );
}
