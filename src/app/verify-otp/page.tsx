import { Suspense } from 'react';
import { VerifyOtpForm } from '@/components/verify-otp-form';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// A more accurate skeleton loader
function OtpFormSkeleton() {
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-2 text-center">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center space-x-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-10 rounded-md" />)}
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-5 w-1/2 mx-auto" />
      </CardContent>
    </Card>
  );
}

// Wrapper component to allow use of client hooks inside Suspense
function VerifyOtpClientWrapper() {
  return (
    <Suspense fallback={<OtpFormSkeleton />}>
      <VerifyOtpForm />
    </Suspense>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      <VerifyOtpClientWrapper />
    </div>
  );
}