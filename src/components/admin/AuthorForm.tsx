'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// 1. Zod schema for comprehensive form validation
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  profilePicture: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  bio: z.string().optional(),
  socialLinks: z.object({
    twitter: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
    linkedin: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
    website: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  }).optional(),
});

// Type generated from the Zod schema
type ProfileFormValues = z.infer<typeof profileSchema>;

// Component props interface
interface AuthorProfileFormProps {
  // initialData is optional; its presence determines if we are in "edit" mode
  initialData?: ProfileFormValues & { id: string };
  // A callback function to run on successful submission (e.g., close a dialog)
  onSuccess: () => void;
}

export function AuthorProfileForm({ initialData, onSuccess }: AuthorProfileFormProps) {
  const isEditMode = !!initialData;

  // 2. Setup react-hook-form with Zod resolver and default values
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData?.name || '',
      profilePicture: initialData?.profilePicture || '',
      bio: initialData?.bio || '',
      socialLinks: {
        twitter: initialData?.socialLinks?.twitter || '',
        linkedin: initialData?.socialLinks?.linkedin || '',
        website: initialData?.socialLinks?.website || '',
      }
    },
  });

  const { isSubmitting } = form.formState;

  // 3. Handle form submission
  const handleSubmit = async (values: ProfileFormValues) => {
    try {
      const url = isEditMode
        ? `/api/admin/authors/${initialData.id}`
        : '/api/admin/authors';
      
      const method = isEditMode ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'An unknown error occurred.');
      }
      
      toast.success(isEditMode ? 'Author updated successfully!' : 'Author created successfully!');
      onSuccess(); // Call the success callback

    } catch (error: any) {
      toast.error('Operation Failed', {
        description: error.message,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Author Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="profilePicture"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile Picture URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/image.png" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Biography</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="A short biography about the author..."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div>
          <h3 className="text-md font-semibold mb-2">Social Links</h3>
          <div className="space-y-4 rounded-md border p-4">
            <FormField
              control={form.control}
              name="socialLinks.twitter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twitter URL</FormLabel>
                  <FormControl><Input placeholder="https://twitter.com/..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="socialLinks.linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn URL</FormLabel>
                  <FormControl><Input placeholder="https://linkedin.com/in/..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="socialLinks.website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl><Input placeholder="https://your-website.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Author' : 'Create Author'}
          </Button>
        </div>
      </form>
    </Form>
  );
}