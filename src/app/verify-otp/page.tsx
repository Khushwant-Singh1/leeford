import { Suspense } from 'react';
import { VerifyOtpForm } from '@/components/ui/verify-otp-form'; // Adjust the import path if needed
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// A simple skeleton loader to show while the form is loading
function OtpFormSkeleton() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <Skeleton className="h-12 w-64" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-6 w-full" />
      </CardContent>
    </Card>
  );
}


export default function VerifyOtpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Suspense fallback={<OtpFormSkeleton />}>
        <VerifyOtpForm />
      </Suspense>
    </div>
  );
}