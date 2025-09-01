'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
});

// The function is renamed to VerifyOtpForm
export function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { otp: '' },
  });

  useEffect(() => {
    if (!email) {
      setError('Email not provided. Please register first.');
    }
  }, [email]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!email) {
      setError('Email not provided.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: values.otp }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'OTP verification failed');
      }
      setMessage('Verification successful! Redirecting to login...');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendOtp() {
    if (!email) {
      setError('Email not provided.');
      return;
    }
    setIsResending(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend OTP');
      }
      setMessage(data.message || 'OTP sent successfully!');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while resending OTP.');
    } finally {
      setIsResending(false);
    }
  }

  // Error boundary for critical failures
  if (!email) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Error</CardTitle>
          <CardDescription>{error || 'Email not provided. Please register first.'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/register')} className="w-full">
            Go to Registration
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Verify Your Account</CardTitle>
        <CardDescription>Enter the 6-digit OTP sent to <strong>{email}</strong></CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center">
                  <FormLabel>One-Time Password</FormLabel>
                  <FormControl>
                    <InputOTP maxLength={6} {...field}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {message && <p className="text-green-500 text-sm text-center">{message}</p>}
            <Button type="submit" className="w-full" disabled={isLoading || !email}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</> : 'Verify OTP'}
            </Button>
            <Button type="button" variant="link" onClick={handleResendOtp} disabled={isResending || !email} className="w-full">
              {isResending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Resending...</> : 'Resend OTP'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}