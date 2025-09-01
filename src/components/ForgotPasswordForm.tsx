'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, MailCheck } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// Zod schema for the form
const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset link.');
      }
      
      toast.success('Request Sent!', {
        description: data.message,
      });
      setIsSubmitted(true);

    } catch (err: any) {
      toast.error('Operation Failed', {
        description: err.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <MailCheck className="mx-auto h-12 w-12 text-green-500" />
          <CardTitle className="text-2xl mt-4">Check Your Email</CardTitle>
          <CardDescription>
            If an account with that email exists, we have sent a password reset link. Please check your inbox and spam folder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login">
            <Button className="w-full">Return to Login</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Forgot Your Password?</CardTitle>
        <CardDescription>No problem. Enter your email address below and we&apos;ll send you a link to reset it.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : 'Send Reset Link'}
            </Button>
          </form>
        </Form>
         <div className="mt-4 text-center text-sm">
            Remembered your password?{' '}
            <Link href="/login" className="font-semibold text-blue-600 hover:underline">
              Login here
            </Link>
          </div>
      </CardContent>
    </Card>
  );
}