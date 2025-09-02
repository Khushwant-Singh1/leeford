'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { PasswordInput } from '@/components/password-input';

const formSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or phone number is required'),
  password: z.string().min(1, 'Password is required'),
});

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { emailOrPhone: '', password: '' },
  });

  // Check for verification success message
  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      toast.success('Account verified successfully! You can now log in.');
      const email = searchParams.get('email');
      if (email) {
        form.setValue('emailOrPhone', decodeURIComponent(email));
      }
    }
  }, [searchParams, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // First, check credentials and verification status
      const checkResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrPhone: values.emailOrPhone,
          password: values.password,
        }),
      });

      const checkData = await checkResponse.json();

      if (checkData.needsVerification) {
        // User exists but not verified, OTP has been sent
        toast.info(checkData.message);
        router.push(`/verify-otp?email=${encodeURIComponent(checkData.email)}&resent=true`);
        return;
      }

      if (!checkResponse.ok) {
        // Invalid credentials or other error
        toast.error(checkData.error || 'Invalid credentials');
        return;
      }

      // Credentials are valid and user is verified, proceed with NextAuth
      const result = await signIn('credentials', {
        redirect: false,
        emailOrPhone: values.emailOrPhone,
        password: values.password,
      });

      if (result?.error) {
        toast.error('Login failed. Please try again.');
      } else if (result?.ok) {
        toast.success('Login successful!');
        router.push('/profile');
        router.refresh();
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  }


  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        {/* Add your logo here */}
        {/* <img src="/logo.svg" alt="Leeford Logo" className="w-24 mx-auto mb-4" /> */}
        <CardTitle className="text-2xl font-bold">Welcome Back!</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="emailOrPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email or Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com or +1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                      Forgot Password?
                    </Link>
                  </div>
                  <FormControl>
                    <PasswordInput placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </Form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground dark:bg-slate-950">
              Or continue with
            </span>
          </div>
        </div>
        
        {/* Add Social Login Buttons here if you have them */}
        <Button variant="outline" className="w-full">
           {/* <IconGoogle className="mr-2 h-4 w-4" /> */}
           Sign in with Google
        </Button>
        
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-blue-600 hover:underline">
            Register here
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}