'use client';

import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/reset-password';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// A dedicated loading component for a better visual experience
function LoadingState() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
          <p className="mt-4 text-gray-500">Loading Form...</p>
        </CardContent>
      </CardHeader>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
      <Suspense fallback={<LoadingState />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}